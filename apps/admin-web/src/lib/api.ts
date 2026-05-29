export const ACCESS_TOKEN_STORAGE_KEY = 'campass.accessToken'

const DEFAULT_API_BASE_URL = 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details: unknown

  constructor({ status, message, code, details }: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type ApiErrorOptions = {
  status: number
  message: string
  code?: string
  details?: unknown
}

type JsonBody = Record<string, unknown> | unknown[]

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: BodyInit | JsonBody
  headers?: HeadersInit
}

export async function apiRequest<TResponse = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { body, headers: inputHeaders, ...requestOptions } = options
  const headers = toHeaderRecord(inputHeaders)
  const token = getStoredAccessToken()
  const requestBody = normalizeBody(body, headers)

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(toApiUrl(path), {
    ...requestOptions,
    headers,
    ...(requestBody === undefined ? {} : { body: requestBody })
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  const text = await response.text()
  if (!text) {
    return undefined as TResponse
  }

  return JSON.parse(text) as TResponse
}

function toApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}

function normalizeBody(body: ApiRequestOptions['body'], headers: Record<string, string>) {
  if (body === undefined || body === null) {
    return undefined
  }

  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body
  }

  if (typeof body === 'string') {
    return body
  }

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  return JSON.stringify(body)
}

function toHeaderRecord(headers: HeadersInit | undefined) {
  const record: Record<string, string> = {}

  if (!headers) {
    return record
  }

  new Headers(headers).forEach((value, key) => {
    record[key] = value
  })

  return record
}

async function toApiError(response: Response) {
  const details = await readResponseBody(response)
  const message = getErrorMessage(details, response.statusText)
  const code = getErrorCode(details, message)

  return new ApiError({
    status: response.status,
    message,
    code,
    details
  })
}

async function readResponseBody(response: Response) {
  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function getErrorMessage(details: unknown, fallback: string) {
  if (isErrorObject(details)) {
    if (Array.isArray(details.message)) {
      return details.message.join(', ')
    }

    if (typeof details.message === 'string') {
      return details.message
    }

    if (typeof details.error === 'string') {
      return details.error
    }
  }

  if (typeof details === 'string') {
    return details
  }

  return fallback || 'Request failed'
}

function getErrorCode(details: unknown, message: string) {
  if (isErrorObject(details)) {
    if (typeof details.code === 'string') {
      return details.code
    }

    if (typeof details.message === 'string' && isMachineCode(details.message)) {
      return details.message
    }

    if (typeof details.error === 'string' && isMachineCode(details.error)) {
      return details.error
    }
  }

  return isMachineCode(message) ? message : undefined
}

function isErrorObject(value: unknown): value is {
  message?: unknown
  error?: unknown
  code?: unknown
} {
  return typeof value === 'object' && value !== null
}

function isMachineCode(value: string) {
  return /^[A-Z0-9_]+$/.test(value)
}

function getStoredAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}
