/**
 * Firecrawl Service for Vendor Website Scraping
 *
 * Enable with USE_FIRECRAWL=true in .env
 *
 * Scrapes vendor websites to extract real contact information, pricing, and product details
 */

// Note: Firecrawl SDK will be installed when needed
// npm install @mendable/firecrawl-js

export interface ScrapedVendorData {
  url: string;
  markdown: string;
  html?: string;
  extracted?: {
    emails?: string[];
    phoneNumbers?: string[];
    contactPageUrl?: string;
    pricing?: any;
    productSpecs?: any;
  };
}

export interface VendorUrlCandidate {
  name: string;
  websiteUrl: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Scrape vendor website using Firecrawl
 */
export async function scrapeVendorWebsite(url: string): Promise<ScrapedVendorData> {
  // Dynamic import to avoid errors if Firecrawl is not installed
  const Firecrawl = (await import('@mendable/firecrawl-js')).default;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not set. Get your API key from https://firecrawl.dev');
  }

  const firecrawl = new Firecrawl({ apiKey });

  try {
    // Scrape with markdown format
    const doc = await firecrawl.scrape(url, {
      formats: ['markdown', 'html'],
    });

    // Extract contact information using LLM extraction
    // Note: This requires Firecrawl's extract API which may need a schema
    let extracted: ScrapedVendorData['extracted'] = undefined;

    try {
      // Try to extract contact info if extract API is available
      const extractRes = await firecrawl.extract({
        urls: [url],
        schema: {
          emails: {
            type: 'array',
            items: { type: 'string' },
            description: 'Contact email addresses found on the page'
          },
          phoneNumbers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Phone numbers if found'
          },
          contactPageUrl: {
            type: 'string',
            description: 'URL to contact page if found'
          }
        },
        prompt: 'Extract all contact email addresses, phone numbers, and contact page URLs from this vendor website. Focus on sales, procurement, and general contact information.',
      });

      if (extractRes.data && extractRes.data.length > 0) {
        extracted = extractRes.data[0].extract as ScrapedVendorData['extracted'];
      }
    } catch (extractError) {
      // Extract API might not be available or might fail - that's okay
      console.warn(`Firecrawl extraction failed for ${url}:`, extractError);
    }

    return {
      url,
      markdown: doc.markdown || '',
      html: doc.html,
      extracted,
    };
  } catch (error) {
    console.error(`Firecrawl scraping failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Find vendor URLs using Claude
 */
export async function findVendorUrls(
  componentName: string,
  specifications: string
): Promise<VendorUrlCandidate[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({ apiKey: apiKey.trim() });

  const systemPrompt = `You are a vendor research assistant. Your task is to identify real vendors that could supply engineering components.

For each vendor, provide:
- Company name (real, established companies)
- Website URL (must be a real, accessible URL)
- Confidence level (high/medium/low) based on how well they match the component
- Brief reason why this vendor is suitable

Return valid JSON only.`;

  const userPrompt = `Find 3-5 real vendors that could supply this component:

Component: ${componentName}
Specifications: ${specifications}

Return JSON array of vendors:
[
  {
    "name": "Company Name",
    "websiteUrl": "https://example.com",
    "confidence": "high",
    "reason": "Why this vendor is suitable"
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API');
  }

  let jsonText = content.text.trim();
  // Remove markdown code blocks
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n');
    const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
    const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
    if (startIndex !== -1 && endIndex !== -1) {
      jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
    }
  }

  try {
    const vendors = JSON.parse(jsonText) as VendorUrlCandidate[];
    return vendors.filter(v => v.websiteUrl && v.name);
  } catch (error) {
    console.error('Failed to parse vendor URLs:', error);
    return [];
  }
}

