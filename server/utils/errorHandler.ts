import Anthropic from '@anthropic-ai/sdk';

/**
 * Enhanced Error Handling
 *
 * Enable with USE_ENHANCED_ERROR_HANDLING=true in .env
 *
 * Provides specific, user-friendly error messages for different error types
 */

export function handleAnthropicError(error: unknown): Error {
  const useEnhanced = process.env.USE_ENHANCED_ERROR_HANDLING === 'true';

  if (!useEnhanced) {
    // Basic error handling - just re-throw
    return error instanceof Error ? error : new Error(String(error));
  }

  // Enhanced error handling
  if (error instanceof Anthropic.APIError) {
    switch (error.status) {
      case 401:
        return new Error('Invalid Anthropic API key. Please check your .env file and ensure ANTHROPIC_API_KEY is set correctly.');
      case 429:
        return new Error('Rate limit exceeded. The API is being called too frequently. Please wait a moment and try again.');
      case 500:
        return new Error('Anthropic API server error. The service is temporarily unavailable. Please try again in a few moments.');
      case 502:
        return new Error('Anthropic API gateway error. The service is experiencing issues. Please try again later.');
      case 503:
        return new Error('Anthropic API is temporarily unavailable. The service is overloaded or under maintenance. Please try again later.');
      case 400:
        return new Error(`Invalid request: ${error.message}. Please check your input parameters.`);
      default:
        return new Error(`Anthropic API error (${error.status}): ${error.message}`);
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Error('Network error: Unable to connect to Anthropic API. Please check your internet connection.');
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new Error('Failed to parse API response. The response was not valid JSON. This may indicate an API issue.');
  }

  // Generic error
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Wrap async function with enhanced error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  const useEnhanced = process.env.USE_ENHANCED_ERROR_HANDLING === 'true';

  if (!useEnhanced) {
    return fn;
  }

  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleAnthropicError(error);
    }
  }) as T;
}

