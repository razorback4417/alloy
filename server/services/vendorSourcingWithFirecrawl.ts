import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { withRetry } from '../utils/retry.js';
import { findVendorUrls, scrapeVendorWebsite } from './firecrawlService.js';
import type { VendorSourcingRequest, VendorSourcingResponse, ComponentVendorSearch, Vendor } from './vendorSourcing.js';

/**
 * Enhanced Vendor Sourcing with Firecrawl Integration
 *
 * Enable with USE_FIRECRAWL=true in .env
 *
 * This implementation:
 * 1. Finds real vendor website URLs using Claude
 * 2. Scrapes vendor websites using Firecrawl
 * 3. Extracts real contact information (emails, phone numbers)
 * 4. Uses scraped data to enhance vendor information
 * 5. Falls back gracefully if scraping fails
 */

// Comprehensive vendor search schema (same as vendorSourcingEnhanced.ts)
const vendorSearchSchema = {
  type: 'object',
  properties: {
    componentName: {
      type: 'string',
      description: 'Name of the component being sourced'
    },
    quantity: {
      type: 'number',
      description: 'Quantity needed'
    },
    specifications: {
      type: 'string',
      description: 'Component specifications'
    },
    vendors: {
      type: 'array',
      description: 'List of vendors that can supply this component',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vendor company name' },
          pricePerUnit: { type: 'number', description: 'Price per unit in USD' },
          moq: { type: 'number', description: 'Minimum Order Quantity' },
          leadTime: { type: 'number', description: 'Lead time in days' },
          shipping: { type: 'number', description: 'Shipping cost in USD' },
          reliability: { type: 'number', description: 'Vendor reliability percentage (80-99)' },
          qualityScore: { type: 'number', description: 'Component quality score percentage (85-98)' },
          locusWhitelist: { type: 'boolean', description: 'Whether vendor is on Locus whitelist' },
          datasheetAttrs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key specifications from datasheet'
          },
          risks: { type: 'string', description: 'Risk notes or concerns' },
          walletAddress: {
            type: 'string',
            description: 'Vendor wallet address for Locus payments (0x... format)'
          },
          email: { type: 'string', description: 'Vendor contact email' },
          websiteUrl: { type: 'string', description: 'Vendor website URL' },
          emailExtracted: { type: 'boolean', description: 'Whether email was extracted from website' }
        },
        required: ['name', 'pricePerUnit', 'moq', 'leadTime', 'shipping', 'reliability', 'qualityScore', 'locusWhitelist', 'datasheetAttrs', 'risks']
      }
    },
    totalCostRange: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' }
      },
      required: ['min', 'max']
    },
    reasoning: {
      type: 'string',
      description: 'Explanation of vendor selection and reasoning'
    }
  },
  required: ['componentName', 'quantity', 'specifications', 'vendors', 'totalCostRange', 'reasoning']
};

export async function searchVendorsForComponentWithFirecrawl(
  anthropic: Anthropic,
  component: { name: string; quantity: number; specifications: string },
  spendingLimit: number,
  priorities: { quality: boolean; speed: boolean; cost: boolean },
  context: string
): Promise<ComponentVendorSearch> {
  console.log(`[Firecrawl] Searching vendors for: ${component.name}`);

  // Step 1: Find real vendor URLs
  let vendorUrls: Array<{ name: string; websiteUrl: string; confidence: string; reason: string }> = [];
  let scrapedData: Array<{ vendorName: string; url: string; markdown: string; extracted?: any } | null> = [];

  try {
    console.log(`[Firecrawl] Finding vendor URLs for: ${component.name}`);
    vendorUrls = await findVendorUrls(component.name, component.specifications);
    console.log(`[Firecrawl] Found ${vendorUrls.length} vendor URLs`);

    // Step 2: Scrape vendor websites (with timeout and error handling)
    if (vendorUrls.length > 0) {
      console.log(`[Firecrawl] Scraping ${vendorUrls.length} vendor websites...`);
      scrapedData = await Promise.allSettled(
        vendorUrls.map(candidate =>
          Promise.race([
            scrapeVendorWebsite(candidate.websiteUrl),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 30000)
            )
          ])
        )
      ).then(results =>
        results.map((result, idx) =>
          result.status === 'fulfilled'
            ? {
                ...result.value,
                vendorName: vendorUrls[idx].name,
                url: vendorUrls[idx].websiteUrl,
              }
            : null
        )
      );
      console.log(`[Firecrawl] Successfully scraped ${scrapedData.filter(Boolean).length} vendor websites`);
    }
  } catch (error) {
    console.warn(`[Firecrawl] Vendor URL discovery/scraping failed, continuing with Claude-only approach:`, error);
  }

  // Step 3: Build context from scraped data
  const scrapedContext = scrapedData
    .filter(Boolean)
    .map((data, idx) => {
      const vendor = vendorUrls[idx];
      return `
Vendor ${idx + 1}: ${data!.vendorName}
URL: ${data!.url}
Website Content (first 2000 chars):
${data!.markdown.substring(0, 2000)}...
Extracted Emails: ${data!.extracted?.emails?.join(', ') || 'Not found'}
Extracted Phone Numbers: ${data!.extracted?.phoneNumbers?.join(', ') || 'Not found'}
`;
    })
    .join('\n\n');

  const systemPrompt = `You are a vendor sourcing agent for an autonomous procurement system.

${context ? `Context:\n${context}\n\n` : ''}

Your task is to find 3-5 real vendors for a specific engineering component, providing realistic pricing, lead times, and vendor information.

${scrapedContext ? `\nREAL VENDOR DATA FROM WEBSITES:\n${scrapedContext}\n\nUse this real data when available. Extract emails from the scraped content if found.` : ''}

You must respond with valid JSON matching the exact schema provided.`;

  const priorityText = [
    priorities.quality && 'High Quality & Reliability',
    priorities.speed && 'Fast Delivery',
    priorities.cost && 'Cost Optimization',
  ]
    .filter(Boolean)
    .join(', ');

  const userPrompt = `Find vendors for the following component:

Component: ${component.name}
Quantity: ${component.quantity}
Specifications: ${component.specifications}
Spending Limit: $${spendingLimit}
Priorities: ${priorityText || 'None specified'}

${scrapedContext ? `\nREAL VENDOR DATA (use this when available):\n${scrapedContext}\n` : ''}

REQUIREMENTS:
1. Find 3-5 realistic vendors that could supply this component
2. For each vendor, provide:
   - Company name (use real vendor names from scraped data if available)
   - Website URL (include the actual URL from scraped data)
   - Price per unit (estimate based on component type, or extract from scraped data if available)
   - Email address (use extracted emails from scraped data, or generate realistic email)
   - Wallet address (REQUIRED - format: 0x... for Base Sepolia network)
   - Minimum Order Quantity (MOQ)
   - Lead time in days
   - Shipping cost (in USD)
   - Reliability percentage (80-99%)
   - Quality score percentage (85-98%)
   - Locus whitelist status (true/false)
   - Datasheet attributes (array of 3-5 key specs)
   - Risk notes
   - emailExtracted: true if email came from scraped data, false otherwise

3. When real scraped data is available:
   - Use the actual vendor name and website URL from scraped data
   - Use extracted emails from the website (set emailExtracted: true)
   - Estimate pricing based on scraped content if possible
   - Include sourceLinks array with URLs to product pages if mentioned

4. When scraped data is not available:
   - Generate realistic vendor information as before
   - Still include websiteUrl field (can be estimated)
   - Set emailExtracted: false

5. Consider the priorities:
   - If "High Quality" is selected: prioritize vendors with higher quality scores and reliability
   - If "Fast Delivery" is selected: prioritize vendors with shorter lead times
   - If "Cost Optimization" is selected: prioritize vendors with lower prices

6. Ensure total cost (price * quantity + shipping) fits within the spending limit when possible

7. Provide reasoning explaining:
   - How you selected these vendors
   - Why these vendors are suitable for this component
   - How priorities influenced the selection
   - Whether real scraped data was used
   - Any trade-offs or considerations

CRITICAL: You MUST respond with ONLY valid JSON matching this exact schema. Do not include any markdown code blocks, explanations, or additional text. Return ONLY the JSON object:`;

  // Use retry logic if enabled
  const makeRequest = () => anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt + '\n\n' + JSON.stringify(vendorSearchSchema, null, 2),
      },
    ],
  });

  const message = await withRetry(makeRequest);

  // Extract the text content from the response
  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API');
  }

  // Extract JSON from the response (handle markdown code blocks)
  let jsonText = content.text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n');
    const startIndex = lines.findIndex((line: string) => line.trim().startsWith('```'));
    const endIndex = lines.findIndex((line: string, idx: number) => idx > startIndex && line.trim().startsWith('```'));
    if (startIndex !== -1 && endIndex !== -1) {
      jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
    }
  }

  // Parse JSON
  try {
    const result = JSON.parse(jsonText) as ComponentVendorSearch;

    // Validate structure
    if (!result.componentName || !result.vendors || !Array.isArray(result.vendors)) {
      throw new Error('Invalid response structure from vendor search');
    }

    // Calculate total cost range if not provided
    if (!result.totalCostRange) {
      const costs = result.vendors.map(v => (v.pricePerUnit * component.quantity) + v.shipping);
      result.totalCostRange = {
        min: Math.min(...costs),
        max: Math.max(...costs),
      };
    }

    // Add website URLs and email extraction flags from scraped data
    result.vendors.forEach((vendor, idx) => {
      const scraped = scrapedData[idx];
      if (scraped) {
        // Add website URL if not already present
        if (!vendor.websiteUrl) {
          (vendor as any).websiteUrl = scraped.url;
        }
        // Mark email as extracted if it came from scraped data
        if (scraped.extracted?.emails?.length > 0 && vendor.email) {
          (vendor as any).emailExtracted = scraped.extracted.emails.includes(vendor.email);
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error parsing vendor search response:', error);
    console.error('Response text:', jsonText);
    throw new Error(`Failed to parse vendor search response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

