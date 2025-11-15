import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Vendor {
  name: string;
  pricePerUnit: number;
  moq: number; // Minimum Order Quantity
  leadTime: number; // days
  shipping: number; // shipping cost
  reliability: number; // percentage
  qualityScore: number; // percentage
  locusWhitelist: boolean;
  datasheetAttrs: string[];
  risks: string;
  walletAddress?: string; // For Locus payments
  contactId?: number; // For Locus contact payments
  email?: string; // For Locus email payments
}

export interface ComponentVendorSearch {
  componentName: string;
  quantity: number;
  specifications: string;
  vendors: Vendor[];
  totalCostRange: {
    min: number;
    max: number;
  };
  reasoning: string;
}

export interface VendorSourcingRequest {
  components: Array<{
    name: string;
    quantity: number;
    specifications: string;
  }>;
  spendingLimit: number;
  priorities: {
    quality: boolean;
    speed: boolean;
    cost: boolean;
  };
}

export interface VendorSourcingResponse {
  componentSearches: ComponentVendorSearch[];
  totalEstimatedCost: {
    min: number;
    max: number;
  };
  insights: {
    costSavings?: number;
    leadTimeOptimization?: number;
    moqConflicts?: number;
    vendorRisks: 'Low' | 'Medium' | 'High';
  };
}

export async function sourceVendors(
  request: VendorSourcingRequest
): Promise<VendorSourcingResponse> {
  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  if (!apiKey.startsWith('sk-')) {
    throw new Error('ANTHROPIC_API_KEY appears to be invalid (should start with sk-)');
  }

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: apiKey.trim(),
  });

  // Load CONTEXT.md for system context
  const contextPath = path.join(process.cwd(), 'CONTEXT.md');
  const context = await fs.readFile(contextPath, 'utf-8').catch(() => '');

  // Process each component with its own "agent" call
  const componentSearches: ComponentVendorSearch[] = [];

  for (let i = 0; i < request.components.length; i++) {
    const component = request.components[i];
    console.log(`[${i + 1}/${request.components.length}] Searching vendors for: ${component.name}`);

    try {
      const searchResult = await searchVendorsForComponent(
        anthropic,
        component,
        request.spendingLimit,
        request.priorities,
        context
      );
      componentSearches.push(searchResult);
      console.log(`[${i + 1}/${request.components.length}] Found ${searchResult.vendors.length} vendors for ${component.name}`);
    } catch (error) {
      console.error(`[${i + 1}/${request.components.length}] Error searching vendors for ${component.name}:`, error);
      throw error; // Re-throw to stop processing
    }
  }

  // Calculate totals and insights
  const totalMin = componentSearches.reduce((sum, search) => sum + search.totalCostRange.min, 0);
  const totalMax = componentSearches.reduce((sum, search) => sum + search.totalCostRange.max, 0);

  // Calculate insights
  const insights = calculateInsights(componentSearches, request);

  return {
    componentSearches,
    totalEstimatedCost: {
      min: totalMin,
      max: totalMax,
    },
    insights,
  };
}

async function searchVendorsForComponent(
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
   - Wallet address (optional, format: 0x... for Base Sepolia network)
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

Return your response as valid JSON matching this exact structure:
{
  "componentName": "${component.name}",
  "quantity": ${component.quantity},
  "specifications": "${component.specifications}",
  "vendors": [
    {
      "name": "Vendor Name",
      "pricePerUnit": 14.50,
      "moq": 25,
      "leadTime": 7,
      "shipping": 35,
      "reliability": 98,
      "qualityScore": 95,
      "locusWhitelist": true,
      "datasheetAttrs": ["Spec 1", "Spec 2", "Spec 3"],
      "risks": "None identified",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "email": "sales@vendorname.com"
    }
  ],
  "totalCostRange": {
    "min": 1200,
    "max": 1800
  },
  "reasoning": "Detailed explanation of vendor selection..."
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192, // Increased for detailed vendor responses
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

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

function calculateInsights(
  componentSearches: ComponentVendorSearch[],
  request: VendorSourcingRequest
): VendorSourcingResponse['insights'] {
  // Calculate cost savings (difference between highest and lowest total)
  const totals = componentSearches.map(s => s.totalCostRange.max);
  const maxTotal = Math.max(...totals);
  const minTotal = Math.min(...totals);
  const costSavings = maxTotal > minTotal ? Math.round(maxTotal - minTotal) : 0;

  // Calculate lead time optimization (average lead time reduction)
  const avgLeadTime = componentSearches.reduce((sum, search) => {
    const avg = search.vendors.reduce((s, v) => s + v.leadTime, 0) / search.vendors.length;
    return sum + avg;
  }, 0) / componentSearches.length;

  // Count MOQ conflicts (vendors with MOQ > requested quantity)
  let moqConflicts = 0;
  componentSearches.forEach(search => {
    const conflicts = search.vendors.filter(v => v.moq > search.quantity);
    if (conflicts.length > 0) {
      moqConflicts++;
    }
  });

  // Assess vendor risks (based on reliability and quality scores)
  const allVendors = componentSearches.flatMap(s => s.vendors);
  const avgReliability = allVendors.reduce((sum, v) => sum + v.reliability, 0) / allVendors.length;
  const avgQuality = allVendors.reduce((sum, v) => sum + v.qualityScore, 0) / allVendors.length;

  let vendorRisks: 'Low' | 'Medium' | 'High' = 'Low';
  if (avgReliability < 85 || avgQuality < 85) {
    vendorRisks = 'High';
  } else if (avgReliability < 90 || avgQuality < 90) {
    vendorRisks = 'Medium';
  }

  return {
    costSavings: costSavings > 0 ? costSavings : undefined,
    leadTimeOptimization: avgLeadTime > 7 ? Math.round(avgLeadTime - 7) : undefined,
    moqConflicts: moqConflicts > 0 ? moqConflicts : undefined,
    vendorRisks,
  };
}

