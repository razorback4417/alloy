import { query } from '@anthropic-ai/claude-agent-sdk';
import type { ProcurementItem } from '../../frontend/src/App';

const TEST_WALLET_ADDRESS = '0x8527a8f999edac78f3bd40f706a1554a0e602858';
const TEST_AMOUNT_PER_VENDOR = 0.01; // $0.01 per vendor for testing

export interface PaymentResult {
  success: boolean;
  transactionHashes: string[];
  errors?: string[];
  simulated?: boolean;
  paymentContext?: any;
}

/**
 * Get payment context from Locus (balance, limits, whitelist)
 */
async function getPaymentContext(): Promise<any> {
  const mcpServers = {
    'locus': {
      type: 'http' as const,
      url: 'https://mcp.paywithlocus.com/mcp',
      headers: {
        'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
      }
    }
  };

  const options = {
    mcpServers,
    allowedTools: ['mcp__locus__get_payment_context'],
    apiKey: process.env.ANTHROPIC_API_KEY,
    canUseTool: async (toolName: string, input: Record<string, unknown>) => {
      if (toolName === 'mcp__locus__get_payment_context') {
        return {
          behavior: 'allow' as const,
          updatedInput: input
        };
      }
      return {
        behavior: 'deny' as const,
        message: 'Only get_payment_context is allowed'
      };
    }
  };

  let contextResult: any = null;
  let toolResult: any = null;

  try {
    for await (const message of query({
      prompt: 'Use the mcp__locus__get_payment_context tool to get the current payment context including budget status, available balance, and whitelisted contacts. Return the full response.',
      options
    })) {
      // Check for tool execution results
      if (message.type === 'tool_result') {
        toolResult = (message as any).result;
        console.log('Payment context tool result:', JSON.stringify(toolResult, null, 2));
      } else if (message.type === 'result' && message.subtype === 'success') {
        const result = (message as any).result;
        console.log('Payment context final result:', JSON.stringify(result, null, 2));
        // Use tool result if available, otherwise use final result
        contextResult = toolResult || result;
      } else if (message.type === 'error_during_execution') {
        const error = (message as any).error;
        console.error('Error getting payment context:', error);
        throw new Error(`Error getting payment context: ${error}`);
      }
    }

    return contextResult || toolResult;
  } catch (error) {
    console.error('Error getting payment context:', error);
    throw error;
  }
}

/**
 * Send USDC payment to an address using Locus MCP
 */
async function sendPaymentToAddress(
  address: string,
  amount: number,
  memo: string
): Promise<string> {
  const mcpServers = {
    'locus': {
      type: 'http' as const,
      url: 'https://mcp.paywithlocus.com/mcp',
      headers: {
        'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
      }
    }
  };

  const options = {
    mcpServers,
    allowedTools: ['mcp__locus__send_to_address'],
    apiKey: process.env.ANTHROPIC_API_KEY,
    canUseTool: async (toolName: string, input: Record<string, unknown>) => {
      if (toolName === 'mcp__locus__send_to_address') {
        return {
          behavior: 'allow' as const,
          updatedInput: input
        };
      }
      return {
        behavior: 'deny' as const,
        message: 'Only send_to_address is allowed'
      };
    }
  };

  // Format the prompt to call the tool with exact parameters
  const prompt = `Use the mcp__locus__send_to_address tool to send ${amount} USDC to address ${address} with memo "${memo}". Return the transaction hash from the response.`;

  let transactionHash: string | null = null;
  let toolResult: any = null;

  try {
    for await (const message of query({
      prompt,
      options
    })) {
      // Check for tool execution results
      if (message.type === 'tool_result') {
        toolResult = (message as any).result;
        console.log('Tool result received:', JSON.stringify(toolResult, null, 2));
      } else if (message.type === 'result' && message.subtype === 'success') {
        const result = (message as any).result;
        console.log('Final result received:', JSON.stringify(result, null, 2));

        // Try to extract transaction hash from various possible formats
        if (typeof result === 'string') {
          // Try to extract hash from the string (look for 0x followed by 64 hex chars)
          const hashMatch = result.match(/0x[a-fA-F0-9]{64}/);
          if (hashMatch) {
            transactionHash = hashMatch[0];
          } else {
            // If it's just the hash, use it directly
            transactionHash = result.trim();
          }
        } else if (result?.transactionHash) {
          transactionHash = result.transactionHash;
        } else if (result?.txHash) {
          transactionHash = result.txHash;
        } else if (result?.transaction_id) {
          transactionHash = result.transaction_id;
        } else if (toolResult) {
          // Use tool result if available
          if (typeof toolResult === 'string') {
            const hashMatch = toolResult.match(/0x[a-fA-F0-9]{64}/);
            if (hashMatch) {
              transactionHash = hashMatch[0];
            } else {
              transactionHash = toolResult.trim();
            }
          } else if (toolResult?.transactionHash) {
            transactionHash = toolResult.transactionHash;
          } else if (toolResult?.txHash) {
            transactionHash = toolResult.txHash;
          }
        } else {
          // Fallback: use the result as-is
          transactionHash = String(result);
        }
      } else if (message.type === 'error_during_execution') {
        const error = (message as any).error;
        console.error('Error during execution:', error);
        throw new Error(`Error sending payment: ${error}`);
      }
    }

    if (!transactionHash) {
      throw new Error('No transaction hash returned from payment');
    }

    return transactionHash;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
}

/**
 * Execute payments via Locus MCP tools
 * For testing: sends $0.01 per vendor to test wallet
 */
export async function executePaymentsWithLocus(
  plan: ProcurementItem[]
): Promise<PaymentResult> {
  // Validate environment variables
  if (!process.env.LOCUS_API_KEY) {
    throw new Error('LOCUS_API_KEY environment variable is not set');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  try {
    console.log('Starting Locus payment execution...');
    console.log(`Plan has ${plan.length} items`);

    // Get unique vendors
    const vendors = Array.from(new Set(plan.map(item => item.vendor)));
    console.log(`Found ${vendors.length} unique vendors`);

    // Step 1: Get payment context
    console.log('Step 1: Getting payment context...');
    const paymentContext = await getPaymentContext();
    console.log('Payment context retrieved:', JSON.stringify(paymentContext, null, 2));

    // Step 2: Calculate test payment amount ($0.01 per vendor)
    const testAmount = vendors.length * TEST_AMOUNT_PER_VENDOR;
    console.log(`Step 2: Sending test payment of $${testAmount.toFixed(2)} (${vendors.length} vendors × $${TEST_AMOUNT_PER_VENDOR})`);

    // Step 3: Send payment to test wallet
    console.log(`Step 3: Sending payment to test wallet: ${TEST_WALLET_ADDRESS}`);
    const memo = `Test payment for ${vendors.length} vendor(s) from procurement order`;

    const transactionHash = await sendPaymentToAddress(
      TEST_WALLET_ADDRESS,
      testAmount,
      memo
    );

    console.log(`✓ Payment successful! Transaction hash: ${transactionHash}`);

    return {
      success: true,
      transactionHashes: [transactionHash],
      simulated: false,
      paymentContext
    };
  } catch (error) {
    console.error('Locus payment execution failed:', error);

    // For testing, we could return a simulated result, but let's throw the error
    // so the user knows what went wrong
    return {
      success: false,
      transactionHashes: [],
      errors: [error instanceof Error ? error.message : String(error)],
      simulated: false
    };
  }
}

