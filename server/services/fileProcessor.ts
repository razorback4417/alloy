import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { processDesignFileEnhanced, convertToBasicFormat } from './fileProcessorEnhanced.js';

export interface FileProcessingResult {
  pages: number;
  components: Array<{
    name: string;
    quantity: string;
    specifications: string;
  }>;
  materials: Array<{
    name: string;
    qty: string;
  }>;
}

/**
 * Process design file - uses enhanced processing if enabled, otherwise basic processing
 *
 * Set ENHANCED_FILE_PROCESSING=true in .env to use comprehensive extraction
 * Enhanced mode extracts: materials, electrical/thermal/mechanical specs,
 * certifications (UL/IEC), environmental constraints, quantities & tolerances
 */
export async function processDesignFile(
  fileContent: string,
  fileName: string,
  fileSize: number
): Promise<FileProcessingResult> {
  // Check if enhanced processing is enabled
  const useEnhanced = process.env.ENHANCED_FILE_PROCESSING === 'true';

  if (useEnhanced) {
    console.log('Using enhanced file processing with comprehensive extraction');
    const enhanced = await processDesignFileEnhanced(fileContent, fileName, fileSize);
    return convertToBasicFormat(enhanced);
  }

  // Basic processing (original implementation)
  try {
    // Validate API key is present
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new Error('ANTHROPIC_API_KEY appears to be invalid (should start with sk-)');
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey.trim(), // Trim any whitespace
    });

    // Load CONTEXT.md for system context
    const contextPath = path.join(process.cwd(), 'CONTEXT.md');
    const context = await fs.readFile(contextPath, 'utf-8').catch(() => '');

    // Create system prompt
    const systemPrompt = `You are an engineering file processor for an autonomous procurement system.

${context ? `Context:\n${context}\n\n` : ''}

Your task is to analyze engineering design files and extract ALL information accurately:

1. **Pages/Sections**: Count the number of main sections or pages in the document
2. **Components**: Extract EVERY component listed. Each component should include:
   - The exact component name as written
   - The exact quantity as specified (e.g., "3 units", "1 sheet", "2 sets")
   - The complete specifications as written
3. **Materials**: Extract ALL unique materials mentioned. Materials are raw materials like:
   - Aluminum (extract from component names like "6061-T6 Aluminum Plate" → material: "6061-T6 Aluminum")
   - Steel types (stainless steel, steel, etc. - extract from specifications like "stainless" or "stainless steel")
   - Other raw materials (copper, rubber, plastic, etc.)
   - For each material, use the quantity from the component that mentions it
   - If the same material appears in multiple components, list it once with the combined quantity or list separately per component
   - Use exact material names (e.g., "6061-T6 Aluminum", "Stainless Steel")

CRITICAL: Extract EVERY item. Do not skip any components or materials. Be thorough and complete.

You must respond with valid JSON matching the exact schema provided.`;

    // Define the JSON schema for structured output
    const responseSchema = {
      name: 'file_processing_result',
      description: 'Extracted information from engineering design file',
      schema: {
        type: 'object',
        properties: {
          pages: {
            type: 'number',
            description: 'Number of pages or sections in the document',
          },
          components: {
            type: 'array',
            description: 'List of components found in the file',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Component name',
                },
                quantity: {
                  type: 'string',
                  description: 'Quantity with units (e.g., "3 units", "1 sheet")',
                },
                specifications: {
                  type: 'string',
                  description: 'Component specifications',
                },
              },
              required: ['name', 'quantity', 'specifications'],
            },
          },
          materials: {
            type: 'array',
            description: 'List of materials found in the file',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Material name',
                },
                qty: {
                  type: 'string',
                  description: 'Quantity with units',
                },
              },
              required: ['name', 'qty'],
            },
          },
        },
        required: ['pages', 'components', 'materials'],
      },
    };

    const userPrompt = `Analyze the following engineering design file and extract ALL information:

File name: ${fileName}
File size: ${fileSize} bytes

File content:
\`\`\`
${fileContent}
\`\`\`

EXTRACTION REQUIREMENTS:

1. **Pages**: Count main sections (e.g., if there's a "# Material List" and "## Components", that's 2 sections)

2. **Components**: Extract EVERY numbered item or component listed. For each component:
   - Use the exact component name (e.g., "NEMA23 Stepper Motor", "6061-T6 Aluminum Plate")
   - Extract the exact quantity as written (e.g., "3 units", "1 sheet", "2 sets")
   - Include the complete specifications text

3. **Materials**: Extract ALL raw materials mentioned. For each material found:
   - **From component names**: If a component name contains a material (e.g., "6061-T6 Aluminum Plate"), extract the material part (e.g., "6061-T6 Aluminum") with the component's quantity
   - **From specifications**: If specifications mention materials (e.g., "stainless", "stainless steel", "aluminum"), extract them with the component's quantity
   - **Material names**: Use full material names:
     * "6061-T6 Aluminum" (not just "Aluminum")
     * "Stainless Steel" (not just "stainless")
   - **Quantities**: Use the exact quantity from the component that mentions the material
   - **List separately**: If the same material appears in multiple components, you can list them separately or combine quantities
   - **Examples**:
     * Component "6061-T6 Aluminum Plate" (1 sheet) → Material: "6061-T6 Aluminum" (1 sheet)
     * Component "Ball Screw + Nut Kit" with spec "stainless, 1200 mm" (2 sets) → Material: "Stainless Steel" (2 sets)
     * Component "Linear Guide Rails" with spec "stainless steel" (4 sets) → Material: "Stainless Steel" (4 sets)

IMPORTANT:
- Extract EVERY component - do not miss any
- Extract ALL materials - check both component names AND specifications
- Use exact text from the file - do not paraphrase
- Be complete and thorough

EXAMPLE: If the file contains:
"1. **6061-T6 Aluminum Plate**
   - Quantity: 1 sheet
   - Specifications: 500×400×10 mm, precision cut"

Then extract:
- Component: { name: "6061-T6 Aluminum Plate", quantity: "1 sheet", specifications: "500×400×10 mm, precision cut" }
- Material: { name: "6061-T6 Aluminum", qty: "1 sheet" }

Return your response as valid JSON matching the schema.`;

    // Make API call
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt + '\n\nIMPORTANT: Respond with ONLY valid JSON matching this exact structure:\n' + JSON.stringify(responseSchema.schema, null, 2),
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
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line (```)
      lines.pop();
      jsonText = lines.join('\n').trim();
    }

    // Parse the JSON response
    const parsedResult: FileProcessingResult = JSON.parse(jsonText);

    // Validate and set defaults
    return {
      pages: parsedResult.pages || 1,
      components: parsedResult.components || [],
      materials: parsedResult.materials || [],
    };
  } catch (error) {
    console.error('Error in file processing:', error);
    throw error; // Re-throw to let the caller handle it
  }
}


