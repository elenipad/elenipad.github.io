const API_BASE = 'https://jsonhosting.com/api/json'

export const DEFAULT_JSON_ID = 'cfe33fcd'
export const DEFAULT_EDIT_KEY =
  '42e6ce1f8a9de914cfc319595466819956706af080a7567141cf1a33f2fb0c09'


type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonHostingResponse = {
  id: string
  rawUrl: string
  apiUrl: string
  size: number
  createdAt?: string
  updatedAt?: string
  editKey?: string
}

export type JsonRegistryItem = {
  id: string
  editKey: string
  size?: number
}

export type JsonRegistry = {
  items: JsonRegistryItem[]
}

const fetchJson = async <T>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init)
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      `JsonHosting request failed: ${response.status} ${response.statusText}${
        message ? ` - ${message}` : ''
      }`,
    )
  }
  return (await response.json()) as T
}

export const createJson = (payload: JsonValue) =>
  fetchJson<JsonHostingResponse>(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

const normalizeRegistry = (data: JsonValue | null): JsonRegistry => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const items = (data as { items?: unknown }).items
    if (Array.isArray(items)) {
      const cleaned = items.filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof (item as { id?: unknown }).id === 'string' &&
          typeof (item as { editKey?: unknown }).editKey === 'string',
      ) as JsonRegistryItem[]
      return { items: cleaned }
    }
  }
  return { items: [] }
}

export const getRegistry = async (): Promise<JsonRegistry> => {
  const data = await getJson(DEFAULT_JSON_ID)
  return normalizeRegistry(data)
}

export const updateRegistry = (registry: JsonRegistry) =>
  updateJson(registry, DEFAULT_JSON_ID)

export const createJsonAndRegister = async (payload: JsonValue) => {
  const created = await createJson(payload)
  if (!created.editKey) {
    throw new Error('JsonHosting response missing editKey')
  }
  const registry = await getRegistry()
  registry.items.push({
    id: created.id,
    editKey: created.editKey,
    size: created.size,
  })
  await updateRegistry(registry)
  return created
}

export const getJson = (id: string = DEFAULT_JSON_ID) =>
  fetchJson<JsonValue>(`${API_BASE}/${id}`)

export const getRawJson = (id: string = DEFAULT_JSON_ID) =>
  fetchJson<JsonValue>(`${API_BASE}/${id}/raw`)

export const updateJsonWithKey = (
  payload: JsonValue,
  id: string,
  editKey: string,
) =>
  fetchJson<JsonHostingResponse>(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Edit-Key': editKey,
    },
    body: JSON.stringify(payload),
  })

export const updateJson = (payload: JsonValue, id: string = DEFAULT_JSON_ID) =>
  updateJsonWithKey(payload, id, DEFAULT_EDIT_KEY)
