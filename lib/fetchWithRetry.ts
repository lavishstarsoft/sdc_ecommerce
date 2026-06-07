type FetchWithRetryOptions = RequestInit & {
  retries?: number;
  retryDelayMs?: number;
};

export async function fetchWithRetry(
  url: string,
  { retries = 3, retryDelayMs = 400, ...init }: FetchWithRetryOptions = {}
): Promise<Response> {
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        cache: 'no-store',
      });

      if (response.ok) {
        return response;
      }

      lastResponse = response;
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
