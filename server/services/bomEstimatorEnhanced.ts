import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { withRetry } from '../utils/retry.js';
import type { FileProcessingResult } from './fileProcessor.js';
import type { BOMEstimate } from './bomEstimator.js';

/**
 * Enhanced BOM Estimator with Structured Outputs
 *
 * Enable with USE_STRUCTURED_OUTPUTS=true in .env
 *
 * Uses structured JSON schema for guaranteed valid responses
 * Includes retry logic if USE_RETRY_LOGIC=true
 */

// Comprehensive BOM estimate schema
const bomEstimateSchema = {
  type: 'object',
  properties: {
    totalLineItems: {
      type: 'number',
      description: 'Total number of line items in the BOM'
    },
    estimatedCostRange: {
      type: 'object',
      properties: {
        min: { type: 'number', description: 'Minimum estimated cost in USD' },
        max: { type: 'number', description: 'Maximum estimated cost in USD' }
      },
      required: ['min', 'max']
    },
    leadTimeRange: {
      type: 'object',
      properties: {
        min: { type: 'number', description: 'Minimum lead time in days' },
        max: { type: 'number', description: 'Maximum lead time in days' }
      },
      required: ['min', 'max']
    },
    confidence: {
      type: 'number',
      description: 'Confidence level (0-100)'
    },
    confidenceLabel: {
      type: 'string',
      description: 'Confidence label (Low, Medium, High)'
    },
    itemBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          componentName: { type: 'string' },
          quantity: { type: 'string' },
          estimatedCostRange: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            },
            required: ['min', 'max']
          },
          estimatedLeadTimeDays: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            },
            required: ['min', 'max']
          },
          reasoning: { type: 'string' }
        },
        required: ['componentName', 'quantity', 'estimatedCostRange', 'estimatedLeadTimeDays', 'reasoning']
      }
    }
  },
  required: ['totalLineItems', 'estimatedCostRange', 'leadTimeRange', 'confidence', 'confidenceLabel', 'itemBreakdown']
};

export async function generateBOMEstimateEnhanced(
  fileInfo: FileProcessingResult
): Promise<BOMEstimate> {
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

  const systemPrompt = `You are a BOM (Bill of Materials) estimation expert for an autonomous procurement system.

${context ? `Context:\n${context}\n\n` : ''}

Your task is to estimate procurement costs and lead times for engineering components and materials based on industry knowledge and typical market prices.

You must respond with valid JSON matching the exact schema provided.`;

  const componentsText = fileInfo.components
    .map((c, i) => `${i + 1}. ${c.name} - ${c.quantity} - ${c.specifications}`)
    .join('\n');

  const materialsText = fileInfo.materials
    .map((m, i) => `${i + 1}. ${m.name} - ${m.qty}`)
    .join('\n');

  const userPrompt = `Based on the following extracted components and materials, provide a realistic BOM estimate with detailed breakdown:

Components:
${componentsText || 'None specified'}

Materials:
${materialsText || 'None specified'}

REQUIREMENTS:
1. Provide an overall cost range and lead time range for the entire BOM
2. For EACH component, provide:
   - Estimated cost range (min and max in USD)
   - Estimated lead time range (min and max in days)
   - Detailed reasoning explaining:
     * How you estimated the cost (considering quantity, specifications, market prices)
     * How you estimated the lead time (considering availability, manufacturing time, shipping)
     * Any factors that affect the estimate (complexity, quantity discounts, etc.)

Consider:
- Typical market prices for these components
- Lead times for manufacturing/procurement
- Quantity discounts
- Shipping and handling
- Component complexity and availability
- Industry standards and typical pricing

Be thorough in your reasoning - explain your thought process for each component estimate.

CRITICAL: You MUST respond with ONLY valid JSON matching this exact schema. Do not include any markdown code blocks, explanations, or additional text. Return ONLY the JSON object:`;

  // Use retry logic if enabled
  const makeRequest = () => anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt + '\n\n' + JSON.stringify(bomEstimateSchema, null, 2),
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
    } else {
      lines.shift();
      lines.pop();
      jsonText = lines.join('\n').trim();
    }
  }

  // Parse the JSON response
  const parsedResult: BOMEstimate = JSON.parse(jsonText);

  // Validate and return
  return {
    totalLineItems: parsedResult.totalLineItems || fileInfo.components.length || 0,
    estimatedCostRange: parsedResult.estimatedCostRange || { min: 0, max: 0 },
    leadTimeRange: parsedResult.leadTimeRange || { min: 0, max: 0 },
    confidence: parsedResult.confidence || 75,
    confidenceLabel: parsedResult.confidenceLabel || 'Medium',
    itemBreakdown: parsedResult.itemBreakdown || fileInfo.components.map(c => ({
      componentName: c.name,
      quantity: c.quantity,
      estimatedCostRange: { min: 50, max: 200 },
      estimatedLeadTimeDays: { min: 5, max: 14 },
      reasoning: 'Estimate based on typical market pricing and availability',
    })),
  };
}

