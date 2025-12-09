export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let message: string
      try {
        const errorData = await response.json()
        message = errorData.error || errorData.message || response.statusText
      } catch {
        message = (await response.text()) || response.statusText
      }
      throw new ApiError(message, response.status, response.statusText)
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408, 'Request Timeout')
      }
      throw new ApiError(error.message, 0, 'Network Error')
    }
    throw new ApiError('Unknown error', 0, 'Unknown')
  }
}
