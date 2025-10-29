import { describe, expect, expectTypeOf, it } from 'bun:test'
import type {
  Extended,
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
  StrictSearchInput,
  StrictSearchOutput,
} from './index.js'
import { Route0, Routes } from './index.js'

describe('route0', () => {
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
    expect(route0.flat({ x: '1', y: '2', z: '4', c: '5' })).toBe('/prefix/1/some/2/4?c=5')
  })

  it('params and search and any search', () => {
    const route0 = Route0.create('/prefix/:x/some/:y/:z&z&c')
    const path = route0.get({ x: '1', y: '2', z: '3', search: { z: '4', c: '5', o: '6' } })
    expectTypeOf<typeof path>().toEqualTypeOf<`/prefix/${string}/some/${string}/${string}?${string}`>()
    expect(path).toBe('/prefix/1/some/2/3?z=4&c=5&o=6')
    // very strange case
    expect(route0.flat({ x: '1', y: '2', z: '4', c: '5', o: '6' })).toBe('/prefix/1/some/2/4?c=5&o=6')
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
  //   const routes2 = Route0.overrideMany(routes, { baseUrl: 'https://z.com' })
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
    const route0 = Route0.create('/prefix/:x/some')
    const loc = route0.getLocation('/prefix/xxx/some/extra/path')
    expect(loc.exact).toBe(false)
    expect(loc.parent).toBe(true)
    expect(loc.children).toBe(false)
  })

  it('#getLocation() children match', () => {
    const route0 = Route0.create('/prefix/some/extra/path')
    const loc = route0.getLocation('/prefix/some')
    expect(loc.exact).toBe(false)
    expect(loc.parent).toBe(false)
    expect(loc.children).toBe(true)
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
})

describe('route0 type utilities', () => {
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

describe('RoutesCollection', () => {
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
    expect(home.pathOriginal).toBe('/')
    expect(user.pathOriginal).toBe('/user/:id')
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

    const overridden = collection.override({ baseUrl: 'https://example.com' })

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

    const overridden = collection.override({ baseUrl: 'https://newdomain.com' })
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

    const overridden = collection.override({ baseUrl: 'https://new-api.example.com' })

    expect(overridden.api.get({ abs: true })).toBe('https://new-api.example.com/api')
    expect(overridden.users.get({ abs: true })).toBe('https://new-api.example.com/api/users')
  })

  it('hydrate static method', () => {
    const hydrated = Routes._hydrate({
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
