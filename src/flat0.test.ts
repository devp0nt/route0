import { describe, expect, it } from 'bun:test'
import { deserialize, parse, serialize, stringify } from './flat0.js'

const buildNPath = (segments: number): string => {
  if (segments <= 0) return ''
  return `n${'[n]'.repeat(segments - 1)}`
}

describe('flat0', () => {
  it('serializes nested objects and arrays with indexes', () => {
    const input = {
      x: 1,
      user: { profile: { name: 'john' } },
      z: ['a', 'b'],
    }

    expect(serialize(input)).toEqual({
      x: 1,
      'user[profile][name]': 'john',
      'z[0]': 'a',
      'z[1]': 'b',
    })
  })

  it('serializes arrays without indexes when configured', () => {
    const input = {
      a: ['1', '2'],
      nested: { tags: ['x', 'y'] },
    }

    expect(serialize(input, { arrayIndexes: false })).toEqual({
      'a[]': ['1', '2'],
      'nested[tags][]': ['x', 'y'],
    })
  })

  it('deserializes indexed and push arrays', () => {
    const input = {
      'user[name]': 'john',
      'z[0]': 'a',
      'z[1]': 'b',
      'tags[]': ['x', 'y'],
    }

    expect(deserialize(input)).toEqual({
      user: { name: 'john' },
      z: ['a', 'b'],
      tags: ['x', 'y'],
    })
  })

  it('stringify + parse roundtrip with indexes', () => {
    const input = {
      x: '1',
      deep: { y: 2 },
      list: ['a', 'b'],
    }

    const query = stringify(input)
    expect(query).toBe('x=1&deep%5By%5D=2&list%5B0%5D=a&list%5B1%5D=b')
    expect(parse(query)).toEqual({
      x: '1',
      deep: { y: '2' },
      list: ['a', 'b'],
    })
  })

  it('stringify + parse roundtrip without array indexes', () => {
    const input = {
      list: ['a', 'b'],
      nested: { tags: ['x', 'y'] },
    }

    const query = stringify(input, { arrayIndexes: false })
    expect(query).toBe('list%5B%5D=a&list%5B%5D=b&nested%5Btags%5D%5B%5D=x&nested%5Btags%5D%5B%5D=y')
    expect(parse(query)).toEqual({
      list: ['a', 'b'],
      nested: { tags: ['x', 'y'] },
    })
  })

  it('parses query starting with question mark and repeated key', () => {
    expect(parse('?a=1&a=2')).toEqual({ a: ['1', '2'] })
  })

  it('never throws and falls back to simple output', () => {
    expect(serialize(null)).toEqual({})
    expect(deserialize(null)).toEqual({})
    expect(parse(null)).toEqual({})
    expect(stringify(null)).toBe('')
  })

  it('keeps File and Blob instances as values', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const blob = new Blob(['world'], { type: 'text/plain' })
    const input = {
      file,
      nested: {
        blob,
      },
    }

    const flat = serialize(input)
    expect(flat.file).toBe(file)
    expect(flat['nested[blob]']).toBe(blob)

    const restored = deserialize(flat)
    expect(restored.file).toBe(file)
    expect((restored.nested as { blob: Blob }).blob).toBe(blob)
  })

  it('keeps class instances as-is instead of flattening internals', () => {
    class UserModel {
      constructor(
        public id: number,
        public role: string,
      ) {}
      isAdmin() {
        return this.role === 'admin'
      }
    }

    const owner = new UserModel(7, 'admin')
    const nestedOwner = new UserModel(11, 'user')
    const input = {
      owner,
      nested: { owner: nestedOwner },
    }

    const flat = serialize(input)
    expect(flat.owner).toBe(owner)
    expect(flat['nested[owner]']).toBe(nestedOwner)
    expect(flat['owner[id]']).toBeUndefined()
    expect(flat['nested[owner][id]']).toBeUndefined()
  })

  it('handles very deep plain objects correctly', () => {
    const depth = 250
    const input: Record<string, unknown> = {}
    let current: Record<string, unknown> = input
    for (let i = 0; i < depth; i += 1) {
      current.n = {}
      current = current.n as Record<string, unknown>
    }
    current.value = 'end'

    const flat = serialize(input, { maxDepth: depth + 10 })
    let key = 'n'
    for (let i = 1; i < depth; i += 1) {
      key += '[n]'
    }
    key += '[value]'
    expect(flat[key]).toBe('end')

    const restored = deserialize(flat, { maxDepth: depth + 10 })
    expect(restored).toEqual(input)
  })

  it('uses safe default max depth and can be configured', () => {
    const deepInput: Record<string, unknown> = {}
    let current: Record<string, unknown> = deepInput
    for (let i = 0; i < 80; i += 1) {
      current.n = {}
      current = current.n as Record<string, unknown>
    }
    current.value = 'end'

    const flatDefault = serialize(deepInput)
    expect(flatDefault[buildNPath(80) + '[value]']).toBeUndefined()
    expect(flatDefault[buildNPath(64)]).toBeDefined()

    const flatConfigured = serialize(deepInput, { maxDepth: 120 })
    expect(flatConfigured[buildNPath(80) + '[value]']).toBe('end')
  })

  it('limits deserialize depth with fallback to flat key', () => {
    const deepKey = `${buildNPath(10)}[value]`
    const restored = deserialize({ [deepKey]: 'end' }, { maxDepth: 5 })
    expect(restored).toEqual({ [deepKey]: 'end' })

    const parsed = parse(`${encodeURIComponent(deepKey)}=end`, { maxDepth: 5 })
    expect(parsed).toEqual({ [deepKey]: 'end' })
  })

  it('handles circular references without breaking', () => {
    const node: { id: number; self?: unknown } = { id: 1 }
    node.self = node
    const input = { node }

    const flat = serialize(input)
    expect(flat['node[id]']).toBe(1)
    expect(flat['node[self]']).toBe(node)

    const query = stringify(input)
    expect(query).toContain('node%5Bid%5D=1')
    expect(query).toContain('node%5Bself%5D=%5Bobject%20Object%5D')
  })

  it('skips prototype pollution keys', () => {
    const parsed = parse('__proto__%5Bpolluted%5D=yes&safe=1')
    expect(parsed).toEqual({ safe: '1' })
    expect(({} as { polluted?: string }).polluted).toBeUndefined()
  })
})
