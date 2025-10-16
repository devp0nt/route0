import { describe, expect, expectTypeOf, it } from 'bun:test'
import { Route0 } from './index.js'

describe('route0', () => {
  it('simple', () => {
    const route0 = Route0.create('/')
    const path = route0.get()
    expect(route0).toBeInstanceOf(Route0)
    expectTypeOf<typeof path>().toEqualTypeOf<'/'>()
    expect(path).toBe('/')
  })

  it('simple, callable', () => {
    const route0 = Route0.create('/')
    const path = route0()
    expect(route0).toBeInstanceOf(Route0)
    expectTypeOf<typeof path>().toEqualTypeOf<'/'>()
    expect(path).toBe('/')
  })

  it('simple any query', () => {
    const route0 = Route0.create('/')
    const path = route0.get({ query: { q: '1' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/?${string}`>()
    expect(path).toBe('/?q=1')
  })

  it('params', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3' })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}`>()
    expect(path).toBe('/prefix/1/some/2/3')
  })

  it('params and any query', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3', query: { q: '1' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?q=1')
  })

  it('query', () => {
    const route0 = Route0.create('/prefix&y&z')
    expectTypeOf<(typeof route0)['queryDefinition']>().toEqualTypeOf<{ y: true; z: true }>()
    const path = route0.get({ query: { y: '1', z: '2' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix?${string}`>()
    expect(path).toBe('/prefix?y=1&z=2')
  })

  it('params and query', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z&z&c')
    const path = route0.get({ x: '1', y: '2', z: '3', query: { z: '4', c: '5' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?z=4&c=5')
  })

  it('params and query and any query', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z&z&c')
    const path = route0.get({ x: '1', y: '2', z: '3', query: { z: '4', c: '5', o: '6' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?z=4&c=5&o=6')
  })

  it('simple extend', () => {
    const route0 = Route0.create('/prefix')
    const route1 = route0.extend('/suffix')
    const path = route1.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/suffix`>()
    expect(path).toBe('/prefix/suffix')
  })

  it('simple extend double slash', () => {
    const route0 = Route0.create('/')
    const route1 = route0.extend('/suffix1/')
    const route2 = route1.extend('/suffix2')
    const path = route2.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
  })

  it('simple extend no slash', () => {
    const route0 = Route0.create('/')
    const route1 = route0.extend('suffix1')
    const route2 = route1.extend('suffix2')
    const path = route2.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
  })

  it('extend with params', () => {
    const route0 = Route0.create('/prefix/:x')
    const route1 = route0.extend('/suffix/:y')
    const path = route1.get({ x: '1', y: '2' })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/suffix/${string}`>()
    expect(path).toBe('/prefix/1/suffix/2')
  })

  it('extend with search params', () => {
    const route0 = Route0.create('/prefix&y&z')
    const route1 = route0.extend('/suffix&z&c')
    const path = route1.get({ query: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['queryDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/suffix?${string}`>()
    expect(path).toBe('/prefix/suffix?y=2&c=3&a=4')
    const path1 = route1.get()
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/suffix`>()
    expect(path1).toBe('/prefix/suffix')
  })

  it('extend with params and query', () => {
    const route0 = Route0.create('/prefix/:id&y&z')
    const route1 = route0.extend('/:sn/suffix&z&c')
    const path = route1.get({ id: 'myid', sn: 'mysn', query: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['queryDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/${string}/suffix?${string}`>()
    expect(path).toBe('/prefix/myid/mysn/suffix?y=2&c=3&a=4')
    const path1 = route1.get({ id: 'myid', sn: 'mysn' })
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/${string}/${string}/suffix`>()
    expect(path1).toBe('/prefix/myid/mysn/suffix')
  })

  it('extend with params and query, callable', () => {
    const route0 = Route0.create('/prefix/:id&y&z')
    const route1 = route0.extend('/:sn/suffix&z&c')
    const path = route1({ id: 'myid', sn: 'mysn', query: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['queryDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/${string}/suffix?${string}`>()
    expect(path).toBe('/prefix/myid/mysn/suffix?y=2&c=3&a=4')
    const path1 = route1({ id: 'myid', sn: 'mysn' })
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/${string}/${string}/suffix`>()
    expect(path1).toBe('/prefix/myid/mysn/suffix')
  })

  it('abs default', () => {
    const route0 = Route0.create('/path')
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://example.com/path')
  })

  it('abs set', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://x.com/path')
  })

  it('abs override', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    route0.baseUrl = 'https://y.com'
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://y.com/path')
  })

  it('abs override extend', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    route0.baseUrl = 'https://y.com'
    const route1 = route0.extend('/suffix')
    const path = route1.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path/suffix`>()
    expect(path).toBe('https://y.com/path/suffix')
  })

  it('abs override many', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    const route1 = route0.extend('/suffix')
    const routes = {
      r0: route0,
      r1: route1,
    }
    const routes2 = Route0.overrideMany(routes, { baseUrl: 'https://z.com' })
    const path = routes2.r1.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path/suffix`>()
    expect(path).toBe('https://z.com/path/suffix')
  })

  it('type errors: require params when defined', () => {
    const rWith = Route0.create('/a/:id')
    // @ts-expect-error missing required path params
    expect(rWith.get()).toBe('/a/undefined')

    // @ts-expect-error missing required path params
    expect(rWith.get({})).toBe('/a/undefined')
    // @ts-expect-error missing required path params (object form abs)
    expect(rWith.get({ abs: true })).toBe('https://example.com/a/undefined')
    // @ts-expect-error missing required path params (object form query)
    expect(rWith.get({ query: { q: '1' } })).toBe('/a/undefined?q=1')

    // @ts-expect-error params can not be sent as object value it should be argument
    rWith.get({ params: { id: '1' } }) // not throw becouse this will not used

    const rNo = Route0.create('/b')
    // @ts-expect-error no path params allowed for this route (shorthand)
    expect(rNo.get({ id: '1' })).toBe('/b')
  })

  it('getLocation location of url', () => {
    let location = Route0.getLocation('/prefix/some/suffix')
    expect(location).toMatchObject({
      hash: '',
      href: '/prefix/some/suffix',
      abs: false,
      origin: undefined,
      params: {},
      pathname: '/prefix/some/suffix',
      query: {},
      search: '',
    })
    location = Route0.getLocation('/prefix/some/suffix?x=1&z=2')
    expect(location).toMatchObject({
      hash: '',
      href: '/prefix/some/suffix?x=1&z=2',
      abs: false,
      origin: undefined,
      params: {},
      pathname: '/prefix/some/suffix',
      query: { x: '1', z: '2' },
      search: '?x=1&z=2',
    })
    location = Route0.getLocation('https://example.com/prefix/some/suffix?x=1&z=2')
    expect(location).toMatchObject({
      hash: '',
      href: 'https://example.com/prefix/some/suffix?x=1&z=2',
      abs: true,
      origin: 'https://example.com',
      params: {},
      pathname: '/prefix/some/suffix',
      query: { x: '1', z: '2' },
      search: '?x=1&z=2',
    })
  })

  it('match', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z/suffix')
    let match = route0.match('/prefix/some/suffix')
    expect(match.exact).toBe(false)
    expect(match.parent).toBe(false)
    expect(match.children).toBe(false)
    expect(match.location.params).toMatchObject({})
    match = route0.match('/prefix/xxx/some/yyy/zzz/suffix')
    expect(match.exact).toBe(true)
    expect(match.parent).toBe(false)
    expect(match.children).toBe(false)
    if (match.exact) {
      expectTypeOf<typeof match.location.params>().toEqualTypeOf<{ x: string; y: string; z: string }>()
    }
    expect(match.location.params).toMatchObject({ x: 'xxx', y: 'yyy', z: 'zzz' })
  })
})
