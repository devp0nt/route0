import { describe, expect, expectTypeOf, it } from 'bun:test'
import type {
  AnyRoute,
  AnyRouteOrDefinition,
  CallabelRoute,
  CanInputBeEmpty,
  Extended,
  FlatInput,
  FlatOutput,
  HasParams,
  HasSearch,
  IsChildren,
  IsParent,
  IsSame,
  IsSameParams,
  ParamsInput,
  ParamsOutput,
  SearchInput,
  SearchOutput,
  StrictFlatInput,
  StrictFlatOutput,
  StrictSearchInput,
  StrictSearchOutput,
} from './index.js'
import { Route0, Routes } from './index.js'

describe('Route0', () => {
  it('simple', () => {
    const route0 = Route0.create('/')
    const path = route0.get()
    expect(route0).toBeInstanceOf(Route0)
    expectTypeOf<typeof path>().toEqualTypeOf<'/'>()
    expect(path).toBe('/')
    expectTypeOf<HasParams<typeof route0>>().toEqualTypeOf<false>()
    expect(path).toBe(route0.flat())
  })

  it('simple, callable', () => {
    const route0 = Route0.create('/')
    const path = route0()
    expect(route0).toBeInstanceOf(Route0)
    expectTypeOf<typeof path>().toEqualTypeOf<'/'>()
    expect(path).toBe('/')
    expect(path).toBe(route0.flat())
  })

  it('simple any search', () => {
    const route0 = Route0.create('/')
    const path = route0.get({ search: { q: '1' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/?${string}`>()
    expect(path).toBe('/?q=1')
    expect(path).toBe(route0.flat({ q: '1' }))
  })

  it('params', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3' })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}`>()
    expect(path).toBe('/prefix/1/some/2/3')
    expectTypeOf<HasParams<typeof route0>>().toEqualTypeOf<true>()
    expect(path).toBe(route0.flat({ x: '1', y: 2, z: '3' }))
  })

  it('params and any search', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3', search: { q: '1' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?q=1')
    expect(path).toBe(route0.flat({ x: '1', y: 2, z: '3', q: '1' }))
  })

  it('search', () => {
    const route0 = Route0.create('/prefix&y&z')
    expectTypeOf<(typeof route0)['searchDefinition']>().toEqualTypeOf<{ y: true; z: true }>()
    const path = route0.get({ search: { y: '1', z: '2' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix?${string}`>()
    expect(path).toBe('/prefix?y=1&z=2')
    expect(path).toBe(route0.flat({ y: '1', z: '2' }))
  })

  it('params and search', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z&z&c')
    const path = route0.get({ x: '1', y: '2', z: '3', search: { z: '4', c: '5' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?z=4&c=5')
    expect(route0.flat({ x: '1', y: '2', z: '4', c: '5' })).toBe('/prefix/1/some/2/4?z=4&c=5')
  })

  it('params and search and any search', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z&z&c')
    const path = route0.get({ x: '1', y: '2', z: '3', search: { z: '4', c: '5', o: '6' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?z=4&c=5&o=6')
    // very strange case
    expect(route0.flat({ x: '1', y: '2', z: '4', c: '5', o: '6' })).toBe('/prefix/1/some/2/4?z=4&c=5&o=6')
  })

  it('simple extend', () => {
    const route0 = Route0.create('/prefix')
    const route1 = route0.extend('/suffix')
    const path = route1.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/suffix`>()
    expect(path).toBe('/prefix/suffix')
    expect(path).toBe(route1.flat())
  })

  it('simple extend double slash', () => {
    const route0 = Route0.create('/')
    const route1 = route0.extend('/suffix1/')
    const route2 = route1.extend('/suffix2')
    const path = route2.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
    expect(path).toBe(route2.flat())
  })

  it('simple extend no slash', () => {
    const route0 = Route0.create('/')
    const route1 = route0.extend('suffix1')
    const route2 = route1.extend('suffix2')
    const path = route2.get()
    expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
    expect(path).toBe(route2.flat())
  })

  it('extend with params', () => {
    const route0 = Route0.create('/prefix/:x')
    const route1 = route0.extend('/suffix/:y')
    const path = route1.get({ x: '1', y: '2' })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/suffix/${string}`>()
    expect(path).toBe('/prefix/1/suffix/2')
    expect(path).toBe(route1.flat({ x: '1', y: '2' }))
  })

  it('extend with search params', () => {
    const route0 = Route0.create('/prefix&y&z')
    const route1 = route0.extend('/suffix&z&c')
    const path = route1.get({ search: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['searchDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/suffix?${string}`>()
    expect(path).toBe('/prefix/suffix?y=2&c=3&a=4')
    const path1 = route1.get()
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/suffix`>()
    expect(path1).toBe('/prefix/suffix')
    expect(path1).toBe(route1.flat())
  })

  it('extend with params and search', () => {
    const route0 = Route0.create('/prefix/:id&y&z')
    const route1 = route0.extend('/:sn/suffix&z&c')
    const path = route1.get({ id: 'myid', sn: 'mysn', search: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['searchDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/${string}/suffix?${string}`>()
    expect(path).toBe('/prefix/myid/mysn/suffix?y=2&c=3&a=4')
    const path1 = route1.get({ id: 'myid', sn: 'mysn' })
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/${string}/${string}/suffix`>()
    expect(path1).toBe('/prefix/myid/mysn/suffix')
    expect(path1).toBe(route1.flat({ id: 'myid', sn: 'mysn' }))
  })

  it('extend with params and search, callable', () => {
    const route0 = Route0.create('/prefix/:id&y&z')
    const route1 = route0.extend('/:sn/suffix&z&c')
    const path = route1({ id: 'myid', sn: 'mysn', search: { y: '2', c: '3', a: '4' } })
    expectTypeOf<(typeof route1)['searchDefinition']>().toEqualTypeOf<{
      z: true
      c: true
    }>()
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/${string}/suffix?${string}`>()
    expect(path).toBe('/prefix/myid/mysn/suffix?y=2&c=3&a=4')
    const path1 = route1({ id: 'myid', sn: 'mysn' })
    expectTypeOf<typeof path1>().toEqualTypeOf<`/prefix/${string}/${string}/suffix`>()
    expect(path1).toBe('/prefix/myid/mysn/suffix')
    expect(path1).toBe(route1.flat({ id: 'myid', sn: 'mysn' }))
  })

  it('abs default', () => {
    const route0 = Route0.create('/path')
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://example.com/path')
    expect(path).toBe(route0.flat({}, true))
  })

  it('abs set', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://x.com/path')
    expect(path).toBe(route0.flat({}, true))
  })

  it('abs override', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    route0.baseUrl = 'https://y.com'
    const path = route0.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    expect(path).toBe('https://y.com/path')
    expect(path).toBe(route0.flat({}, true))
  })

  it('abs override extend', () => {
    const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
    route0.baseUrl = 'https://y.com'
    const route1 = route0.extend('/suffix')
    const path = route1.get({ abs: true })
    expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path/suffix`>()
    expect(path).toBe('https://y.com/path/suffix')
    expect(path).toBe(route1.flat({}, true))
  })

  // it('abs override many', () => {
  //   const route0 = Route0.create('/path', { baseUrl: 'https://x.com' })
  //   const route1 = route0.extend('/suffix')
  //   const routes = {
  //     r0: route0,
  //     r1: route1,
  //   }
  //   const routes2 = Route0._.overrideMany(routes, { baseUrl: 'https://z.com' })
  //   const path = routes2.r1.get({ abs: true })
  //   expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path/suffix`>()
  //   expect(path).toBe('https://z.com/path/suffix')
  // })

  it('type errors: require params when defined', () => {
    const rWith = Route0.create('/a/:id')
    // @ts-expect-error missing required path params
    expect(rWith.get()).toBe('/a/undefined')
    // @ts-expect-error missing required path params
    expect(rWith.flat()).toBe('/a/undefined')

    // @ts-expect-error missing required path params
    expect(rWith.get({})).toBe('/a/undefined')
    // @ts-expect-error missing required path params
    expect(rWith.flat({})).toBe('/a/undefined')
    // @ts-expect-error missing required path params (object form abs)
    expect(rWith.get({ abs: true })).toBe('https://example.com/a/undefined')
    // @ts-expect-error missing required path params (object form abs)
    expect(rWith.flat({}, true)).toBe('https://example.com/a/undefined')
    // @ts-expect-error missing required path params (object form search)
    expect(rWith.get({ search: { q: '1' } })).toBe('/a/undefined?q=1')
    // @ts-expect-error missing required path params (object form search)
    expect(rWith.flat({ q: '1' })).toBe('/a/undefined?q=1')

    // @ts-expect-error params can not be sent as object value it should be argument
    rWith.get({ params: { id: '1' } }) // not throw becouse this will not used
    expect(rWith.flat({ id: '1' })).toBe('/a/1')

    const rNo = Route0.create('/b')
    // @ts-expect-error no path params allowed for this route (shorthand)
    expect(rNo.get({ id: '1' })).toBe('/b')
    expect(rNo.flat({ id: '1' })).toBe('/b?id=1')
  })

  it('really any route assignable to AnyRoute', () => {
    expectTypeOf<Route0<string>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<string>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<'/path'>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<'/path'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<'/path/:id'>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<'/path/:id'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<'/path/:id&x'>>().toExtend<AnyRoute>()
    expectTypeOf<CallabelRoute<'/path'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallabelRoute<'/path'>>().toExtend<AnyRoute>()
    expectTypeOf<CallabelRoute<'/path'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallabelRoute<'/path/:id'>>().toExtend<AnyRoute>()
    expectTypeOf<CallabelRoute<'/path/:id'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallabelRoute<'/path/:id&x'>>().toExtend<AnyRoute>()
    expectTypeOf<CallabelRoute<'/path/:id&x'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallabelRoute>().toExtend<AnyRoute>()
    expectTypeOf<CallabelRoute>().toExtend<AnyRouteOrDefinition>()

    const route = Route0.create('/path')
    expectTypeOf<typeof route>().toExtend<AnyRoute>()
    expectTypeOf<typeof route>().toExtend<AnyRouteOrDefinition>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route2 = route.extend('/path2')
    expectTypeOf<typeof route2>().toExtend<AnyRoute>()
    expectTypeOf<typeof route2>().toExtend<AnyRouteOrDefinition>()

    // Test that specific CallabelRoute with literal path IS assignable to AnyRouteOrDefinition
    expectTypeOf<CallabelRoute<'/ideas/best'>>().toExtend<AnyRouteOrDefinition>()

    // Test actual function parameter assignment scenario
    const testFn = (_route: AnyRouteOrDefinition) => {
      // intentionally empty
    }
    const callableRoute = Route0.create('/ideas/best')
    testFn(callableRoute) // This should work

    // Test with params
    const routeWithParams = Route0.create('/ideas/:id')
    testFn(routeWithParams) // This should also work
  })
})

describe('type utilities', () => {
  it('HasParams', () => {
    expectTypeOf<HasParams<'/path'>>().toEqualTypeOf<false>()
    expectTypeOf<HasParams<'/path/:id'>>().toEqualTypeOf<true>()
    expectTypeOf<HasParams<'/path/:id/:name'>>().toEqualTypeOf<true>()

    expectTypeOf<HasParams<Route0<'/path'>>>().toEqualTypeOf<false>()
    expectTypeOf<HasParams<Route0<'/path/:id'>>>().toEqualTypeOf<true>()
  })

  it('HasSearch', () => {
    expectTypeOf<HasSearch<'/path'>>().toEqualTypeOf<false>()
    expectTypeOf<HasSearch<'/path&x'>>().toEqualTypeOf<true>()
    expectTypeOf<HasSearch<'/path&x&y'>>().toEqualTypeOf<true>()

    expectTypeOf<HasSearch<Route0<'/path'>>>().toEqualTypeOf<false>()
    expectTypeOf<HasSearch<Route0<'/path&x&y'>>>().toEqualTypeOf<true>()
  })

  it('ParamsInput', () => {
    expectTypeOf<ParamsInput<'/path'>>().toEqualTypeOf<Record<never, never>>()
    expectTypeOf<ParamsInput<'/path/:id'>>().toEqualTypeOf<{ id: string | number }>()
    expectTypeOf<ParamsInput<'/path/:id/:name'>>().toEqualTypeOf<{ id: string | number; name: string | number }>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route = Route0.create('/path/:id/:name')
    expectTypeOf<ParamsInput<typeof route>>().toEqualTypeOf<{ id: string | number; name: string | number }>()
  })

  it('ParamsOutput', () => {
    expectTypeOf<ParamsOutput<'/path/:id'>>().toEqualTypeOf<{ id: string }>()
    expectTypeOf<ParamsOutput<'/path/:id/:name'>>().toEqualTypeOf<{ id: string; name: string }>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route = Route0.create('/path/:id/:name')
    expectTypeOf<ParamsOutput<typeof route>>().toEqualTypeOf<{ id: string; name: string }>()
  })

  it('SearchInput', () => {
    type T1 = SearchInput<'/path'>
    expectTypeOf<T1>().toEqualTypeOf<Record<string, string | number>>()

    type T2 = SearchInput<'/path&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<
      Partial<{
        x: string | number
        y: string | number
      }> &
        Record<string, string | number>
    >()
  })

  it('SearchOutput', () => {
    type T1 = SearchOutput<'/path'>
    expectTypeOf<T1>().toEqualTypeOf<{
      [key: string]: string | undefined
    }>()

    type T2 = SearchOutput<'/path&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<{
      [key: string]: string | undefined
      x?: string | undefined
      y?: string | undefined
    }>()
  })

  it('StrictSearchInput', () => {
    type T1 = StrictSearchInput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<{ x?: string | number; y?: string | number }>()
  })

  it('StrictSearchOutput', () => {
    type T1 = StrictSearchOutput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<{ x?: string | undefined; y?: string | undefined }>()
  })

  it('FlatInput', () => {
    type T1 = FlatInput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<
      Partial<{
        x: string | number
        y: string | number
      }> &
        Record<string, string | number>
    >()

    type T2 = FlatInput<'/path/:id&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<
      {
        id: string | number
      } & Partial<{
        x: string | number
        y: string | number
      }> &
        Record<string, string | number>
    >()
  })
  it('StrictFlatInput', () => {
    type T1 = StrictFlatInput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<{ x?: string | number; y?: string | number }>()
    type T2 = StrictFlatInput<'/path/:id&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<
      Partial<{
        x: string | number
        y: string | number
      }> & {
        id: string | number
      }
    >()
  })

  it('FlatOutput', () => {
    type T1 = FlatOutput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<{
      [x: string]: string | undefined
      x?: string | undefined
      y?: string | undefined
    }>()

    type T2 = FlatOutput<'/path/:id&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<
      {
        id: string
      } & {
        [x: string]: string | undefined
        x?: string | undefined
        y?: string | undefined
      }
    >()
  })
  it('StrictFlatOutput', () => {
    type T1 = StrictFlatOutput<'/path&x&y'>
    expectTypeOf<T1>().toEqualTypeOf<{ x?: string | undefined; y?: string | undefined }>()
    type T2 = StrictFlatOutput<'/path/:id&x&y'>
    expectTypeOf<T2>().toEqualTypeOf<
      { id: string } & Partial<{
        x?: string | undefined
        y?: string | undefined
      }>
    >()
  })

  it('CanInputBeEmpty', () => {
    type T1 = CanInputBeEmpty<'/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    type T2 = CanInputBeEmpty<'/path/:id'>
    expectTypeOf<T2>().toEqualTypeOf<false>()
    type T3 = CanInputBeEmpty<'/path&x&y'>
    expectTypeOf<T3>().toEqualTypeOf<true>()
    type T4 = CanInputBeEmpty<'/path/:id&x&y'>
    expectTypeOf<T4>().toEqualTypeOf<false>()
  })

  it('IsParent', () => {
    type T1 = IsParent<'/path/child', '/path'>
    type T2 = IsParent<'/path', '/path/child'>
    type T3 = IsParent<'/other', '/path'>
    type T4 = IsParent<'/path', '/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    expectTypeOf<T2>().toEqualTypeOf<false>()
    expectTypeOf<T3>().toEqualTypeOf<false>()
    expectTypeOf<T4>().toEqualTypeOf<false>()
  })

  it('IsChildren', () => {
    type T1 = IsChildren<'/path', '/path/child'>
    type T2 = IsChildren<'/path/child', '/path'>
    type T3 = IsChildren<'/path', '/other'>
    type T4 = IsChildren<'/path', '/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    expectTypeOf<T2>().toEqualTypeOf<false>()
    expectTypeOf<T3>().toEqualTypeOf<false>()
    expectTypeOf<T4>().toEqualTypeOf<false>()
  })

  it('IsSame', () => {
    type T1 = IsSame<'/path', '/path'>
    type T2 = IsSame<'/path', '/path/child'>
    type T3 = IsSame<'/path/child', '/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    expectTypeOf<T2>().toEqualTypeOf<false>()
    expectTypeOf<T3>().toEqualTypeOf<false>()
  })

  it('IsSameParams', () => {
    type T1 = IsSameParams<'/path', '/other'>
    type T2 = IsSameParams<'/path/:id', '/other/:id'>
    type T3 = IsSameParams<'/path/:id', '/other'>
    type T4 = IsSameParams<'/path/:id', '/other/:name'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    expectTypeOf<T2>().toEqualTypeOf<true>()
    expectTypeOf<T3>().toEqualTypeOf<false>()
    expectTypeOf<T4>().toEqualTypeOf<false>()
  })

  it('Extended', () => {
    expectTypeOf<Extended<'/path', '/child'>>().toEqualTypeOf<Route0<'/path/child'>>()
    expectTypeOf<Extended<'/path', '/:id'>>().toEqualTypeOf<Route0<'/path/:id'>>()
    expectTypeOf<Extended<'/path', '&x&y'>>().toEqualTypeOf<Route0<'/path&x&y'>>()
    expectTypeOf<Extended<'/path/:id', '/child&x'>>().toEqualTypeOf<Route0<'/path/:id/child&x'>>()
    expectTypeOf<Extended<undefined, '/path'>>().toEqualTypeOf<Route0<'/path'>>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const parent = Route0.create('/path')
    expectTypeOf<Extended<typeof parent, '/child'>>().toEqualTypeOf<Route0<'/path/child'>>()
  })
})

describe('getLocation', () => {
  describe('Route0', () => {
    it('.getLocation location of url', () => {
      let loc = Route0.getLocation('/prefix/some/suffix')
      expect(loc).toMatchObject({
        hash: '',
        href: undefined,
        hrefRel: '/prefix/some/suffix',
        abs: false,
        origin: undefined,
        params: undefined,
        pathname: '/prefix/some/suffix',
        searchParams: {},
        search: '',
      })
      loc = Route0.getLocation('/prefix/some/suffix?x=1&z=2')
      expect(loc).toMatchObject({
        hash: '',
        href: undefined,
        hrefRel: '/prefix/some/suffix?x=1&z=2',
        abs: false,
        origin: undefined,
        params: undefined,
        pathname: '/prefix/some/suffix',
        searchParams: { x: '1', z: '2' },
        search: '?x=1&z=2',
      })
      loc = Route0.getLocation('https://example.com/prefix/some/suffix?x=1&z=2')
      expect(loc).toMatchObject({
        hash: '',
        href: 'https://example.com/prefix/some/suffix?x=1&z=2',
        hrefRel: '/prefix/some/suffix?x=1&z=2',
        abs: true,
        origin: 'https://example.com',
        params: undefined,
        pathname: '/prefix/some/suffix',
        searchParams: { x: '1', z: '2' },
        search: '?x=1&z=2',
      })
    })

    it('#getLocation() exact match', () => {
      const route0 = Route0.create('/prefix/:x/some/:y/:z/suffix')
      let loc = route0.getLocation('/prefix/some/suffix')
      expect(loc.exact).toBe(false)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      expect(loc.params).toMatchObject({})
      loc = route0.getLocation('/prefix/xxx/some/yyy/zzz/suffix')
      expect(loc.exact).toBe(true)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      if (loc.exact) {
        expectTypeOf<typeof loc.params>().toEqualTypeOf<{ x: string; y: string; z: string }>()
      }
      expect(loc.params).toMatchObject({ x: 'xxx', y: 'yyy', z: 'zzz' })
    })

    it('#getLocation() parent match', () => {
      expect(Route0.create('/prefix/xxx/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        exact: false,
        parent: true,
        children: false,
      })
      expect(Route0.create('/prefix/:x/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        exact: false,
        parent: true,
        children: false,
      })
      expect(Route0.create('/:y/:x/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        exact: false,
        parent: true,
        children: false,
      })
    })

    it('#getLocation() children match', () => {
      expect(Route0.create('/prefix/some/extra/path').getLocation('/prefix/some')).toMatchObject({
        exact: false,
        parent: false,
        children: true,
      })
      expect(Route0.create('/prefix/some/extra/:id').getLocation('/prefix/some')).toMatchObject({
        exact: false,
        parent: false,
        children: true,
      })
      expect(Route0.create('/:prefix/some/extra/:id').getLocation('/prefix/some')).toMatchObject({
        exact: false,
        parent: false,
        children: true,
      })
    })

    it('#getLocation() with host info', () => {
      const route0 = Route0.create('/path')
      const loc = route0.getLocation('https://example.com:8080/path')
      expect(loc.exact).toBe(true)
      expect(loc.origin).toBe('https://example.com:8080')
      expect(loc.host).toBe('example.com:8080')
      expect(loc.hostname).toBe('example.com')
      expect(loc.port).toBe('8080')
    })

    it('#getLocation() with hash', () => {
      const route0 = Route0.create('/path/:id')
      const loc = route0.getLocation('/path/123#section')
      expect(loc.exact).toBe(true)
      expect(loc.hash).toBe('#section')
      expect(loc.params).toMatchObject({ id: '123' })
    })

    it('.getLocation accepts URL instance (absolute)', () => {
      const url = new URL('https://example.com/prefix/some/suffix?x=1&z=2#hash')
      const loc = Route0.getLocation(url)
      expect(loc).toMatchObject({
        hash: '#hash',
        href: 'https://example.com/prefix/some/suffix?x=1&z=2#hash',
        hrefRel: '/prefix/some/suffix?x=1&z=2#hash',
        abs: true,
        origin: 'https://example.com',
        pathname: '/prefix/some/suffix',
        searchParams: { x: '1', z: '2' },
        search: '?x=1&z=2',
      })
    })

    it('.getLocation accepts URL instance (relative with base)', () => {
      const url = new URL('/prefix/some/suffix?x=1&z=2', 'https://example.com')
      const loc = Route0.getLocation(url)
      expect(loc).toMatchObject({
        hash: '',
        href: 'https://example.com/prefix/some/suffix?x=1&z=2',
        hrefRel: '/prefix/some/suffix?x=1&z=2',
        abs: true,
        origin: 'https://example.com',
        pathname: '/prefix/some/suffix',
        searchParams: { x: '1', z: '2' },
        search: '?x=1&z=2',
      })
    })
  })

  describe('Routes', () => {
    it('exact match returns ExactLocation', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: '/users/:id',
      })

      const loc = routes._.getLocation('/users/123')
      expect(loc.exact).toBe(true)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      expect(loc.pathname).toBe('/users/123')
      expect(Route0.isSame(loc.route, routes.userDetail)).toBe(true)
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '123' })
      }
    })

    it('no exact match returns UnknownLocation (parent case)', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: '/users/:id',
      })

      // '/users/123/posts' is not an exact match for any route
      const loc = routes._.getLocation('/users/123/posts')
      expect(loc.exact).toBe(false)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      expect(loc.pathname).toBe('/users/123/posts')
    })

    it('no exact match returns UnknownLocation (children case)', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: '/users/:id/posts',
      })

      // '/users/123' is not an exact match for any route
      const loc = routes._.getLocation('/users/123')
      expect(loc.exact).toBe(false)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      expect(loc.pathname).toBe('/users/123')
    })

    it('no match returns UnknownLocation', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
      })

      const loc = routes._.getLocation('/posts/123')
      expect(loc.exact).toBe(false)
      expect(loc.parent).toBe(false)
      expect(loc.children).toBe(false)
      expect(loc.pathname).toBe('/posts/123')
      expect(loc.params).toBeUndefined()
    })

    it('matches most specific route', () => {
      const routes = Routes.create({
        userDetail: '/users/:id',
        userPosts: '/users/:id/posts',
        users: '/users',
      })

      // Should match /users exactly
      const loc1 = routes._.getLocation('/users')
      expect(loc1.exact).toBe(true)
      expect(loc1.pathname).toBe('/users')

      // Should match /users/:id exactly
      const loc2 = routes._.getLocation('/users/123')
      expect(loc2.exact).toBe(true)
      if (loc2.exact) {
        expect(loc2.params).toMatchObject({ id: '123' })
      }

      // Should match /users/:id/posts exactly
      const loc3 = routes._.getLocation('/users/123/posts')
      expect(loc3.exact).toBe(true)
      if (loc3.exact) {
        expect(loc3.params).toMatchObject({ id: '123' })
      }
    })

    it('with search params', () => {
      const routes = Routes.create({
        search: '/search&q&filter',
        users: '/users',
      })

      const loc = routes._.getLocation('/search?q=test&filter=all')
      expect(loc.exact).toBe(true)
      expect(loc.pathname).toBe('/search')
      expect(loc.search).toBe('?q=test&filter=all')
      expect(loc.searchParams).toMatchObject({ q: 'test', filter: 'all' })
    })

    it('with absolute URL', () => {
      const routes = Routes.create({
        api: '/api/v1',
        users: '/api/v1/users',
      })

      const loc = routes._.getLocation('https://example.com/api/v1/users')
      expect(loc.exact).toBe(true)
      expect(loc.abs).toBe(true)
      expect(loc.origin).toBe('https://example.com')
      expect(loc.pathname).toBe('/api/v1/users')
      expect(loc.href).toBe('https://example.com/api/v1/users')
    })

    it('with hash', () => {
      const routes = Routes.create({
        userDetail: '/users/:id',
      })

      const loc = routes._.getLocation('/users/123#profile')
      expect(loc.exact).toBe(true)
      expect(loc.hash).toBe('#profile')
      expect(loc.pathname).toBe('/users/123')
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '123' })
      }
    })

    it('with extended routes', () => {
      const api = Route0.create('/api/v1')
      const routes = Routes.create({
        api,
        users: api.extend('/users'),
        userDetail: api.extend('/users/:id'),
      })

      const loc = routes._.getLocation('/api/v1/users/456')
      expect(loc.exact).toBe(true)
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '456' })
      }
    })

    it('root route', () => {
      const routes = Routes.create({
        home: '/',
        about: '/about',
      })

      const loc = routes._.getLocation('/')
      expect(loc.exact).toBe(true)
      expect(loc.pathname).toBe('/')
    })

    it('with AnyLocation object as input', () => {
      const routes = Routes.create({
        userDetail: '/users/:id',
      })

      const inputLoc = Route0.getLocation('/users/789')
      const loc = routes._.getLocation(inputLoc)
      expect(loc.exact).toBe(true)
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '789' })
      }
    })

    it('complex routing with params and search', () => {
      const api = Route0.create('/api/v1')
      const routes = Routes.create({
        api,
        users: api.extend('/users'),
        userDetail: api.extend('/users/:id'),
        userPosts: api.extend('/users/:id/posts&sort&filter'),
      })

      const loc = routes._.getLocation('/api/v1/users/42/posts?sort=date&filter=published&extra=value')
      expect(loc.exact).toBe(true)
      expect(loc.pathname).toBe('/api/v1/users/42/posts')
      expect(loc.searchParams).toMatchObject({
        sort: 'date',
        filter: 'published',
        extra: 'value',
      })
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '42' })
      }
    })
  })
})

describe('Routes', () => {
  it('create with string routes', () => {
    const collection = Routes.create({
      home: '/',
      about: '/about',
      contact: '/contact',
    })

    expect(collection).toBeInstanceOf(Routes)
    const home = collection.home
    const about = collection.about
    const contact = collection.contact

    expect(home).toBeInstanceOf(Route0)
    expect(about).toBeInstanceOf(Route0)
    expect(contact).toBeInstanceOf(Route0)

    expect(home.get()).toBe('/')
    expect(about.get()).toBe('/about')
    expect(contact.get()).toBe('/contact')
  })

  it('create with Route0 instances', () => {
    const homeRoute = Route0.create('/')
    const aboutRoute = Route0.create('/about')

    const collection = Routes.create({
      home: homeRoute,
      about: aboutRoute,
    })

    expect(collection.home.get()).toBe('/')
    expect(collection.about.get()).toBe('/about')
  })

  it('create with mixed string and Route0', () => {
    const aboutRoute = Route0.create('/about')

    const collection = Routes.create({
      home: '/',
      about: aboutRoute,
      contact: '/contact',
    })

    expect(collection.home.get()).toBe('/')
    expect(collection.about.get()).toBe('/about')
    expect(collection.contact.get()).toBe('/contact')
  })

  it('create with params and search', () => {
    const collection = Routes.create({
      user: '/user/:id',
      search: '/search&q&filter',
      userWithSearch: '/user/:id&tab',
    })

    const user = collection.user
    expect(user.get({ id: '123' } as any)).toBe('/user/123')

    const search = collection.search
    expect(search.get({ search: { q: 'test', filter: 'all' } })).toBe('/search?q=test&filter=all')

    const userWithSearch = collection.userWithSearch
    expect(userWithSearch.get({ id: '456', search: { tab: 'posts' } } as any)).toBe('/user/456?tab=posts')
  })

  it('get maintains route definitions', () => {
    const collection = Routes.create({
      home: '/',
      user: '/user/:id',
    })

    const home = collection.home
    const user = collection.user

    // Verify route definitions are preserved
    expect(home.definition).toBe('/')
    expect(user.definition).toBe('/user/:id')
    expect(home.pathDefinition).toBe('/')
    expect(user.pathDefinition).toBe('/user/:id')

    // Verify params work correctly
    expect(user.get({ id: '123' })).toBe('/user/123')
  })

  it('override with baseUrl', () => {
    const collection = Routes.create({
      home: '/',
      about: '/about',
    })

    const overridden = collection._.override({ baseUrl: 'https://example.com' })

    const home = overridden.home
    const about = overridden.about

    expect(home.get({ abs: true })).toBe('https://example.com')
    expect(about.get({ abs: true })).toBe('https://example.com/about')
  })

  it('override does not mutate original', () => {
    const collection = Routes.create({
      home: '/',
    })

    const original = collection.home
    expect(original.get({ abs: true })).toBe('https://example.com')

    const overridden = collection._.override({ baseUrl: 'https://newdomain.com' })
    const newRoute = overridden.home

    expect(original.get({ abs: true })).toBe('https://example.com')
    expect(newRoute.get({ abs: true })).toBe('https://newdomain.com')
  })

  it('override with extended routes', () => {
    const apiRoute = Route0.create('/api', { baseUrl: 'https://api.example.com' })
    const usersRoute = apiRoute.extend('/users')

    const collection = Routes.create({
      api: apiRoute,
      users: usersRoute,
    })

    expect(collection.api.get({ abs: true })).toBe('https://api.example.com/api')
    expect(collection.api({ abs: true })).toBe('https://api.example.com/api')
    expect(collection.users.get({ abs: true })).toBe('https://api.example.com/api/users')

    const overridden = collection._.override({ baseUrl: 'https://new-api.example.com' })

    expect(overridden.api.get({ abs: true })).toBe('https://new-api.example.com/api')
    expect(overridden.users.get({ abs: true })).toBe('https://new-api.example.com/api/users')
  })

  it('hydrate static method', () => {
    const hydrated = Routes._.hydrate({
      home: '/',
      user: '/user/:id',
      about: Route0.create('/about'),
    })

    expect(hydrated.home).toBeInstanceOf(Route0)
    expect(hydrated.user).toBeInstanceOf(Route0)
    expect(hydrated.about).toBeInstanceOf(Route0)

    expect(hydrated.home.get()).toBe('/')
    expect(hydrated.user.get({ id: '123' })).toBe('/user/123')
    expect(hydrated.about.get()).toBe('/about')
  })

  it('works with callable routes', () => {
    const collection = Routes.create({
      home: '/',
      user: '/user/:id',
    })

    const home = collection.home
    const user = collection.user

    // Routes should be callable
    expect(typeof home).toBe('function')
    expect(typeof user).toBe('function')
    expect(home()).toBe('/')
    expect(user({ id: '789' })).toBe('/user/789')
  })

  it('complex nested structure', () => {
    const api = Route0.create('/api/v1', { baseUrl: 'https://api.example.com' })

    const collection = Routes.create({
      root: '/',
      api,
      users: api.extend('/users'),
      userDetail: api.extend('/users/:id'),
      userPosts: api.extend('/users/:id/posts&sort&filter'),
    })

    expect(collection.root.get()).toBe('/')
    expect(collection.api({ abs: true })).toBe('https://api.example.com/api/v1')
    expect(collection.users.get({ abs: true })).toBe('https://api.example.com/api/v1/users')

    const userDetailPath: any = collection.userDetail.get({ id: '42', abs: true })
    expect(userDetailPath).toBe('https://api.example.com/api/v1/users/42')

    const userPostsPath: any = collection.userPosts.get({
      id: '42',
      search: { sort: 'date', filter: 'published' },
      abs: true,
    })
    expect(userPostsPath).toBe('https://api.example.com/api/v1/users/42/posts?sort=date&filter=published')
  })
})

describe('specificity', () => {
  it('isMoreSpecificThan: static vs param', () => {
    const static1 = Route0.create('/a/b')
    const param1 = Route0.create('/a/:id')

    expect(static1.isMoreSpecificThan(param1)).toBe(true)
    expect(param1.isMoreSpecificThan(static1)).toBe(false)
  })

  it('isMoreSpecificThan: more static segments wins', () => {
    const twoStatic = Route0.create('/a/b/c')
    const oneStatic = Route0.create('/a/:id/c')
    const noStatic = Route0.create('/a/:id/:name')

    expect(twoStatic.isMoreSpecificThan(oneStatic)).toBe(true)
    expect(oneStatic.isMoreSpecificThan(twoStatic)).toBe(false)

    expect(oneStatic.isMoreSpecificThan(noStatic)).toBe(true)
    expect(noStatic.isMoreSpecificThan(oneStatic)).toBe(false)

    expect(twoStatic.isMoreSpecificThan(noStatic)).toBe(true)
    expect(noStatic.isMoreSpecificThan(twoStatic)).toBe(false)
  })

  it('isMoreSpecificThan: compares overlapping segments then lexicographically', () => {
    const longer = Route0.create('/a/:id/b/:name')
    const shorter = Route0.create('/a/:id')

    // Both have same pattern for overlapping segments: static then param
    // Falls back to lexicographic: '/a/:id' < '/a/:id/b/:name'
    expect(longer.isMoreSpecificThan(shorter)).toBe(false)
    expect(shorter.isMoreSpecificThan(longer)).toBe(true)
  })

  it('isMoreSpecificThan: static at earlier position wins', () => {
    const route1 = Route0.create('/a/static/:param')
    const route2 = Route0.create('/a/:param/static')

    // Both have 2 static segments and same length
    // route1 has static at position 1, route2 has param at position 1
    expect(route1.isMoreSpecificThan(route2)).toBe(true)
    expect(route2.isMoreSpecificThan(route1)).toBe(false)
  })

  it('isMoreSpecificThan: lexicographic when completely equal', () => {
    const route1 = Route0.create('/aaa/:id')
    const route2 = Route0.create('/bbb/:id')

    // Same specificity, lexicographic comparison
    expect(route1.isMoreSpecificThan(route2)).toBe(true)
    expect(route2.isMoreSpecificThan(route1)).toBe(false)
  })

  it('isMoreSpecificThan: identical routes', () => {
    const route1 = Route0.create('/a/:id')
    const route2 = Route0.create('/a/:id')

    // Identical routes, lexicographic comparison returns false for equal strings
    expect(route1.isMoreSpecificThan(route2)).toBe(false)
    expect(route2.isMoreSpecificThan(route1)).toBe(false)
  })

  it('isMoreSpecificThan: root vs other routes', () => {
    const root = Route0.create('/')
    const other = Route0.create('/a')
    const param = Route0.create('/:id')

    // /a (1 static) vs / (1 static) - both static, lexicographic order
    expect(other.isMoreSpecificThan(root)).toBe(false) // '/' < '/a' lexicographically
    expect(root.isMoreSpecificThan(other)).toBe(true)

    // /a (1 static) vs /:id (0 static) - static beats param
    expect(other.isMoreSpecificThan(param)).toBe(true)
    expect(param.isMoreSpecificThan(other)).toBe(false)

    // /:id (0 static) vs / (1 static) - static beats param
    expect(param.isMoreSpecificThan(root)).toBe(false)
    expect(root.isMoreSpecificThan(param)).toBe(true)
  })

  it('isConflict: checks if routes overlap', () => {
    const routeA = Route0.create('/a/:x')
    const routeB = Route0.create('/a/b')
    const routeC = Route0.create('/a/:c')
    const routeD = Route0.create('/a/d')
    const routeE = Route0.create('/a/b/c')

    // Same depth, can match
    expect(routeA.isConflict(routeB)).toBe(true)
    expect(routeA.isConflict(routeC)).toBe(true)
    expect(routeA.isConflict(routeD)).toBe(true)
    expect(routeB.isConflict(routeC)).toBe(true)

    // Different depth, no conflict
    expect(routeA.isConflict(routeE)).toBe(false)
    expect(routeB.isConflict(routeE)).toBe(false)
  })

  it('isConflict: non-overlapping static routes', () => {
    const route1 = Route0.create('/users')
    const route2 = Route0.create('/posts')

    // Same depth but different static segments
    expect(route1.isConflict(route2)).toBe(false)
  })
})

describe('regex', () => {
  it('getRegexString: simple route', () => {
    const route = Route0.create('/')
    const regex = route.getRegexString()
    expect(regex).toBe('/')
    expect(new RegExp(`^${regex}$`).test('/')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/other')).toBe(false)
  })

  it('getRegexString: static route', () => {
    const route = Route0.create('/users')
    const regex = route.getRegexString()
    expect(regex).toBe('/users')
    expect(new RegExp(`^${regex}$`).test('/users')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/users/123')).toBe(false)
  })

  it('getRegexString: route with single param', () => {
    const route = Route0.create('/users/:id')
    const regex = route.getRegexString()
    expect(regex).toBe('/users/([^/]+)')
    expect(new RegExp(`^${regex}$`).test('/users/123')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/users/abc')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/users/123/posts')).toBe(false)
    expect(new RegExp(`^${regex}$`).test('/users')).toBe(false)
  })

  it('getRegexString: route with multiple params', () => {
    const route = Route0.create('/users/:userId/posts/:postId')
    const regex = route.getRegexString()
    expect(regex).toBe('/users/([^/]+)/posts/([^/]+)')
    expect(new RegExp(`^${regex}$`).test('/users/123/posts/456')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/users/123/posts')).toBe(false)
  })

  it('getRegexString: route with special regex chars', () => {
    const route = Route0.create('/api/v1.0')
    const regex = route.getRegexString()
    // The dot should be escaped
    expect(regex).toBe('/api/v1\\.0')
    expect(new RegExp(`^${regex}$`).test('/api/v1.0')).toBe(true)
    expect(new RegExp(`^${regex}$`).test('/api/v100')).toBe(false)
  })

  it('getRegexString: handles trailing slash', () => {
    const route = Route0.create('/users/')
    const regex = route.getRegexString()
    // Trailing slash should be removed
    expect(regex).toBe('/users')
  })

  it('getRegexString: root with trailing slash', () => {
    const route = Route0.create('/')
    const regex = route.getRegexString()
    // Root should keep its slash
    expect(regex).toBe('/')
  })

  it('getRegex: simple route', () => {
    const route = Route0.create('/users')
    const regex = route.getRegex()
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/123')).toBe(false)
    expect(regex.test('/other')).toBe(false)
  })

  it('getRegex: route with params', () => {
    const route = Route0.create('/users/:id')
    const regex = route.getRegex()
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/users/abc')).toBe(true)
    expect(regex.test('/users/123/posts')).toBe(false)
  })

  it('static getRegexString: single route', () => {
    const route = Route0.create('/users/:id')
    const regex = Route0.getRegexString(route)
    expect(regex).toBe('/users/([^/]+)')
  })

  it('static getRegexString: multiple routes', () => {
    const routes = [Route0.create('/users'), Route0.create('/posts/:id'), Route0.create('/')]
    const regex = Route0.getRegexString(routes)
    expect(regex).toBe('/users|/posts/([^/]+)|/')
  })

  it('static getRegex: single route', () => {
    const route = Route0.create('/users/:id')
    const regex = Route0.getRegex(route)
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/posts/123')).toBe(false)
  })

  it('static getRegex: multiple routes', () => {
    const routes = [Route0.create('/users'), Route0.create('/posts/:id'), Route0.create('/')]
    const regex = Route0.getRegex(routes)
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/posts/123')).toBe(true)
    expect(regex.test('/')).toBe(true)
    expect(regex.test('/other')).toBe(false)
  })

  it('static getRegex: matches in order', () => {
    const routes = [Route0.create('/users/special'), Route0.create('/users/:id')]
    const regex = Route0.getRegex(routes)
    const match = '/users/special'.match(regex)
    expect(match).toBeTruthy()
    // Both could match, but first one should win
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(match![0]).toBe('/users/special')
  })

  it('getRegexString works with getLocation', () => {
    const route = Route0.create('/users/:id/posts/:postId')
    const loc = route.getLocation('/users/123/posts/456')
    expect(loc.exact).toBe(true)
    expect(loc.params).toMatchObject({ id: '123', postId: '456' })
  })

  it('regex matches what getLocation uses', () => {
    const route = Route0.create('/api/:version/users/:id')
    const testPath = '/api/v1/users/42'

    // Test using getLocation
    const loc = route.getLocation(testPath)
    expect(loc.exact).toBe(true)

    // Test using getRegex
    const regex = route.getRegex()
    expect(regex.test(testPath)).toBe(true)
  })

  it('static getRegex: complex routing scenario', () => {
    const api = Route0.create('/api/v1')
    const routes = [
      Route0.create('/'),
      api,
      api.extend('/users'),
      api.extend('/users/:id'),
      api.extend('/posts/:postId'),
      Route0.create('/:slug'),
    ]

    const regex = Route0.getRegex(routes)

    expect(regex.test('/')).toBe(true)
    expect(regex.test('/api/v1')).toBe(true)
    expect(regex.test('/api/v1/users')).toBe(true)
    expect(regex.test('/api/v1/users/123')).toBe(true)
    expect(regex.test('/api/v1/posts/456')).toBe(true)
    expect(regex.test('/about')).toBe(true) // matches /:slug
    expect(regex.test('/api/v1/users/123/extra')).toBe(false)
  })
})

describe('ordering', () => {
  it('_makeOrdering: orders routes by specificity', () => {
    const routes = {
      root: '/',
      userDetail: '/users/:id',
      users: '/users',
      userPosts: '/users/:id/posts',
      catchAll: '/:slug',
    }

    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)

    // Expected order:
    // Depth 1: / then /users (static) then /:slug (param)
    // Depth 2: /users/:id
    // Depth 3: /users/:id/posts

    expect(ordering).toEqual(['/', '/users', '/:slug', '/users/:id', '/users/:id/posts'])
  })

  it('_makeOrdering: handles routes with same specificity', () => {
    const routes = {
      about: '/about',
      contact: '/contact',
      home: '/home',
    }

    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)

    // All have same depth and don't conflict
    // Ordered alphabetically
    expect(ordering).toEqual(['/about', '/contact', '/home'])
  })

  it('_makeOrdering: complex nested structure', () => {
    const api = Route0.create('/api/v1')
    const routes = {
      root: '/',
      api,
      usersStatic: '/api/v1/users/all',
      users: api.extend('/users'),
      userDetail: api.extend('/users/:id'),
      userPosts: api.extend('/users/:id/posts'),
      adminUser: '/api/v1/admin/:id',
      catchAll: '/:slug',
    }

    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)

    // Expected order:
    // Depth 1: / (static), /:slug (param)
    // Depth 2: /api/v1
    // Depth 3: /api/v1/users (all static)
    // Depth 4: /api/v1/admin/:id (has param), /api/v1/users/all (all static), /api/v1/users/:id (has param)
    // Depth 5: /api/v1/users/:id/posts

    expect(ordering).toEqual([
      '/',
      '/:slug',
      '/api/v1',
      '/api/v1/users',
      '/api/v1/admin/:id',
      '/api/v1/users/all',
      '/api/v1/users/:id',
      '/api/v1/users/:id/posts',
    ])
  })

  it('Routes instance has ordering property', () => {
    const routes = Routes.create({
      home: '/',
      users: '/users',
      userDetail: '/users/:id',
    })

    expect(routes._.pathsOrdering).toBeDefined()
    expect(Array.isArray(routes._.pathsOrdering)).toBe(true)
    // Depth 1: /, /users (alphabetically)
    // Depth 2: /users/:id
    expect(routes._.pathsOrdering).toEqual(['/', '/users', '/users/:id'])
  })

  it('ordering is preserved after override', () => {
    const routes = Routes.create({
      home: '/',
      users: '/users',
      userDetail: '/users/:id',
    })

    const originalOrdering = routes._.pathsOrdering

    const overridden = routes._.override({ baseUrl: 'https://example.com' })

    expect(overridden._.pathsOrdering).toEqual(originalOrdering)
    expect(overridden._.pathsOrdering).toEqual(['/', '/users', '/users/:id'])
  })

  it('_makeOrdering: handles single route', () => {
    const routes = {
      home: '/',
    }

    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)
    expect(ordering).toEqual(['/'])
  })

  it('_makeOrdering: handles empty object', () => {
    const routes = {}

    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)
    expect(ordering).toEqual([])
  })
})
