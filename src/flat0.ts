export type SerializeOptions = {
  arrayIndexes?: boolean
  maxDepth?: number
}

export type DeserializeOptions = {
  maxDepth?: number
}

type Flat0Input = Record<string, unknown>
type PathToken = string | number | typeof PUSH_TOKEN

const PUSH_TOKEN = Symbol('flat0-push')
const DEFAULT_ARRAY_INDEXES = true
const DEFAULT_MAX_DEPTH = 64
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isObjectLike = (value: unknown): value is Record<string, unknown> | unknown[] =>
  value !== null && typeof value === 'object'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const toArrayIndexes = (options?: SerializeOptions): boolean => options?.arrayIndexes ?? DEFAULT_ARRAY_INDEXES

const toMaxDepth = (options?: SerializeOptions | DeserializeOptions): number => {
  const value = options?.maxDepth
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_MAX_DEPTH
  const normalized = Math.floor(value)
  if (normalized < 1) return 1
  return normalized
}

const encode = (value: string): string => encodeURIComponent(value)

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

const toPrimitiveString = (value: unknown): string => {
  if (value === null || typeof value === 'undefined') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const parseKey = (input: string): PathToken[] => {
  if (!input) return []
  const tokens: PathToken[] = []
  let current = ''
  let i = 0
  while (i < input.length) {
    const char = input[i]
    if (char !== '[') {
      current += char
      i += 1
      continue
    }

    if (current) {
      tokens.push(current)
      current = ''
    }

    const close = input.indexOf(']', i + 1)
    if (close === -1) {
      return [input]
    }
    const segment = input.slice(i + 1, close)
    if (segment === '') {
      tokens.push(PUSH_TOKEN)
    } else if (/^\d+$/.test(segment)) {
      tokens.push(Number(segment))
    } else {
      tokens.push(segment)
    }
    i = close + 1
  }

  if (current) tokens.push(current)
  return tokens.length ? tokens : [input]
}

const appendFlatEntry = (target: Flat0Input, key: string, value: unknown): void => {
  if (!(key in target)) {
    target[key] = value
    return
  }
  const existing = target[key]
  if (Array.isArray(existing)) {
    existing.push(value)
    target[key] = existing
    return
  }
  target[key] = [existing, value]
}

const serializeNode = (
  value: unknown,
  path: string | undefined,
  out: Flat0Input,
  options?: SerializeOptions,
  visited?: WeakSet<object>,
  currentDepth?: number,
): void => {
  const arrayIndexes = toArrayIndexes(options)
  const maxDepth = toMaxDepth(options)
  const seen = visited ?? new WeakSet<object>()
  const depth = currentDepth ?? 0

  if (!isObjectLike(value)) {
    if (path) appendFlatEntry(out, path, value)
    return
  }

  if (path && depth >= maxDepth) {
    appendFlatEntry(out, path, value)
    return
  }

  if (seen.has(value)) {
    if (path) appendFlatEntry(out, path, value)
    return
  }
  seen.add(value)

  if (Array.isArray(value)) {
    if (!path) return
    if (value.length === 0) {
      appendFlatEntry(out, `${path}[]`, '')
      return
    }
    for (let index = 0; index < value.length; index += 1) {
      const next = value[index]
      const key = arrayIndexes ? `${path}[${index}]` : `${path}[]`
      serializeNode(next, key, out, options, seen, depth + 1)
    }
    return
  }

  if (!isPlainObject(value)) {
    if (path) appendFlatEntry(out, path, value)
    return
  }

  const keys = Object.keys(value)
  if (!path && keys.length === 0) return
  if (path && keys.length === 0) {
    appendFlatEntry(out, path, '')
    return
  }

  for (const key of keys) {
    if (DANGEROUS_KEYS.has(key)) continue
    const nextPath = path ? `${path}[${key}]` : key
    serializeNode(value[key], nextPath, out, options, seen, depth + 1)
  }
}

const createContainerForNext = (next: PathToken | undefined): Record<string, unknown> | unknown[] =>
  typeof next === 'number' || next === PUSH_TOKEN ? [] : {}

const assignPathValue = (root: Record<string, unknown>, tokens: PathToken[], value: unknown): void => {
  if (!tokens.length) return
  const first = tokens[0]
  if (typeof first !== 'string' || DANGEROUS_KEYS.has(first)) return

  let current: Record<string, unknown> | unknown[] = root

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    const isLast = i === tokens.length - 1
    const next = tokens[i + 1]

    if (typeof token === 'string' && DANGEROUS_KEYS.has(token)) return

    if (isLast) {
      if (token === PUSH_TOKEN) {
        if (!Array.isArray(current)) return
        current.push(value)
        return
      }

      if (typeof token === 'number') {
        if (!Array.isArray(current)) return
        current[token] = value
        return
      }

      if (Array.isArray(current)) return
      const existing = current[token]
      if (typeof existing === 'undefined') {
        current[token] = value
      } else if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        current[token] = [existing, value]
      }
      return
    }

    const expectedContainer = createContainerForNext(next)

    if (token === PUSH_TOKEN) {
      if (!Array.isArray(current)) return
      const child = expectedContainer
      current.push(child)
      current = child
      continue
    }

    if (typeof token === 'number') {
      if (!Array.isArray(current)) return
      const existing = current[token]
      if (isObjectLike(existing)) {
        current = existing as Record<string, unknown> | unknown[]
      } else {
        current[token] = expectedContainer
        current = current[token] as Record<string, unknown> | unknown[]
      }
      continue
    }

    if (Array.isArray(current)) return

    const existing = current[token]
    if (isObjectLike(existing)) {
      current = existing as Record<string, unknown> | unknown[]
    } else {
      current[token] = expectedContainer
      current = expectedContainer
    }
  }
}

export const serialize = (input: unknown, options?: SerializeOptions): Flat0Input => {
  try {
    if (!isRecord(input)) return {}
    const out: Flat0Input = {}
    serializeNode(input, undefined, out, options, undefined, 0)
    return out
  } catch {
    return {}
  }
}

export const deserialize = (input: unknown, options?: DeserializeOptions): Record<string, unknown> => {
  try {
    if (!isRecord(input)) return {}
    const out: Record<string, unknown> = {}
    const maxDepth = toMaxDepth(options)
    for (const [rawKey, rawValue] of Object.entries(input)) {
      const tokens = parseKey(rawKey)
      if (!tokens.length) continue
      if (tokens.length > maxDepth) {
        appendFlatEntry(out, rawKey, rawValue)
        continue
      }
      if (Array.isArray(rawValue)) {
        for (const value of rawValue) {
          assignPathValue(out, tokens, value)
        }
      } else {
        assignPathValue(out, tokens, rawValue)
      }
    }
    return out
  } catch {
    return {}
  }
}

export const stringify = (input: unknown, options?: SerializeOptions): string => {
  try {
    const flat = serialize(input, options)
    const chunks: string[] = []
    for (const [key, rawValue] of Object.entries(flat)) {
      if (Array.isArray(rawValue)) {
        for (const item of rawValue) {
          chunks.push(`${encode(key)}=${encode(toPrimitiveString(item))}`)
        }
        continue
      }
      chunks.push(`${encode(key)}=${encode(toPrimitiveString(rawValue))}`)
    }
    return chunks.join('&')
  } catch {
    try {
      if (!isRecord(input)) return ''
      return new URLSearchParams(
        Object.fromEntries(Object.entries(input).map(([k, v]) => [k, toPrimitiveString(v)])),
      ).toString()
    } catch {
      return ''
    }
  }
}

export const parse = (input: unknown, options?: DeserializeOptions): Record<string, unknown> => {
  try {
    if (typeof input !== 'string') return {}
    const query = input.startsWith('?') ? input.slice(1) : input
    if (!query) return {}

    const flat: Record<string, unknown> = {}
    const pairs = query.split('&')
    for (const pair of pairs) {
      if (!pair) continue
      const separatorIndex = pair.indexOf('=')
      const rawKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex)
      const rawValue = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1)
      const key = decode(rawKey)
      if (!key) continue
      const value = decode(rawValue)
      appendFlatEntry(flat, key, value)
    }
    return deserialize(flat, options)
  } catch {
    return {}
  }
}
