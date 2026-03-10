import { describe, expect, expectTypeOf, it } from 'bun:test'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
  AnyLocation,
  AnyRoute,
  AnyRouteOrDefinition,
  CallableRoute,
  IsParamsOptional,
  ExactLocation,
  Extended,
  ExtractRoute,
  ExtractRoutesKeys,
  HasParams,
  IsAncestor,
  IsDescendant,
  IsSame,
  IsSameParams,
  KnownLocation,
  ParamsInput,
  ParamsInputStringOnly,
  ParamsOutput,
  RoutesPretty,
  UnknownLocation,
  WeakAncestorLocation,
  WeakDescendantLocation,
} from './index.js'
import { Route0, Routes } from './index.js'

describe('Route0', () => {
  it('simple', () => {
    const route0 = Route0.create('/')
    const path = route0.get()
    const pathHash = route0.get({ '#': 'zxc' })
    expect(route0).toBeInstanceOf(Route0)
    expect(path).toBe('/')
    expectTypeOf<HasParams<typeof route0>>().toEqualTypeOf<false>()
    expect(pathHash).toBe('/#zxc')
  })

  it('simple, callable', () => {
    const route0 = Route0.create('/')
    const path = route0()
    const pathHash = route0({ '#': 'zxc' })
    expect(route0).toBeInstanceOf(Route0)
    expect(path).toBe('/')
    expect(pathHash).toBe('/#zxc')
  })

  it('search', () => {
    const route0 = Route0.create('/')
    const path = route0.get({ '?': { q: '1' } })
    const pathHash = route0.get({ '?': { q: '1' }, '#': 'zxc' })
    expect(path).toBe('/?q=1')
    expect(pathHash).toBe('/?q=1#zxc')
    expect(route0({ '?': { q: '1' } })).toBe(path)
    expect(route0({ '?': { q: '1' }, '#': 'zxc' })).toBe(pathHash)
    expectTypeOf<(typeof route0)['Infer']['SearchInput']>().toEqualTypeOf<Record<string, unknown>>()
  })

  it('typed search input', () => {
    const route0 = Route0.create('/').search<{ q: string }>()
    const path = route0.get({ '?': { q: '1' } })
    const pathHash = route0.get({ '?': { q: '1' }, '#': 'zxc' })
    const pathNoQuery = route0.get({ '#': 'zxc' })
    // @ts-expect-error invalid search param type
    const pathInvalidQueryType = route0.get({ '?': { q: 1 } })
    // @ts-expect-error invalid search param key
    const pathInvalidQueryKey = route0.get({ '?': { x: '1' } })
    expect(path).toBe('/?q=1')
    expect(pathHash).toBe('/?q=1#zxc')
    expect(pathNoQuery).toBe('/#zxc')
    expect(pathInvalidQueryType).toBe('/?q=1')
    expect(pathInvalidQueryKey).toBe('/?x=1')
    expectTypeOf<(typeof route0)['Infer']['SearchInput']>().toEqualTypeOf<{ q: string }>()
    expect(route0({ '?': { q: '1' } })).toBe(path)
    expect(route0({ '?': { q: '1' }, '#': 'zxc' })).toBe(pathHash)
    expect(route0({ '#': 'zxc' })).toBe(pathNoQuery)
    // @ts-expect-error invalid search param type
    expect(route0({ '?': { q: 1 } })).toBe(pathInvalidQueryType)
    // @ts-expect-error invalid search param key
    expect(route0({ '?': { x: '1' } })).toBe(pathInvalidQueryKey)
  })

  it('params', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3' })
    const pathHash = route0.get({ x: '1', y: 2, z: '3', '#': 'zxc' })
    expect(path).toBe('/prefix/1/some/2/3')
    expectTypeOf<HasParams<typeof route0>>().toEqualTypeOf<true>()
    expect(pathHash).toBe('/prefix/1/some/2/3#zxc')
    expectTypeOf<(typeof route0)['Infer']['ParamsInput']>().toEqualTypeOf<{
      x: string | number
      y: string | number
      z: string | number
    }>()
    expectTypeOf<(typeof route0)['Infer']['ParamsOutput']>().toEqualTypeOf<{ x: string; y: string; z: string }>()
    expect(route0({ x: '1', y: 2, z: '3' })).toBe(path)
    expect(route0({ x: '1', y: 2, z: '3', '#': 'zxc' })).toBe(pathHash)
  })

  it('params and search', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z')
    const path = route0.get({ x: '1', y: 2, z: '3', '?': { q: '1' } })
    const pathHash = route0.get({ x: '1', y: 2, z: '3', '?': { q: '1' }, '#': 'zxc' })
    expect(path).toBe('/prefix/1/some/2/3?q=1')
    expect(pathHash).toBe('/prefix/1/some/2/3?q=1#zxc')
    expect(route0({ x: '1', y: 2, z: '3', '?': { q: '1' } })).toBe(path)
    expect(route0({ x: '1', y: 2, z: '3', '?': { q: '1' }, '#': 'zxc' })).toBe(pathHash)
  })

  it('optional named params', () => {
    const route0 = Route0.create('/prefix/:x?/:y')
    expect(route0.get({ y: '2' })).toBe('/prefix/2')
    expect(route0.get({ x: '1', y: '2' })).toBe('/prefix/1/2')
    expectTypeOf<(typeof route0)['Infer']['ParamsDefinition']>().toEqualTypeOf<{ x: false; y: true }>()
    expectTypeOf<(typeof route0)['Infer']['ParamsInput']>().toEqualTypeOf<{
      y: string | number
      x?: string | number | undefined
    }>()
    expectTypeOf<(typeof route0)['Infer']['ParamsOutput']>().toEqualTypeOf<{
      y: string
      x: string | undefined
    }>()
  })

  it('wildcards and optional wildcards', () => {
    const routeWildcard = Route0.create('/app*')
    const routeOptionalWildcard = Route0.create('/orders/*?')
    expect(routeWildcard.get({ '*': '' })).toBe('/app')
    expect(routeWildcard.get({ '*': '/home' })).toBe('/app/home')
    expect(routeWildcard.get({ '*': '-1' })).toBe('/app-1')
    expect(routeWildcard.getLocation('/app').exact).toBe(true)
    expect(routeWildcard.getLocation('/app/home').exact).toBe(true)
    expect(routeOptionalWildcard.get()).toBe('/orders')
    expect(routeOptionalWildcard.get({ '*': 'completed/list' })).toBe('/orders/completed/list')
    expect(routeOptionalWildcard.getLocation('/orders').exact).toBe(true)
    expect(routeOptionalWildcard.getLocation('/orders/').exact).toBe(true)
    expect(routeOptionalWildcard.getLocation('/orders/completed/list').exact).toBe(true)
    expectTypeOf<(typeof routeWildcard)['Infer']['ParamsDefinition']>().toEqualTypeOf<{ '*': true }>()
    expectTypeOf<(typeof routeOptionalWildcard)['Infer']['ParamsDefinition']>().toEqualTypeOf<{ '*': false }>()
    expectTypeOf<(typeof routeWildcard)['Infer']['ParamsOutput']>().toEqualTypeOf<{ '*': string }>()
    expectTypeOf<(typeof routeOptionalWildcard)['Infer']['ParamsOutput']>().toEqualTypeOf<{ '*': string | undefined }>()
  })

  it('difference: /path/x* vs /path/x/* matching', () => {
    const inlineWildcard = Route0.create('/path/x*')
    const segmentWildcard = Route0.create('/path/x/*')

    // /path/x*:
    // - matches '/path/x'
    // - matches '/path/x123' (same segment continuation)
    // - matches '/path/x/123' (slash continuation)
    expect(inlineWildcard.getLocation('/path/x').exact).toBe(true)
    expect(inlineWildcard.getLocation('/path/x123').exact).toBe(true)
    expect(inlineWildcard.getLocation('/path/x/123').exact).toBe(true)

    // /path/x/*:
    // - matches '/path/x' and '/path/x/...'
    // - does NOT match '/path/x123' (because 'x' is a full segment here)
    expect(segmentWildcard.getLocation('/path/x').exact).toBe(true)
    expect(segmentWildcard.getLocation('/path/x/123').exact).toBe(true)
    expect(segmentWildcard.getLocation('/path/x123').exact).toBe(false)
  })

  it('difference: /path/x* vs /path/x/* URL building', () => {
    const inlineWildcard = Route0.create('/path/x*')
    const segmentWildcard = Route0.create('/path/x/*')

    // Inline wildcard appends directly to the "x" prefix.
    expect(inlineWildcard.get({ '*': '123' })).toBe('/path/x123')
    expect(inlineWildcard.get({ '*': '/123' })).toBe('/path/x/123')

    // Segment wildcard appends as a new segment after '/path/x/'.
    expect(segmentWildcard.get({ '*': '123' })).toBe('/path/x/123')
    expect(segmentWildcard.get({ '*': '/123' })).toBe('/path/x/123')
  })

  it('mixed required and optional named params combinations', () => {
    const route = Route0.create('/org/:orgId/user/:userId?/:tab')
    expect(route.get({ orgId: 'acme', tab: 'settings' })).toBe('/org/acme/user/settings')
    expect(route.get({ orgId: 'acme', userId: '42', tab: 'settings' })).toBe('/org/acme/user/42/settings')

    const locNoOptional = route.getLocation('/org/acme/user/settings')
    expect(locNoOptional.exact).toBe(true)
    if (locNoOptional.exact) {
      expect(locNoOptional.params).toMatchObject({
        orgId: 'acme',
        userId: undefined,
        tab: 'settings',
      })
    }

    const locWithOptional = route.getLocation('/org/acme/user/42/settings')
    expect(locWithOptional.exact).toBe(true)
    if (locWithOptional.exact) {
      expect(locWithOptional.params).toMatchObject({
        orgId: 'acme',
        userId: '42',
        tab: 'settings',
      })
    }
  })

  it('optional wildcard before required static segment', () => {
    const route = Route0.create('/orders/*?/details')
    expect(route.get()).toBe('/orders/details')
    expect(route.get({ '*': 'completed/list' })).toBe('/orders/completed/list/details')
    expect(route.getLocation('/orders/details').exact).toBe(true)
    expect(route.getLocation('/orders/completed/list/details').exact).toBe(true)
  })

  it('paramsSchema accepts optional-only and mixed params', () => {
    const optionalOnly = Route0.create('/x/:id?')
    expect(optionalOnly.paramsSchema.safeParse(undefined)).toMatchObject({
      success: true,
      data: { id: undefined },
      error: undefined,
    })

    const mixed = Route0.create('/x/:id/:slug?')
    expect(mixed.paramsSchema.safeParse({ id: '1' })).toMatchObject({
      success: true,
      data: { id: '1', slug: undefined },
      error: undefined,
    })
    expect(mixed.paramsSchema.safeParse({ slug: 'x' }).success).toBe(false)
  })

  it('simple extend', () => {
    const route0 = Route0.create('/prefix')
    const route1 = route0.extend('/suffix')
    const path = route1.get()
    const pathHash = route1.get({ '#': 'zxc' })
    // expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/suffix`>()
    expect(path).toBe('/prefix/suffix')
    expect(pathHash).toBe('/prefix/suffix#zxc')
    expect(route1()).toBe(path)
    expect(route1({ '#': 'zxc' })).toBe(pathHash)
  })

  it('simple extend double slash', () => {
    const route0 = Route0.create('/')
    expect(route0.get()).toBe('/')
    const route1 = route0.extend('/suffix1/')
    expect(route1.get()).toBe('/suffix1/')
    const route2 = route1.extend('/suffix2')
    const path = route2.get()
    const pathHash = route2.get({ '#': 'zxc' })
    // expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
    expect(pathHash).toBe('/suffix1/suffix2#zxc')
  })

  it('simple extend no slash', () => {
    const route0 = Route0.create('/')
    const route1 = route0.extend('suffix1')
    const route2 = route1.extend('suffix2')
    const path = route2.get()
    const pathHash = route2.get({ '#': 'zxc' })
    // expectTypeOf<typeof path>().toEqualTypeOf<`/suffix1/suffix2`>()
    expect(path).toBe('/suffix1/suffix2')
    expect(pathHash).toBe('/suffix1/suffix2#zxc')
  })

  it('simple extend no slash chaos', () => {
    const route0 = Route0.create('/')
    expectTypeOf<(typeof route0)['definition']>().toEqualTypeOf<'/'>()
    expect(route0.get()).toBe('/')

    const route1 = Route0.create('')
    expectTypeOf<(typeof route1)['definition']>().toEqualTypeOf<''>()
    expect(route1.get()).toBe('')

    const route2 = route0.extend('/')
    expectTypeOf<(typeof route2)['definition']>().toEqualTypeOf<'/'>()
    expect(route2.get()).toBe('/')

    const route3 = route1.extend('/')
    expectTypeOf<(typeof route3)['definition']>().toEqualTypeOf<'/'>()
    expect(route3.get()).toBe('/')

    const route4 = route0.extend('path/')
    expectTypeOf<(typeof route4)['definition']>().toEqualTypeOf<'/path/'>()
    expect(route4.get()).toBe('/path/')

    const route5 = route1.extend('/path/')
    expectTypeOf<(typeof route5)['definition']>().toEqualTypeOf<'/path/'>()
    expect(route5.get()).toBe('/path/')

    const route6 = route1.extend('path')
    expectTypeOf<(typeof route6)['definition']>().toEqualTypeOf<'/path'>()
    expect(route6.get()).toBe('/path')
  })

  it('extend with params', () => {
    const route0 = Route0.create('/prefix/:x')
    const route1 = route0.extend('/suffix/:y')
    const path = route1.get({ x: '1', y: '2' })
    const pathHash = route1.get({ x: '1', y: '2', '#': 'zxc' })
    expect(path).toBe('/prefix/1/suffix/2')
    expect(pathHash).toBe('/prefix/1/suffix/2#zxc')
  })

  it('extend with typed search', () => {
    const route0 = Route0.create('/prefix').search<{ y: string; z: string }>()
    const route1 = route0.extend('/suffix')
    const path = route1.get({ '?': { y: '2', z: '3' } })
    expectTypeOf<(typeof route1)['Infer']['SearchInput']>().toEqualTypeOf<{
      z: string
      y: string
    }>()
    expect(path).toBe('/prefix/suffix?y=2&z=3')
    const path1 = route1.get()
    const pathHash1 = route1.get({ '#': 'zxc' })
    expect(path1).toBe('/prefix/suffix')
    expect(pathHash1).toBe('/prefix/suffix#zxc')
  })

  it('extend with params and typed search', () => {
    const route0 = Route0.create('/prefix/:id').search<{ y: string; z: string }>()
    const route1 = route0.extend('/:sn/suffix')
    const path = route1.get({ id: 'myid', sn: 'mysn', '?': { y: '2', z: '3' } })
    expectTypeOf<(typeof route1)['Infer']['SearchInput']>().toEqualTypeOf<{
      z: string
      y: string
    }>()
    expect(path).toBe('/prefix/myid/mysn/suffix?y=2&z=3')
    const path1 = route1.get({ id: 'myid', sn: 'mysn' })
    const pathHash1 = route1.get({ id: 'myid', sn: 'mysn', '#': 'zxc' })
    expect(path1).toBe('/prefix/myid/mysn/suffix')
    expect(pathHash1).toBe('/prefix/myid/mysn/suffix#zxc')
  })

  it('extend with params and typed search, callable', () => {
    // const route0 = Route0.create('/prefix/:id&y&z')
    // const route1 = route0.extend('/:sn/suffix&z&c')
    // const path = route1({ id: 'myid', sn: 'mysn', '?': { y: '2', c: '3', a: '4' } })
    // expectTypeOf<(typeof route1)['searchDefinition']>().toEqualTypeOf<{
    //   z: true
    //   c: true
    // }>()
    // expect(path).toBe('/prefix/myid/mysn/suffix?y=2&c=3&a=4')
    // const path1 = route1({ id: 'myid', sn: 'mysn' })
    // expect(path1).toBe('/prefix/myid/mysn/suffix')
    // const pathHash1 = route1({ id: 'myid', sn: 'mysn', '#': 'zxc' })
    // expect(pathHash1).toBe('/prefix/myid/mysn/suffix#zxc')
  })

  it('abs default throw if no window.location.origin', () => {
    const route0 = Route0.create('/path')
    expect(() => route0.get(undefined, true)).toThrow()
    // const route0 = Route0.create('/path')
    // const path = route0.get({ abs: true })
    // const pathHash = route0.get({ abs: true, '#': 'zxc' })
    // // expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path`>()
    // expect(path).toBe('https://example.com/path')
    // expect(path).toBe(route0.flat({}, true))
    // expect(pathHash).toBe('https://example.com/path#zxc')
    // expect(pathHash).toBe(route0.flat({ '#': 'zxc' }, true))
  })

  it('abs as string not throw if no window.location.origin', () => {
    const route0 = Route0.create('/path')
    const path = route0.get('https://example.com')
    expect(path).toBe('https://example.com/path')
  })

  it('abs as string not throw if no window.location.origin and not used additional path', () => {
    const route0 = Route0.create('/path')
    const path = route0.get('https://example.com/x')
    expect(path).toBe('https://example.com/path')
  })

  it('abs default set window.location.origin', () => {
    ;(globalThis as unknown as { location?: { origin?: string } }).location = { origin: 'https://example.com' }
    const route0 = Route0.create('/path')
    const path = route0.get(true)
    const pathHash = route0.get({ '#': 'zxc' }, true)
    expect(path).toBe('https://example.com/path')
    expect(path).toBe(route0.get({}, true))
    expect(pathHash).toBe('https://example.com/path#zxc')
    expect(pathHash).toBe(route0.get({ '#': 'zxc' }, true))
    delete (globalThis as unknown as { location?: { origin?: string } }).location?.origin
  })

  it('abs set', () => {
    const route0 = Route0.create('/path', { origin: 'https://x.com' })
    const path = route0.get(true)
    const pathHash = route0.get({ '#': 'zxc' }, true)
    expect(path).toBe('https://x.com/path')
    expect(path).toBe(route0.get({}, true))
    expect(pathHash).toBe('https://x.com/path#zxc')
    expect(pathHash).toBe(route0.get({ '#': 'zxc' }, true))
  })

  it('abs override', () => {
    const route0 = Route0.create('/path', { origin: 'https://x.com' })
    route0.origin = 'https://y.com'
    const path = route0.get(true)
    const pasthHash = route0.get({ '#': 'zxc' }, true)
    expect(path).toBe('https://y.com/path')
    expect(path).toBe(route0.get({}, true))
    expect(pasthHash).toBe('https://y.com/path#zxc')
    expect(pasthHash).toBe(route0.get({ '#': 'zxc' }, true))
  })

  it('abs override extend', () => {
    const route0 = Route0.create('/path', { origin: 'https://x.com' })
    route0.origin = 'https://y.com'
    const route1 = route0.extend('/suffix')
    const path = route1.get(true)
    const pathHash = route1.get({ '#': 'zxc' }, true)
    expect(path).toBe('https://y.com/path/suffix')
    expect(path).toBe(route1.get({}, true))
    expect(pathHash).toBe('https://y.com/path/suffix#zxc')
    expect(pathHash).toBe(route1.get({ '#': 'zxc' }, true))
  })

  // it('abs override many', () => {
  //   const route0 = Route0.create('/path', { origin: 'https://x.com' })
  //   const route1 = route0.extend('/suffix')
  //   const routes = {
  //     r0: route0,
  //     r1: route1,
  //   }
  //   const routes2 = Route0._.overrideMany(routes, { origin: 'https://z.com' })
  //   const path = routes2.r1.get({ abs: true })
  //   expectTypeOf<typeof path>().toEqualTypeOf<`${string}/path/suffix`>()
  //   expect(path).toBe('https://z.com/path/suffix')
  // })

  it('type errors: require params when defined', () => {
    const rWith = Route0.create('/a/:id', { origin: 'https://example.com' })
    // @ts-expect-error missing required path params
    expect(rWith.get()).toBe('/a/undefined')

    // @ts-expect-error missing required path params
    expect(rWith.get({})).toBe('/a/undefined')
    // @ts-expect-error missing required path params (object form abs)
    expect(rWith.get(true)).toBe('https://example.com/a/undefined')
    // @ts-expect-error missing required path params (object form search)
    expect(rWith.get({ '?': { q: '1' } })).toBe('/a/undefined?q=1')

    // @ts-expect-error params can not be sent as object value it should be argument
    rWith.get({ params: { id: '1' } }) // not throw becouse this will not used
    expect(rWith.get({ id: '1' })).toBe('/a/1')

    const rNo = Route0.create('/b')
    // @ts-expect-error no path params allowed for this route (shorthand)
    expect(rNo.get({ id: '1' })).toBe('/b')
  })

  it('really any route assignable to AnyRoute', () => {
    expectTypeOf<Route0<string>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<string, { x: string }>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<string>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<string, { x: string }>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<'/path'>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<'/path', { x: string }>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<Route0<'/path/:id'>>().toExtend<AnyRoute>()
    expectTypeOf<Route0<'/path/:id', { x?: string }>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallableRoute<'/path'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallableRoute<'/path', { x: string }>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallableRoute<'/path'>>().toExtend<AnyRoute>()
    expectTypeOf<CallableRoute<'/path', { x: string }>>().toExtend<AnyRoute>()
    expectTypeOf<CallableRoute<'/path/:id'>>().toExtend<AnyRoute>()
    expectTypeOf<CallableRoute<'/path/:id', { x?: string }>>().toExtend<AnyRoute>()
    expectTypeOf<CallableRoute<'/path/:id'>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallableRoute<'/path/:id', { x?: string }>>().toExtend<AnyRouteOrDefinition>()
    expectTypeOf<CallableRoute>().toExtend<AnyRoute>()
    expectTypeOf<CallableRoute>().toExtend<AnyRouteOrDefinition>()

    const route = Route0.create('/path')
    expectTypeOf<typeof route>().toExtend<AnyRoute>()
    expectTypeOf<typeof route>().toExtend<AnyRouteOrDefinition>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route2 = route.extend('/path2')
    expectTypeOf<typeof route2>().toExtend<AnyRoute>()
    expectTypeOf<typeof route2>().toExtend<AnyRouteOrDefinition>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route3 = route.extend('/path3').search<{ x: string }>()
    expectTypeOf<typeof route3>().toExtend<AnyRoute>()
    expectTypeOf<typeof route3>().toExtend<AnyRouteOrDefinition>()

    // Test that specific CallableRoute with literal path IS assignable to AnyRouteOrDefinition
    expectTypeOf<CallableRoute<'/ideas/best'>>().toExtend<AnyRouteOrDefinition>()

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

  it('clone, from, create', () => {
    const route = Route0.create('/path')
    const clonedRoute = route.clone()
    expect(clonedRoute.get()).toBe('/path')
    expect(clonedRoute).not.toBe(route)
    expect(clonedRoute.definition).toBe(route.definition)

    const createdRoute = Route0.create(route)
    expect(createdRoute.get()).toBe('/path')
    expect(createdRoute).not.toBe(route)
    expect(createdRoute.definition).toBe(route.definition)

    const fromRoute = Route0.from(route)
    expect(fromRoute.get()).toBe('/path')
    expect(fromRoute).toBe(route)
    expect(fromRoute.definition).toBe(route.definition)
  })

  it('x', () => {
    const a = Route0.create('/')
    const b = a.extend('/b')
    const c = b.extend('/:c')
    const d = c.extend('/x')
    expect(Route0.from(a.definition).definition).toBe('/')
    expect(Route0.from(b.definition).definition).toBe('/b')
    expect(Route0.from(c.definition).definition).toBe('/b/:c')
    expect(Route0.from(d.definition).definition).toBe('/b/:c/x')
    expect(Route0.from('/').definition).toBe('/')
    expect(Route0.from('/b').definition).toBe('/b')
    expect(Route0.from('/b/:c').definition).toBe('/b/:c')
    expect(Route0.from('/b/:c/x').definition).toBe('/b/:c/x')
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

  it('ParamsInputStringOnly', () => {
    expectTypeOf<ParamsInputStringOnly<'/path'>>().toEqualTypeOf<Record<never, never>>()
    expectTypeOf<ParamsInputStringOnly<'/path/:id'>>().toEqualTypeOf<{ id: string }>()
    expectTypeOf<ParamsInputStringOnly<'/path/:id/:name'>>().toEqualTypeOf<{ id: string; name: string }>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const route = Route0.create('/path/:id/:name')
    expectTypeOf<ParamsInputStringOnly<typeof route>>().toEqualTypeOf<{ id: string; name: string }>()
  })

  it('IsParamsOptional', () => {
    type T1 = IsParamsOptional<'/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    type T2 = IsParamsOptional<'/path/:id'>
    expectTypeOf<T2>().toEqualTypeOf<false>()
    type T3 = IsParamsOptional<'/path'>
    expectTypeOf<T3>().toEqualTypeOf<true>()
    type T4 = IsParamsOptional<'/path/:id'>
    expectTypeOf<T4>().toEqualTypeOf<false>()
    type T5 = IsParamsOptional<'/path/:id?'>
    expectTypeOf<T5>().toEqualTypeOf<true>()
    type T6 = IsParamsOptional<'/path*'>
    expectTypeOf<T6>().toEqualTypeOf<false>()
    type T7 = IsParamsOptional<'/path*?'>
    expectTypeOf<T7>().toEqualTypeOf<true>()
  })

  it('IsAncestor', () => {
    type T1 = IsAncestor<'/path/child', '/path'>
    type T2 = IsAncestor<'/path', '/path/child'>
    type T3 = IsAncestor<'/other', '/path'>
    type T4 = IsAncestor<'/path', '/path'>
    expectTypeOf<T1>().toEqualTypeOf<true>()
    expectTypeOf<T2>().toEqualTypeOf<false>()
    expectTypeOf<T3>().toEqualTypeOf<false>()
    expectTypeOf<T4>().toEqualTypeOf<false>()
  })

  it('IsDescendant', () => {
    type T1 = IsDescendant<'/path', '/path/child'>
    type T2 = IsDescendant<'/path/child', '/path'>
    type T3 = IsDescendant<'/path', '/other'>
    type T4 = IsDescendant<'/path', '/path'>
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
    expectTypeOf<Extended<'/path', '', { x: string; y: string }>>().toEqualTypeOf<
      Route0<'/path', { x: string; y: string }>
    >()
    expectTypeOf<Extended<'/path/:id', '/child', { x: string }>>().toEqualTypeOf<
      Route0<'/path/:id/child', { x: string }>
    >()
    expectTypeOf<Extended<undefined, '/path', { x: string }>>().toEqualTypeOf<Route0<'/path', { x: string }>>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ancestor = Route0.create('/path')
    expectTypeOf<Extended<typeof ancestor, '/child'>>().toEqualTypeOf<Route0<'/path/child'>>()
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

    it('.toRelLocation', () => {
      const loc = Route0.toRelLocation(Route0.getLocation('https://example.com/prefix/some/suffix?x=1&z=2'))
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
      const sameLoc = Route0.toRelLocation(loc)
      expect(sameLoc).toMatchObject(loc)
    })

    it('.toAbsLocation', () => {
      const loc = Route0.toRelLocation(Route0.getLocation('https://example.com/prefix/some/suffix?x=1&z=2'))
      const absLoc = Route0.toAbsLocation(loc, 'https://example2.com')
      expect(absLoc).toMatchObject({
        hash: '',
        href: 'https://example2.com/prefix/some/suffix?x=1&z=2',
        hrefRel: '/prefix/some/suffix?x=1&z=2',
        abs: true,
        origin: 'https://example2.com',
        params: undefined,
        pathname: '/prefix/some/suffix',
        searchParams: { x: '1', z: '2' },
        search: '?x=1&z=2',
      })
      const sameLoc = Route0.toRelLocation(loc)
      expect(sameLoc).toMatchObject(loc)
    })

    it('#getLocation() exact match', () => {
      const route0 = Route0.create('/prefix/:x/some/:y/:z/suffix')
      let loc = route0.getLocation('/prefix/some/suffix')
      expect(loc.known).toBe(true)
      expect(loc.exact).toBe(false)
      expect(loc.unmatched).toBe(true)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
      expect(loc.params).toMatchObject({})
      loc = route0.getLocation('/prefix/xxx/some/yyy/zzz/suffix')
      expect(loc.known).toBe(true)
      expect(loc.exact).toBe(true)
      expect(loc.unmatched).toBe(false)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
      if (loc.exact) {
        expectTypeOf<typeof loc.params>().toEqualTypeOf<{ x: string; y: string; z: string }>()
      }
      expect(loc.params).toMatchObject({ x: 'xxx', y: 'yyy', z: 'zzz' })
    })

    it('#getLocation() ancestor match', () => {
      expect(Route0.create('/prefix/xxx/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: true,
        descendant: false,
        params: {},
      })
      expect(Route0.create('/prefix/:x/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: true,
        descendant: false,
        params: { x: 'xxx' },
      })
      expect(Route0.create('/:y/:x/some').getLocation('/prefix/xxx/some/extra/path')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: true,
        descendant: false,
        params: { y: 'prefix', x: 'xxx' },
      })
    })

    it('#getLocation() descendant match', () => {
      expect(Route0.create('/prefix/some/extra/path').getLocation('/prefix/some')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: false,
        descendant: true,
        params: {},
      })
      expect(Route0.create('/prefix/some/extra/:id').getLocation('/prefix/some')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: false,
        descendant: true,
        params: {},
      })
      expect(Route0.create('/:prefix/some/extra/:id').getLocation('/prefix/some')).toMatchObject({
        known: true,
        exact: false,
        unmatched: false,
        ancestor: false,
        descendant: true,
        params: { prefix: 'prefix' },
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
    it('types helpers', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: Route0.create('/users/:id'),
      })
      expectTypeOf<ExtractRoutesKeys<typeof routes>>().toEqualTypeOf<'home' | 'users' | 'userDetail'>()
      expectTypeOf<ExtractRoute<typeof routes, 'userDetail'>>().toEqualTypeOf<CallableRoute<'/users/:id'>>()
      expectTypeOf<ExtractRoutesKeys<RoutesPretty>>().toEqualTypeOf<string>()
    })

    it('exact match returns ExactLocation', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: Route0.create('/users/:id'),
      })

      expectTypeOf<(typeof routes)['home']>().toEqualTypeOf<CallableRoute<'/'>>()
      expectTypeOf<(typeof routes)['userDetail']>().toEqualTypeOf<CallableRoute<'/users/:id'>>()
      const loc = routes._.getLocation('/users/123')
      expect(loc.known).toBe(true)
      expect(loc.exact).toBe(true)
      expect(loc.unmatched).toBe(false)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
      expect(loc.pathname).toBe('/users/123')
      expect(Route0.isSame(loc.route, routes.userDetail)).toBe(true)
      if (loc.exact) {
        expect(loc.params).toMatchObject({ id: '123' })
      }
    })

    it('no exact match returns UnknownLocation (ancestor case)', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: '/users/:id',
      })

      // '/users/123/posts' is not an exact match for any route
      const loc = routes._.getLocation('/users/123/posts')
      expect(loc.known).toBe(false)
      expect(loc.exact).toBe(false)
      expect(loc.unmatched).toBe(false)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
      expect(loc.pathname).toBe('/users/123/posts')
    })

    it('no exact match returns UnknownLocation (descendant case)', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
        userDetail: '/users/:id/posts',
      })

      // '/users/123' is not an exact match for any route
      const loc = routes._.getLocation('/users/123')
      expect(loc.known).toBe(false)
      expect(loc.exact).toBe(false)
      expect(loc.unmatched).toBe(false)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
      expect(loc.pathname).toBe('/users/123')
    })

    it('no match returns UnknownLocation', () => {
      const routes = Routes.create({
        home: '/',
        users: '/users',
      })

      const loc = routes._.getLocation('/posts/123')
      expect(loc.known).toBe(false)
      expect(loc.exact).toBe(false)
      expect(loc.unmatched).toBe(false)
      expect(loc.ancestor).toBe(false)
      expect(loc.descendant).toBe(false)
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
        search: '/search',
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
        userPosts: api.extend('/users/:id/posts').search<{ sort: string; filter: string }>(),
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

    it('resolves overlaps: static > required param > optional > wildcard', () => {
      const routes = Routes.create({
        usersStatic: '/users/new',
        usersRequired: '/users/:id',
        usersOptional: '/users/:id?',
        usersWildcard: '/users/*?',
      })

      const locStatic = routes._.getLocation('/users/new')
      expect(locStatic.exact).toBe(true)
      if (locStatic.exact) {
        expect(locStatic.route).toBe('/users/new')
      }

      const locRequired = routes._.getLocation('/users/123')
      expect(locRequired.exact).toBe(true)
      if (locRequired.exact) {
        expect(locRequired.route).toBe('/users/:id')
        expect(locRequired.params).toMatchObject({ id: '123' })
      }

      const locOptional = routes._.getLocation('/users')
      expect(locOptional.exact).toBe(true)
      if (locOptional.exact) {
        expect(locOptional.route).toBe('/users/:id?')
      }

      const locWildcard = routes._.getLocation('/users/a/b/c')
      expect(locWildcard.exact).toBe(true)
      if (locWildcard.exact) {
        expect(locWildcard.route).toBe('/users/*?')
      }
    })

    it('resolves app wildcard compatibility cases like wouter', () => {
      const routes = Routes.create({
        appRoot: '/app',
        appHome: '/app/home',
        appId: '/app/:id',
        appSplat: '/app*',
      })

      const m1 = routes._.getLocation('/app')
      expect(m1.exact).toBe(true)
      if (m1.exact) expect(m1.route).toBe('/app')

      const m2 = routes._.getLocation('/app/home')
      expect(m2.exact).toBe(true)
      if (m2.exact) expect(m2.route).toBe('/app/home')

      const m3 = routes._.getLocation('/app/123')
      expect(m3.exact).toBe(true)
      if (m3.exact) expect(m3.route).toBe('/app/:id')

      const m4 = routes._.getLocation('/app-1')
      expect(m4.exact).toBe(true)
      if (m4.exact) expect(m4.route).toBe('/app*')
    })

    it('resolves /path/x* and /path/x/* differently in Routes', () => {
      const routes = Routes.create({
        inlineWildcard: '/path/x*',
        segmentWildcard: '/path/x/*',
      })

      // '/path/x123' only matches inline wildcard.
      const a = routes._.getLocation('/path/x123')
      expect(a.exact).toBe(true)
      if (a.exact) expect(a.route).toBe('/path/x*')

      // '/path/x/123' matches both, but '/path/x/*' should win as more specific.
      const b = routes._.getLocation('/path/x/123')
      expect(b.exact).toBe(true)
      if (b.exact) expect(b.route).toBe('/path/x/*')

      // '/path/x' also matches both; segment wildcard remains preferred.
      const c = routes._.getLocation('/path/x')
      expect(c.exact).toBe(true)
      if (c.exact) expect(c.route).toBe('/path/x/*')
    })

    it('get location for extedned routes', () => {
      const a = Route0.create('/')
      const b = a.extend('/b')
      const c = b.extend('/:c')
      const d = c.extend('/x')
      const routes = Routes.create({
        a,
        b,
        c,
        d,
      })

      const loc = routes._.getLocation('/b/test')
      expect(loc.exact).toBe(true)
      expect(loc.route).toBe('/b/:c')
    })

    it('any RoutesPretty type suitable to any RoutesPretty stype', () => {
      const routes = Routes.create({
        home: '/',
        v: '/b',
      }) satisfies RoutesPretty
      const fn = <T extends RoutesPretty>(routes: T) => {
        return routes
      }
      fn(routes)
    })
  })
})

describe('params schema', () => {
  it('paramsSchema validate', () => {
    const route = Route0.create('/:id/:sn')
    const result = route.paramsSchema['~standard'].validate({ id: 1, sn: 'x', extra: 'ignored' })
    if (result instanceof Promise) {
      throw new Error('Unexpected async schema result')
    }
    expect(result).toMatchObject({
      value: { id: '1', sn: 'x' },
    })
  })

  it('paramsSchema parse and safeParse', () => {
    const route = Route0.create('/:id')
    expect(route.paramsSchema.parse({ id: 1, x: '2' })).toMatchObject({ id: '1' })
    expect(route.paramsSchema.safeParse(undefined)).toMatchObject({
      success: false,
      data: undefined,
      error: new Error('Missing params: "id"'),
    })
  })

  it('schema types are assignable to StandardSchemaV1', () => {
    const route = Route0.create('/:id')
    expectTypeOf(route.paramsSchema).toExtend<StandardSchemaV1>()
    expectTypeOf(route.paramsSchema).toExtend<StandardSchemaV1<ParamsInput<'/:id'>, ParamsOutput<'/:id'>>>()
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
      search: Route0.create('/search').search<{ q: string; filter: string }>(),
      userWithSearch: Route0.create('/user/:id').search<{ tab: string }>(),
    })
    const user = collection.user
    expect(user.get({ id: '123' })).toBe('/user/123')
    const search = collection.search
    expect(search.get({ '?': { q: 'test', filter: 'all' } })).toBe('/search?q=test&filter=all')
    const userWithSearch = collection.userWithSearch
    expect(userWithSearch.get({ id: '456', '?': { tab: 'posts' } })).toBe('/user/456?tab=posts')
    // @ts-expect-error invalid search param key
    expect(userWithSearch.get({ id: '456', '?': { zxc: 'posts' } })).toBe('/user/456?zxc=posts')
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

    // Verify params work correctly
    expect(user.get({ id: '123' })).toBe('/user/123')
  })

  it('clone with origin', () => {
    const collection = Routes.create({
      home: '/',
      about: '/about',
    })

    const overridden = collection._.clone({ origin: 'https://example.com' })

    const home = overridden.home
    const about = overridden.about

    expect(home.get(true)).toBe('https://example.com')
    expect(about.get(true)).toBe('https://example.com/about')
  })

  it('clone does not mutate original', () => {
    const collection = Routes.create(
      {
        home: '/',
      },
      { origin: 'https://example.com' },
    )

    const original = collection.home
    expect(original.get(true)).toBe('https://example.com')

    const overridden = collection._.clone({ origin: 'https://newdomain.com' })
    const newRoute = overridden.home

    expect(original.get(true)).toBe('https://example.com')
    expect(newRoute.get(true)).toBe('https://newdomain.com')
  })

  it('clone with extended routes', () => {
    const apiRoute = Route0.create('/api', { origin: 'https://api.example.com' })
    const usersRoute = apiRoute.extend('/users')

    const collection = Routes.create({
      api: apiRoute,
      users: usersRoute,
    })

    expect(collection.api.get(true)).toBe('https://api.example.com/api')
    expect(collection.api(true)).toBe('https://api.example.com/api')
    expect(collection.users.get(true)).toBe('https://api.example.com/api/users')

    const overridden = collection._.clone({ origin: 'https://new-api.example.com' })

    expect(overridden.api.get(true)).toBe('https://new-api.example.com/api')
    expect(overridden.users.get(true)).toBe('https://new-api.example.com/api/users')
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
    const api = Route0.create('/api/v1', { origin: 'https://api.example.com' })

    const collection = Routes.create({
      root: '/',
      api,
      users: api.extend('/users'),
      userDetail: api.extend('/users/:id'),
      userPosts: api.extend('/users/:id/posts').search<{ sort: string; filter: string }>(),
    })

    expect(collection.root.get()).toBe('/')
    expect(collection.api(true)).toBe('https://api.example.com/api/v1')
    expect(collection.users.get(true)).toBe('https://api.example.com/api/v1/users')

    const userDetailPath = collection.userDetail.get({ id: '42' }, true)
    expect(userDetailPath).toBe('https://api.example.com/api/v1/users/42')

    const userPostsPath = collection.userPosts.get(
      {
        id: '42',
        '?': { sort: 'date', filter: 'published' },
      },
      true,
    )
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

  it('isMayBeSame: optional params can overlap static', () => {
    const optional = Route0.create('/users/:id?')
    const staticUsers = Route0.create('/users')
    expect(optional.isSame(staticUsers)).toBe(false)
    expect(optional.isMayBeSame(staticUsers)).toBe(true)
  })

  it('isConflict: wildcard overlaps deeper static routes', () => {
    const wildcard = Route0.create('/app*')
    const staticRoute = Route0.create('/app/home')
    expect(wildcard.isConflict(staticRoute)).toBe(true)
  })
})

describe('regex', () => {
  it('getRegexString: simple route', () => {
    const route = Route0.create('/')
    const regex = route.getRegexString()
    expect(regex).toBe('^/?$')
    expect(new RegExp(regex).test('/')).toBe(true)
    expect(new RegExp(regex).test('/other')).toBe(false)
  })

  it('getRegexString: static route', () => {
    const route = Route0.create('/users')
    const regex = route.getRegexString()
    expect(regex).toBe('^/users/?$')
    expect(new RegExp(regex).test('/users')).toBe(true)
    expect(new RegExp(regex).test('/users/123')).toBe(false)
  })

  it('getRegexString: route with single param', () => {
    const route = Route0.create('/users/:id')
    const regex = route.getRegexString()
    expect(regex).toBe('^/users/([^/]+)/?$')
    expect(new RegExp(regex).test('/users/123')).toBe(true)
    expect(new RegExp(regex).test('/users/abc')).toBe(true)
    expect(new RegExp(regex).test('/users/123/posts')).toBe(false)
    expect(new RegExp(regex).test('/users')).toBe(false)
  })

  it('getRegexString: route with multiple params', () => {
    const route = Route0.create('/users/:userId/posts/:postId')
    const regex = route.getRegexString()
    expect(regex).toBe('^/users/([^/]+)/posts/([^/]+)/?$')
    expect(new RegExp(regex).test('/users/123/posts/456')).toBe(true)
    expect(new RegExp(regex).test('/users/123/posts')).toBe(false)
  })

  it('getRegexString: route with special regex chars', () => {
    const route = Route0.create('/api/v1.0')
    const regex = route.getRegexString()
    // The dot should be escaped
    expect(regex).toBe('^/api/v1\\.0/?$')
    expect(new RegExp(regex).test('/api/v1.0')).toBe(true)
    expect(new RegExp(regex).test('/api/v100')).toBe(false)
  })

  it('getRegexString: handles trailing slash', () => {
    const route = Route0.create('/users/')
    const regex = route.getRegexString()
    // Trailing slash should be removed from pattern, but optional slash added in regex
    expect(regex).toBe('^/users/?$')
  })

  it('getRegexString: root with trailing slash', () => {
    const route = Route0.create('/')
    const regex = route.getRegexString()
    // Root returns pattern for empty string with optional slash
    expect(regex).toBe('^/?$')
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

  it('static getRegexString: multiple routes', () => {
    const routes = [Route0.create('/users'), Route0.create('/posts/:id'), Route0.create('/')]
    const regex = Route0.getRegexStringGroup(routes)
    expect(regex).toBe('(^/users/?$|^/posts/([^/]+)/?$|^/?$)')
  })

  it('static getRegexGroup: multiple routes', () => {
    const routes = [Route0.create('/users'), Route0.create('/posts/:id'), Route0.create('/')]
    const regex = Route0.getRegexGroup(routes)
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/posts/123')).toBe(true)
    expect(regex.test('/')).toBe(true)
    expect(regex.test('/other')).toBe(false)
  })

  it('static getRegexGroup: matches in order', () => {
    const routes = [Route0.create('/users/special'), Route0.create('/users/:id')]
    const regex = Route0.getRegexGroup(routes)
    const match = '/users/special'.match(regex)
    expect(match).toBeTruthy()
    // Both could match, but first one should win
    expect(match?.[0]).toBe('/users/special')
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

  it('static getRegexGroup: complex routing scenario', () => {
    const api = Route0.create('/api/v1')
    const routes = [
      Route0.create('/'),
      api,
      api.extend('/users'),
      api.extend('/users/:id'),
      api.extend('/posts/:postId'),
      Route0.create('/:slug'),
    ]

    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/')).toBe(true)
    expect(regex.test('/api/v1')).toBe(true)
    expect(regex.test('/api/v1/users')).toBe(true)
    expect(regex.test('/api/v1/users/123')).toBe(true)
    expect(regex.test('/api/v1/posts/456')).toBe(true)
    expect(regex.test('/about')).toBe(true) // matches /:slug
    expect(regex.test('/api/v1/users/123/extra')).toBe(false)
  })

  it('getRegex: handles trailing slash correctly', () => {
    const route = Route0.create('/users')
    const regex = route.getRegex()
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/')).toBe(true) // trailing slash should match
    expect(regex.test('/users//')).toBe(false) // double slash should not match
    expect(regex.test('/users/abc')).toBe(false) // additional segment should not match
  })

  it('getRegex: route with params and trailing slash', () => {
    const route = Route0.create('/users/:id')
    const regex = route.getRegex()
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/users/123/')).toBe(true) // trailing slash should match
    expect(regex.test('/users/123/abc')).toBe(false) // additional segment should not match
    expect(regex.test('/users/')).toBe(false) // missing param
  })

  it('getRegex: root route edge cases', () => {
    const route = Route0.create('/')
    const regex = route.getRegex()
    expect(regex.test('/')).toBe(true)
    expect(regex.test('')).toBe(true) // empty string should match root
    expect(regex.test('//')).toBe(false) // double slash should not match
    expect(regex.test('/users')).toBe(false) // non-root should not match
  })

  it('getRegexString: handles multiple special regex characters', () => {
    const route1 = Route0.create('/api/v1.0')
    const route2 = Route0.create('/path(with)parens')
    const route3 = Route0.create('/path[with]brackets')
    const route4 = Route0.create('/path*with*asterisks')
    const route5 = Route0.create('/path+with+pluses')
    const route6 = Route0.create('/path?with?question')
    const route7 = Route0.create('/path^with^caret')
    const route8 = Route0.create('/path$with$dollar')

    expect(route1.getRegexString()).toBe('^/api/v1\\.0/?$')
    expect(route2.getRegexString()).toBe('^/path\\(with\\)parens/?$')
    expect(route3.getRegexString()).toBe('^/path\\[with\\]brackets/?$')
    expect(route4.getRegexString()).toBe('^/path\\*with\\*asterisks/?$')
    expect(route5.getRegexString()).toBe('^/path\\+with\\+pluses/?$')
    expect(route6.getRegexString()).toBe('^/path\\?with\\?question/?$')
    expect(route7.getRegexString()).toBe('^/path\\^with\\^caret/?$')
    expect(route8.getRegexString()).toBe('^/path\\$with\\$dollar/?$')
  })

  it('getRegex: works with escaped special characters', () => {
    const route = Route0.create('/api/v1.0/users')
    const regex = route.getRegex()
    expect(regex.test('/api/v1.0/users')).toBe(true)
    expect(regex.test('/api/v1.0/users/')).toBe(true)
    expect(regex.test('/api/v100/users')).toBe(false) // dot must be literal
    expect(regex.test('/api/v1.0/users/extra')).toBe(false)
  })

  it('static getRegexGroup: handles routes with overlapping patterns', () => {
    const routes = [
      Route0.create('/users/special'),
      Route0.create('/users/:id'),
      Route0.create('/users/:id/edit'),
      Route0.create('/users'),
    ]
    const regex = Route0.getRegexGroup(routes)

    // Should match in order - first specific route wins
    expect(regex.test('/users/special')).toBe(true)
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/users/123/edit')).toBe(true)
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/special/extra')).toBe(false)
    expect(regex.test('/users/123/extra')).toBe(false)
  })

  it('static getRegexGroup: prevents partial matches', () => {
    const routes = [Route0.create('/api'), Route0.create('/api/v1'), Route0.create('/api/v1/users')]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/api')).toBe(true)
    expect(regex.test('/api/')).toBe(true)
    expect(regex.test('/api/v1')).toBe(true)
    expect(regex.test('/api/v1/')).toBe(true)
    expect(regex.test('/api/v1/users')).toBe(true)
    expect(regex.test('/api/v1/users/')).toBe(true)
    expect(regex.test('/api/v2')).toBe(false)
    expect(regex.test('/api/v1/users/123')).toBe(false) // should not match /api/v1/users
  })

  it('static getRegexGroup: handles root with other routes', () => {
    const routes = [Route0.create('/'), Route0.create('/home'), Route0.create('/about')]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/')).toBe(true)
    expect(regex.test('')).toBe(true)
    expect(regex.test('/home')).toBe(true)
    expect(regex.test('/about')).toBe(true)
    expect(regex.test('/other')).toBe(false)
  })

  it('static getRegexGroup: multiple routes with params', () => {
    const routes = [
      Route0.create('/posts/:id'),
      Route0.create('/users/:id'),
      Route0.create('/categories/:category/posts/:id'),
    ]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/posts/123')).toBe(true)
    expect(regex.test('/posts/123/')).toBe(true)
    expect(regex.test('/users/456')).toBe(true)
    expect(regex.test('/categories/tech/posts/789')).toBe(true)
    expect(regex.test('/posts/123/comments')).toBe(false)
    expect(regex.test('/users/456/posts')).toBe(false)
  })

  it('getRegex: prevents matching beyond route definition', () => {
    const route = Route0.create('/users/:id/posts/:postId')
    const regex = route.getRegex()

    expect(regex.test('/users/1/posts/2')).toBe(true)
    expect(regex.test('/users/1/posts/2/')).toBe(true)
    expect(regex.test('/users/1/posts/2/comments')).toBe(false)
    expect(regex.test('/users/1/posts/2/comments/3')).toBe(false)
    expect(regex.test('/users/1/posts')).toBe(false)
    expect(regex.test('/users/1')).toBe(false)
  })

  it('static getRegexGroup: routes should not match partial segments', () => {
    const routes = [Route0.create('/admin'), Route0.create('/admin/users'), Route0.create('/admin/settings')]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/admin')).toBe(true)
    expect(regex.test('/admin/users')).toBe(true)
    expect(regex.test('/admin/settings')).toBe(true)
    expect(regex.test('/admin/users/123')).toBe(false) // /admin/users should not match longer paths
    expect(regex.test('/admins')).toBe(false) // should not match partial word
    expect(regex.test('/admin-extra')).toBe(false)
  })

  it('getRegex: handles consecutive slashes correctly', () => {
    const route = Route0.create('/users')
    const regex = route.getRegex()

    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/')).toBe(true)
    expect(regex.test('//users')).toBe(false) // double leading slash
    expect(regex.test('/users//')).toBe(false) // double trailing slash
    expect(regex.test('///users')).toBe(false) // triple slash
  })

  it('static getRegexGroup: handles very similar route patterns', () => {
    const routes = [
      Route0.create('/a/b'),
      Route0.create('/a/:param'),
      Route0.create('/a/b/c'),
      Route0.create('/a/b/:param'),
    ]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/a/b')).toBe(true)
    expect(regex.test('/a/xyz')).toBe(true) // matches /a/:param
    expect(regex.test('/a/b/c')).toBe(true)
    expect(regex.test('/a/b/xyz')).toBe(true) // matches /a/b/:param
    expect(regex.test('/a/b/c/d')).toBe(false)
  })

  it('getRegex: handles params with special characters', () => {
    const route = Route0.create('/users/:id')
    const regex = route.getRegex()

    // Params should match URL-encoded characters
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/users/user-123')).toBe(true)
    expect(regex.test('/users/user_123')).toBe(true)
    expect(regex.test('/users/user.123')).toBe(true)
    expect(regex.test('/users/user%20123')).toBe(true) // URL encoded space
    expect(regex.test('/users/user%2F123')).toBe(true) // URL encoded slash (but this is a param value)
  })

  it('static getRegexGroup: ensures exact match boundaries', () => {
    const routes = [
      Route0.create('/test'),
      Route0.create('/testing'),
      Route0.create('/testing/:id'),
      Route0.create('/testing/:id/xxx'),
    ]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/test')).toBe(true)
    expect(regex.test('/test/')).toBe(true)
    expect(regex.test('/testing')).toBe(true)
    expect(regex.test('/testing/')).toBe(true)
    expect(regex.test('/testing/123')).toBe(true)
    expect(regex.test('/testing/123/xxx')).toBe(true)
    expect(regex.test('/test/ing')).toBe(false) // should not partially match
    expect(regex.test('/tested')).toBe(false) // should not match longer word
  })

  it('getRegexString: handles empty segments', () => {
    const route = Route0.create('/users//posts')
    const regex = route.getRegexString()
    // Double slashes should be normalized to single slash
    expect(regex).toContain('/users')
    expect(regex).toContain('/posts')
  })

  it('static getRegexGroup: root route should not interfere with other routes', () => {
    const routes = [
      Route0.create('/'),
      Route0.create('/root'),
      Route0.create('/root/:id'),
      Route0.create('/root/:id/xxx'),
    ]
    const regex = Route0.getRegexGroup(routes)

    expect(regex.test('/')).toBe(true)
    expect(regex.test('')).toBe(true)
    expect(regex.test('/root')).toBe(true)
    expect(regex.test('/root/')).toBe(true)
    expect(regex.test('/rootx')).toBe(false)
    expect(regex.test('/root/123')).toBe(true)
    expect(regex.test('/root/123/xxx')).toBe(true)
    expect(regex.test('/root/123/yyy')).toBe(false)
    expect(regex.test('/rooting')).toBe(false)
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

  it('_makeOrdering: keeps concrete routes before wildcard overlaps', () => {
    const routes = {
      appWildcard: '/app*',
      appHome: '/app/home',
      app: '/app',
    }
    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)
    expect(ordering).toEqual(['/app', '/app/home', '/app*'])
  })

  it('_makeOrdering: mixed optional and required params are deterministic', () => {
    const routes = {
      usersOptional: '/users/:id?',
      usersRequired: '/users/:id',
      usersStatic: '/users/new',
      usersWildcard: '/users/*?',
    }
    const { pathsOrdering: ordering } = Routes._.makeOrdering(routes)
    expect(ordering.indexOf('/users/new')).toBeLessThan(ordering.indexOf('/users/:id'))
    expect(ordering.indexOf('/users/:id')).toBeLessThan(ordering.indexOf('/users/:id?'))
    expect(ordering.indexOf('/users/:id?')).toBeLessThan(ordering.indexOf('/users/*?'))
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

  it('ordering is preserved after clone', () => {
    const routes = Routes.create({
      home: '/',
      users: '/users',
      userDetail: '/users/:id',
    })

    const originalOrdering = routes._.pathsOrdering

    const overridden = routes._.clone({ origin: 'https://example.com' })

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

describe('relations: isSame, isAncestor, isDescendant', () => {
  it('isSame: same static path', () => {
    const a = Route0.create('/a')
    const b = Route0.create('/a')
    expect(a.isSame(b)).toBe(true)
  })

  it('isSame: ignores param names but respects structure', () => {
    const r1 = Route0.create('/users/:id')
    const r2 = Route0.create('/users/:userId')
    const r3 = Route0.create('/users')
    const r4 = Route0.create('/users/:id/posts')
    expect(r1.isSame(r2)).toBe(true)
    expect(r1.isSame(r3)).toBe(false)
    expect(r1.isSame(r4)).toBe(false)
  })

  it('isAncestor: true when left is ancestor of right', () => {
    expect(Route0.create('/').isAncestor(Route0.create('/path/child'))).toBe(true)
    expect(Route0.create('/path').isAncestor(Route0.create('/path/child'))).toBe(true)
    expect(Route0.create('/users/:id').isAncestor('/users/:id/posts')).toBe(true)
    expect(Route0.create('/').isAncestor(Route0.create('/users/:id/posts'))).toBe(true)
    expect(Route0.create('/').isAncestor(Route0.create('/users/:id'))).toBe(true)
  })

  it('isAncestor: false for reverse, equal, or unrelated', () => {
    expect(Route0.create('/path/child').isAncestor(Route0.create('/path'))).toBe(false)
    expect(Route0.create('/path').isAncestor(Route0.create('/path'))).toBe(false)
    expect(Route0.create('/a').isAncestor(Route0.create('/b'))).toBe(false)
  })

  it('isDescendant: true when left is descendant of right', () => {
    expect(Route0.create('/path/child').isDescendant(Route0.create('/path'))).toBe(true)
    expect(Route0.create('/users/:id/posts').isDescendant(Route0.create('/users/:id'))).toBe(true)
    expect(Route0.create('/users/:id/posts').isDescendant(Route0.create('/'))).toBe(true)
  })

  it('isDescendant: false for reverse, equal, or unrelated', () => {
    expect(Route0.create('/path').isDescendant(Route0.create('/path/child'))).toBe(false)
    expect(Route0.create('/path').isDescendant(Route0.create('/path'))).toBe(false)
    expect(Route0.create('/a').isDescendant(Route0.create('/b'))).toBe(false)
  })

  it('static isSame: works with strings and undefined', () => {
    expect(Route0.isSame('/a/:id', Route0.create('/a/:name'))).toBe(true)
    expect(Route0.isSame('/a', '/a')).toBe(true)
    expect(Route0.isSame('/a', '/b')).toBe(false)
    expect(Route0.isSame(undefined, undefined)).toBe(true)
    expect(Route0.isSame(undefined, '/a')).toBe(false)
    expect(Route0.isSame('/a', undefined)).toBe(false)
  })
})

describe('types widening', () => {
  it('any location extends any location', () => {
    expectTypeOf<UnknownLocation>().toExtend<AnyLocation>()
    expectTypeOf<KnownLocation<'/path'>>().toExtend<AnyLocation>()
    expectTypeOf<WeakDescendantLocation<'/path'>>().toExtend<AnyLocation>()
    expectTypeOf<WeakAncestorLocation<'/path'>>().toExtend<AnyLocation>()
    expectTypeOf<ExactLocation<'/path'>>().toExtend<AnyLocation>()

    expectTypeOf<UnknownLocation>().toExtend<AnyLocation>()
    expectTypeOf<KnownLocation<'/:id'>>().toExtend<AnyLocation>()
    expectTypeOf<WeakDescendantLocation<'/:id'>>().toExtend<AnyLocation>()
    expectTypeOf<WeakAncestorLocation<'/:id'>>().toExtend<AnyLocation>()
    expectTypeOf<ExactLocation<'/:id'>>().toExtend<AnyLocation>()
  })

  it('location by path extends same location by any path', () => {
    expectTypeOf<KnownLocation<any>>().toExtend<KnownLocation<'/path'>>()
    expectTypeOf<WeakDescendantLocation<any>>().toExtend<WeakDescendantLocation<'/path'>>()
    expectTypeOf<WeakAncestorLocation<any>>().toExtend<WeakAncestorLocation<'/path'>>()
    expectTypeOf<ExactLocation<any>>().toExtend<ExactLocation<'/path'>>()

    expectTypeOf<KnownLocation<any>>().toExtend<KnownLocation<'/:id'>>()
    expectTypeOf<WeakDescendantLocation<any>>().toExtend<WeakDescendantLocation<'/:id'>>()
    expectTypeOf<WeakAncestorLocation<any>>().toExtend<WeakAncestorLocation<'/:id'>>()
    expectTypeOf<ExactLocation<any>>().toExtend<ExactLocation<'/:id'>>()
  })

  it('any route definition extends any route', () => {
    expectTypeOf<AnyRoute<any>>().toExtend<AnyRoute<'/path'>>()
    expectTypeOf<AnyRoute<any>>().toExtend<AnyRoute<'/:id'>>()
  })
})
