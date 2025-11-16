import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { withRetry } from '../utils/retry.js';
import type { VendorSourcingRequest, VendorSourcingResponse, ComponentVendorSearch, Vendor } from './vendorSourcing.js';

/**
 * Enhanced Vendor Sourcing with Structured Outputs
 *
 * Enable with USE_STRUCTURED_OUTPUTS=true in .env
 *
 * Uses Anthropic's structured outputs for guaranteed valid JSON
 * Includes retry logic if USE_RETRY_LOGIC=true
 */

// Comprehensive vendor search schema
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
          name: {
            type: 'string',
            description: 'Vendor company name'
          },
          pricePerUnit: {
            type: 'number',
            description: 'Price per unit in USD'
          },
          moq: {
            type: 'number',
            description: 'Minimum Order Quantity'
          },
          leadTime: {
            type: 'number',
            description: 'Lead time in days'
          },
          shipping: {
            type: 'number',
            description: 'Shipping cost in USD'
          },
          reliability: {
            type: 'number',
            description: 'Vendor reliability percentage (80-99)'
          },
          qualityScore: {
            type: 'number',
            description: 'Component quality score percentage (85-98)'
          },
          locusWhitelist: {
            type: 'boolean',
            description: 'Whether vendor is on Locus whitelist'
          },
          datasheetAttrs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key specifications from datasheet'
          },
          risks: {
            type: 'string',
            description: 'Risk notes or concerns'
          },
          walletAddress: {
            type: 'string',
            description: 'Vendor wallet address for Locus payments (0x... format)'
          },
          email: {
            type: 'string',
            description: 'Vendor contact email'
          }
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

export async function searchVendorsForComponentEnhanced(
  anthropic: Anthropic,
  component: { name: string; quantity: number; specifications: string },
  spendingLimit: number,
  priorities: { quality: boolean; speed: boolean; cost: boolean },
  context: string
): Promise<ComponentVendorSearch> {
  const systemPrompt = `You are a vendor sourcing agent for an autonomous procurement system.

${context ? `Context:\n${context}\n\n` : ''}

Your task is to find 3-5 real vendors for a specific engineering component, providing realistic pricing, lead times, and vendor information.

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

REQUIREMENTS:
1. Find 3-5 realistic vendors that could supply this component
2. For each vendor, provide:
   - Realistic company name (e.g., "Acme Motors Inc.", "TechParts Supply", "Global Components Ltd.")
   - Price per unit (in USD) - must be realistic for the component type
   - Minimum Order Quantity (MOQ) - realistic for the component
   - Lead time in days - realistic manufacturing/procurement time
   - Shipping cost (in USD)
   - Reliability percentage (vendor track record, 80-99%)
   - Quality score percentage (component quality rating, 85-98%)
   - Locus whitelist status (true/false - assume true for established vendors)
   - Datasheet attributes (array of 3-5 key specs from datasheet)
   - Risk notes (any concerns or issues)
   - Wallet address (REQUIRED - format: 0x... for Base Sepolia network, generate realistic addresses)
   - Email address (realistic business email format, e.g., "sales@acmemotors.com", "procurement@techparts.com")

3. Consider the priorities:
   - If "High Quality" is selected: prioritize vendors with higher quality scores and reliability
   - If "Fast Delivery" is selected: prioritize vendors with shorter lead times
   - If "Cost Optimization" is selected: prioritize vendors with lower prices

4. Ensure total cost (price * quantity + shipping) fits within the spending limit when possible

5. Provide reasoning explaining:
   - How you selected these vendors
   - Why these vendors are suitable for this component
   - How priorities influenced the selection
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

    return result;
  } catch (error) {
    console.error('Error parsing vendor search response:', error);
    console.error('Response text:', jsonText);
    throw new Error(`Failed to parse vendor search response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

