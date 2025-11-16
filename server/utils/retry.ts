import Anthropic from '@anthropic-ai/sdk';

/**
 * Retry utility with exponential backoff
 *
 * Enable with USE_RETRY_LOGIC=true in .env
 *
 * Automatically retries on rate limits (429) and server errors (5xx)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  const useRetry = process.env.USE_RETRY_LOGIC === 'true';

  // If retry is disabled, just call the function once
  if (!useRetry) {
    return fn();
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on last attempt
      if (i === maxRetries - 1) throw error;

      // Only retry on retryable errors
      if (error instanceof Anthropic.APIError) {
        const status = error.status;
        if (status === 429 || status >= 500) {
          const delay = initialDelay * Math.pow(2, i); // Exponential backoff
          console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms (status: ${status})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      // For non-retryable errors, throw immediately
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

