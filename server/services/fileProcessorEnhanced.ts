import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Enhanced File Processing with Comprehensive Engineering Component Extraction
 *
 * This implementation uses Anthropic's structured outputs to extract:
 * - Required materials
 * - Electrical/thermal/mechanical specs
 * - Certifications (UL/IEC for solar, etc.)
 * - Environmental constraints
 * - Quantities & tolerances
 *
 * Switch between this and the basic implementation via ENHANCED_FILE_PROCESSING env var
 */

export interface EnhancedComponent {
  name: string;
  quantity: string;
  specifications: string;

  // Enhanced fields
  requiredMaterials?: Array<{
    name: string;
    quantity: string;
    grade?: string; // e.g., "6061-T6", "304 Stainless"
  }>;

  electricalSpecs?: {
    voltage?: string;
    current?: string;
    power?: string;
    frequency?: string;
    resistance?: string;
    capacitance?: string;
    inductance?: string;
    [key: string]: string | undefined; // Allow other electrical properties
  };

  thermalSpecs?: {
    operatingTemperature?: string;
    storageTemperature?: string;
    thermalConductivity?: string;
    heatDissipation?: string;
    [key: string]: string | undefined;
  };

  mechanicalSpecs?: {
    dimensions?: string;
    weight?: string;
    torque?: string;
    force?: string;
    pressure?: string;
    tolerance?: string;
    surfaceFinish?: string;
    [key: string]: string | undefined;
  };

  certifications?: Array<{
    standard: string; // e.g., "UL", "IEC", "CE", "RoHS", "ISO"
    number?: string; // Certification number if available
    description?: string;
  }>;

  environmentalConstraints?: {
    operatingEnvironment?: string; // e.g., "indoor", "outdoor", "harsh"
    humidityRange?: string;
    altitudeRange?: string;
    weatherRating?: string; // e.g., "IP65", "IP67"
    uvResistance?: string;
    corrosionResistance?: string;
    [key: string]: string | undefined;
  };

  tolerances?: {
    dimensional?: string;
    electrical?: string;
    mechanical?: string;
    [key: string]: string | undefined;
  };

  notes?: string; // Any additional important information
}

export interface EnhancedFileProcessingResult {
  pages: number;
  components: EnhancedComponent[];
  materials: Array<{
    name: string;
    qty: string;
    grade?: string;
  }>;

  // Additional metadata
  documentType?: string; // e.g., "BOM", "CAD", "Specification Sheet"
  projectName?: string;
  revision?: string;
  date?: string;
}

/**
 * Enhanced file processing using Anthropic structured outputs
 * Extracts comprehensive engineering data from PDFs, screenshots, CAD exports
 */
export async function processDesignFileEnhanced(
  fileContent: string,
  fileName: string,
  fileSize: number
): Promise<EnhancedFileProcessingResult> {
  try {
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

    // Comprehensive system prompt
    const systemPrompt = `You are an expert engineering file processor for an autonomous procurement system.

${context ? `Context:\n${context}\n\n` : ''}

Your task is to analyze engineering design files (PDFs, screenshots, CAD exports, BOMs) and extract COMPREHENSIVE structured data.

You must extract:
1. **Components** with full engineering specifications:
   - Required materials (with grades/alloys)
   - Electrical specifications (voltage, current, power, etc.)
   - Thermal specifications (operating temp, thermal conductivity, etc.)
   - Mechanical specifications (dimensions, weight, torque, tolerances, etc.)
   - Certifications (UL, IEC, CE, RoHS, ISO, etc.)
   - Environmental constraints (operating environment, IP ratings, etc.)
   - Tolerances (dimensional, electrical, mechanical)

2. **Materials** with grades and quantities

3. **Document metadata** (type, project name, revision, date)

Be thorough - extract ALL available information. If a specification is not mentioned, leave it undefined.
For certifications, look for standard names like "UL", "IEC 61730", "CE", "RoHS", "ISO 9001", etc.
For environmental constraints, look for IP ratings, operating conditions, weather resistance, etc.

You must respond with valid JSON matching the exact schema provided.`;

    // Comprehensive JSON schema for structured output
    const componentSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name as written in the document'
        },
        quantity: {
          type: 'string',
          description: 'Quantity with units (e.g., "3 units", "1 sheet", "2 sets")'
        },
        specifications: {
          type: 'string',
          description: 'Complete specifications text from the document'
        },
        requiredMaterials: {
          type: 'array',
          description: 'Required materials for this component',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Material name (e.g., "Aluminum", "Steel")' },
              quantity: { type: 'string', description: 'Quantity with units' },
              grade: { type: 'string', description: 'Material grade/alloy (e.g., "6061-T6", "304 Stainless")' }
            },
            required: ['name', 'quantity']
          }
        },
        electricalSpecs: {
          type: 'object',
          description: 'Electrical specifications',
          properties: {
            voltage: { type: 'string', description: 'Voltage rating (e.g., "12V", "110-240V AC")' },
            current: { type: 'string', description: 'Current rating (e.g., "2A", "500mA")' },
            power: { type: 'string', description: 'Power rating (e.g., "100W", "50W max")' },
            frequency: { type: 'string', description: 'Frequency (e.g., "50/60Hz", "DC")' },
            resistance: { type: 'string', description: 'Resistance (e.g., "10Ω", "1kΩ")' },
            capacitance: { type: 'string', description: 'Capacitance (e.g., "100µF", "10nF")' },
            inductance: { type: 'string', description: 'Inductance (e.g., "10mH")' }
          }
        },
        thermalSpecs: {
          type: 'object',
          description: 'Thermal specifications',
          properties: {
            operatingTemperature: { type: 'string', description: 'Operating temperature range (e.g., "-40°C to +85°C")' },
            storageTemperature: { type: 'string', description: 'Storage temperature range' },
            thermalConductivity: { type: 'string', description: 'Thermal conductivity (e.g., "205 W/m·K")' },
            heatDissipation: { type: 'string', description: 'Heat dissipation rating' }
          }
        },
        mechanicalSpecs: {
          type: 'object',
          description: 'Mechanical specifications',
          properties: {
            dimensions: { type: 'string', description: 'Dimensions (e.g., "100×50×25 mm", "2"×3"×1"")' },
            weight: { type: 'string', description: 'Weight (e.g., "500g", "2.5 lbs")' },
            torque: { type: 'string', description: 'Torque rating (e.g., "45 N·cm", "5 lb·ft")' },
            force: { type: 'string', description: 'Force rating (e.g., "100N", "50 lbs")' },
            pressure: { type: 'string', description: 'Pressure rating (e.g., "100 PSI", "5 bar")' },
            tolerance: { type: 'string', description: 'General tolerance (e.g., "±0.1mm", "±0.005"")' },
            surfaceFinish: { type: 'string', description: 'Surface finish (e.g., "Ra 0.8", "32 microinch")' }
          }
        },
        certifications: {
          type: 'array',
          description: 'Certifications and standards compliance',
          items: {
            type: 'object',
            properties: {
              standard: {
                type: 'string',
                description: 'Certification standard (e.g., "UL", "IEC", "CE", "RoHS", "ISO")'
              },
              number: {
                type: 'string',
                description: 'Certification number if available (e.g., "IEC 61730", "UL 1703")'
              },
              description: {
                type: 'string',
                description: 'Additional certification details'
              }
            },
            required: ['standard']
          }
        },
        environmentalConstraints: {
          type: 'object',
          description: 'Environmental operating constraints',
          properties: {
            operatingEnvironment: {
              type: 'string',
              description: 'Operating environment (e.g., "indoor", "outdoor", "harsh", "marine")'
            },
            humidityRange: {
              type: 'string',
              description: 'Humidity range (e.g., "10-90% RH", "non-condensing")'
            },
            altitudeRange: {
              type: 'string',
              description: 'Altitude range (e.g., "0-2000m", "sea level to 3000m")'
            },
            weatherRating: {
              type: 'string',
              description: 'IP rating or weather resistance (e.g., "IP65", "IP67", "NEMA 4X")'
            },
            uvResistance: {
              type: 'string',
              description: 'UV resistance rating'
            },
            corrosionResistance: {
              type: 'string',
              description: 'Corrosion resistance (e.g., "salt spray", "marine grade")'
            }
          }
        },
        tolerances: {
          type: 'object',
          description: 'Tolerance specifications',
          properties: {
            dimensional: {
              type: 'string',
              description: 'Dimensional tolerances (e.g., "±0.1mm", "±0.005"")'
            },
            electrical: {
              type: 'string',
              description: 'Electrical tolerances (e.g., "±5%", "±2%")'
            },
            mechanical: {
              type: 'string',
              description: 'Mechanical tolerances (e.g., "±0.5%", "±1°")'
            }
          }
        },
        notes: {
          type: 'string',
          description: 'Any additional important information or notes'
        }
      },
      required: ['name', 'quantity', 'specifications']
    };

    const responseSchema = {
      type: 'object',
      properties: {
        pages: {
          type: 'number',
          description: 'Number of pages or sections in the document'
        },
        components: {
          type: 'array',
          description: 'List of components with comprehensive specifications',
          items: componentSchema
        },
        materials: {
          type: 'array',
          description: 'List of materials found in the file',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Material name' },
              qty: { type: 'string', description: 'Quantity with units' },
              grade: { type: 'string', description: 'Material grade/alloy if specified' }
            },
            required: ['name', 'qty']
          }
        },
        documentType: {
          type: 'string',
          description: 'Type of document (e.g., "BOM", "CAD Drawing", "Specification Sheet", "Technical Drawing")'
        },
        projectName: {
          type: 'string',
          description: 'Project name if mentioned in the document'
        },
        revision: {
          type: 'string',
          description: 'Revision number or version if mentioned'
        },
        date: {
          type: 'string',
          description: 'Document date if mentioned'
        }
      },
      required: ['pages', 'components', 'materials']
    };

    const userPrompt = `Analyze the following engineering design file and extract ALL comprehensive information:

File name: ${fileName}
File size: ${fileSize} bytes

File content:
\`\`\`
${fileContent}
\`\`\`

EXTRACTION REQUIREMENTS:

1. **Components**: Extract EVERY component with FULL engineering specifications:
   - Component name and quantity
   - Required materials (with grades if specified, e.g., "6061-T6 Aluminum", "304 Stainless Steel")
   - Electrical specs: voltage, current, power, frequency, resistance, capacitance, inductance, etc.
   - Thermal specs: operating temperature, storage temperature, thermal conductivity, heat dissipation
   - Mechanical specs: dimensions, weight, torque, force, pressure, tolerances, surface finish
   - Certifications: Look for UL, IEC (especially IEC 61730 for solar), CE, RoHS, ISO, NEMA, etc.
   - Environmental constraints: operating environment, humidity, altitude, IP ratings, UV resistance, corrosion resistance
   - Tolerances: dimensional, electrical, mechanical

2. **Materials**: Extract ALL materials with grades/alloys if specified

3. **Document Metadata**: Extract document type, project name, revision, date if available

IMPORTANT:
- Extract EVERY component - do not miss any
- Extract ALL specifications mentioned - be thorough
- For certifications, look for standard names: UL, IEC, CE, RoHS, ISO, NEMA, etc.
- For environmental constraints, look for IP ratings (IP65, IP67), operating conditions, weather ratings
- If a specification is not mentioned, leave it undefined (don't make up values)
- Use exact values from the document - don't paraphrase

Return your response as valid JSON matching the schema.`;

    // Use Anthropic API with comprehensive schema in prompt
    // Note: Structured outputs (response_format) may require newer SDK version
    // This implementation uses schema-enforced prompts for guaranteed JSON
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 16384, // Increased for comprehensive data
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt + '\n\nCRITICAL: You MUST respond with ONLY valid JSON matching this exact schema. Do not include any markdown code blocks, explanations, or additional text. Return ONLY the JSON object:\n\n' + JSON.stringify(responseSchema, null, 2),
        },
      ],
    });

    // Extract structured response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      const startIndex = lines.findIndex((line: string) => line.trim().startsWith('```'));
      const endIndex = lines.findIndex((line: string, idx: number) => idx > startIndex && line.trim().startsWith('```'));
      if (startIndex !== -1 && endIndex !== -1) {
        jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
      } else {
        // Fallback: remove first and last line
        lines.shift();
        lines.pop();
        jsonText = lines.join('\n').trim();
      }
    }

    // Parse JSON
    const result: EnhancedFileProcessingResult = JSON.parse(jsonText);

    // Validate and set defaults
    return {
      pages: result.pages || 1,
      components: result.components || [],
      materials: result.materials || [],
      documentType: result.documentType,
      projectName: result.projectName,
      revision: result.revision,
      date: result.date,
    };
  } catch (error) {
    console.error('Error in enhanced file processing:', error);
    throw error;
  }
}

/**
 * Convert enhanced result to basic format for backward compatibility
 */
export function convertToBasicFormat(
  enhanced: EnhancedFileProcessingResult
): import('./fileProcessor.js').FileProcessingResult {
  return {
    pages: enhanced.pages,
    components: enhanced.components.map(c => ({
      name: c.name,
      quantity: c.quantity,
      specifications: c.specifications,
    })),
    materials: enhanced.materials.map(m => ({
      name: m.name,
      qty: m.qty,
    })),
  };
}

