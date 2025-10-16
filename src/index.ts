// TODO: Роут0 три пусть три тоже сам генерится вероятно
// TODO: Роут0 три мод, тогда там все ноуты кончаются на .селф
// TODO: use splats in param definition "*"
// TODO: ? check extend for query only .extend('&x&z')
// TODO: .create(route, {useQuery, useParams})
// TODO: Из пас экзакт, из пасвизквери экзает, из чилдрен, из парент, из экзактОр
// TODO: isEqual, isChildren, isParent
// TODO: extractParams, extractQuery
// TODO: getPathDefinition respecting definitionParamPrefix, definitionQueryPrefix
// TODO: prepend
// TODO: Route0.createTree({base:{self: x, children: ...})
// TODO: overrideTree
// TODO: .create(route, {baseUrl, useLocation})
// TODO: ? optional path params as @
// TODO: prependMany, extendMany, overrideMany, with types

// page0
// TODO: Сделать чисто фронтовую штуку, которая сама вызывает лоадер, сама вызывает нужные мета и title, и отдаёт в компонент нужные штуки

// ssr0
// TODO: ССР работает просто поверх любого роутера, который поддерживает асинхронную загрузку страниц

export class Route0<
  TPathOriginalDefinition extends string,
  TPathDefinition extends Route0._PathDefinition<TPathOriginalDefinition>,
  TParamsDefinition extends Route0._ParamsDefinition<TPathOriginalDefinition>,
  TQueryDefinition extends Route0._QueryDefinition<TPathOriginalDefinition>,
> {
  pathOriginalDefinition: TPathOriginalDefinition
  private readonly pathDefinition: TPathDefinition
  paramsDefinition: TParamsDefinition
  queryDefinition: TQueryDefinition
  baseUrl: string

  private constructor(definition: TPathOriginalDefinition, config: Route0.RouteConfigInput = {}) {
    this.pathOriginalDefinition = definition
    this.pathDefinition = Route0._getPathDefinitionByOriginalDefinition(definition) as TPathDefinition
    this.paramsDefinition = Route0._getParamsDefinitionByRouteDefinition(definition) as TParamsDefinition
    this.queryDefinition = Route0._getQueryDefinitionByRouteDefinition(definition) as TQueryDefinition

    const { baseUrl } = config
    if (baseUrl && typeof baseUrl === 'string' && baseUrl.length) {
      this.baseUrl = baseUrl
    } else {
      const g = globalThis as unknown as { location?: { origin?: string } }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (g?.location?.origin) {
        this.baseUrl = g.location.origin
      } else {
        this.baseUrl = 'https://example.com'
      }
    }
  }

  static create<
    TPathOriginalDefinition extends string,
    TPathDefinition extends Route0._PathDefinition<TPathOriginalDefinition>,
    TParamsDefinition extends Route0._ParamsDefinition<TPathOriginalDefinition>,
    TQueryDefinition extends Route0._QueryDefinition<TPathOriginalDefinition>,
  >(
    definition: TPathOriginalDefinition,
    config?: Route0.RouteConfigInput,
  ): Route0.Callable<Route0<TPathOriginalDefinition, TPathDefinition, TParamsDefinition, TQueryDefinition>> {
    const original = new Route0<TPathOriginalDefinition, TPathDefinition, TParamsDefinition, TQueryDefinition>(
      definition,
      config,
    )
    const callable = original.get.bind(original)
    const proxy = new Proxy(callable, {
      get(_target, prop, receiver) {
        const value = (original as any)[prop]
        if (typeof value === 'function') {
          return value.bind(original)
        }
        return value
      },
      set(_target, prop, value, receiver) {
        ;(original as any)[prop] = value
        return true
      },
      has(_target, prop) {
        return prop in original
      },
    })
    Object.setPrototypeOf(proxy, Route0.prototype)
    return proxy as never
  }

  private static _splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition: string) {
    const i = pathOriginalDefinition.indexOf('&')
    if (i === -1) return { pathDefinition: pathOriginalDefinition, queryTailDefinition: '' }
    return {
      pathDefinition: pathOriginalDefinition.slice(0, i),
      queryTailDefinition: pathOriginalDefinition.slice(i),
    }
  }

  private static _getAbsPath(baseUrl: string, pathWithQuery: string) {
    return new URL(pathWithQuery, baseUrl).toString().replace(/\/$/, '')
  }

  private static _getPathDefinitionByOriginalDefinition<TPathOriginalDefinition extends string>(
    pathOriginalDefinition: TPathOriginalDefinition,
  ) {
    const { pathDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition)
    return pathDefinition as Route0._PathDefinition<TPathOriginalDefinition>
  }

  private static _getParamsDefinitionByRouteDefinition<TPathOriginalDefinition extends string>(
    pathOriginalDefinition: TPathOriginalDefinition,
  ) {
    const { pathDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition)
    const matches = Array.from(pathDefinition.matchAll(/:([A-Za-z0-9_]+)/g))
    const paramsDefinition = Object.fromEntries(matches.map((m) => [m[1], true]))
    return paramsDefinition as Route0._ParamsDefinition<TPathOriginalDefinition>
  }

  private static _getQueryDefinitionByRouteDefinition<TPathOriginalDefinition extends string>(
    pathOriginalDefinition: TPathOriginalDefinition,
  ) {
    const { queryTailDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition)
    if (!queryTailDefinition) {
      return {} as Route0._QueryDefinition<TPathOriginalDefinition>
    }
    const keys = queryTailDefinition.split('&').map(Boolean)
    const queryDefinition = Object.fromEntries(keys.map((k) => [k, true]))
    return queryDefinition as Route0._QueryDefinition<TPathOriginalDefinition>
  }

  static overrideMany<T extends Record<string, Route0.AnyRoute>>(routes: T, config: Route0.RouteConfigInput): T {
    const result = {} as T
    for (const [key, value] of Object.entries(routes)) {
      ;(result as any)[key] = value.clone(config)
    }
    return result
  }

  extend<TSuffixDefinition extends string>(
    suffixDefinition: TSuffixDefinition,
  ): Route0.Callable<
    Route0<
      Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>,
      Route0._PathDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>,
      Route0._ParamsDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>,
      Route0._QueryDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>
    >
  > {
    const { pathDefinition: parentPathDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(
      this.pathOriginalDefinition,
    )
    const { pathDefinition: suffixPathDefinition, queryTailDefinition: suffixQueryTailDefinition } =
      Route0._splitPathDefinitionAndQueryTailDefinition(suffixDefinition)
    const pathDefinition = `${parentPathDefinition}/${suffixPathDefinition}`.replace(/\/{2,}/g, '/')
    const pathOriginalDefinition =
      `${pathDefinition}${suffixQueryTailDefinition}` as Route0._RoutePathOriginalDefinitionExtended<
        TPathOriginalDefinition,
        TSuffixDefinition
      >
    return Route0.create<
      Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>,
      Route0._PathDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>,
      Route0._ParamsDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>,
      Route0._QueryDefinition<Route0._RoutePathOriginalDefinitionExtended<TPathOriginalDefinition, TSuffixDefinition>>
    >(pathOriginalDefinition, { baseUrl: this.baseUrl })
  }

  // has params
  get(
    input: Route0._OnlyIfHasParams<
      TParamsDefinition,
      Route0._WithParamsInput<TParamsDefinition, { query?: undefined; abs?: false }>
    >,
  ): Route0._OnlyIfHasParams<TParamsDefinition, Route0._PathOnlyRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfHasParams<
      TParamsDefinition,
      Route0._WithParamsInput<TParamsDefinition, { query: Route0._QueryInput<TQueryDefinition>; abs?: false }>
    >,
  ): Route0._OnlyIfHasParams<TParamsDefinition, Route0._WithQueryRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfHasParams<
      TParamsDefinition,
      Route0._WithParamsInput<TParamsDefinition, { query?: undefined; abs: true }>
    >,
  ): Route0._OnlyIfHasParams<TParamsDefinition, Route0._AbsolutePathOnlyRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfHasParams<
      TParamsDefinition,
      Route0._WithParamsInput<TParamsDefinition, { query: Route0._QueryInput<TQueryDefinition>; abs: true }>
    >,
  ): Route0._OnlyIfHasParams<TParamsDefinition, Route0._AbsoluteWithQueryRouteValue<TPathOriginalDefinition>>

  // no params
  get(
    ...args: Route0._OnlyIfNoParams<TParamsDefinition, [], [never]>
  ): Route0._PathOnlyRouteValue<TPathOriginalDefinition>
  get(
    input: Route0._OnlyIfNoParams<TParamsDefinition, { query?: undefined; abs?: false }>,
  ): Route0._OnlyIfNoParams<TParamsDefinition, Route0._PathOnlyRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfNoParams<TParamsDefinition, { query: Route0._QueryInput<TQueryDefinition>; abs?: false }>,
  ): Route0._OnlyIfNoParams<TParamsDefinition, Route0._WithQueryRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfNoParams<TParamsDefinition, { query?: undefined; abs: true }>,
  ): Route0._OnlyIfNoParams<TParamsDefinition, Route0._AbsolutePathOnlyRouteValue<TPathOriginalDefinition>>
  get(
    input: Route0._OnlyIfNoParams<TParamsDefinition, { query: Route0._QueryInput<TQueryDefinition>; abs: true }>,
  ): Route0._OnlyIfNoParams<TParamsDefinition, Route0._AbsoluteWithQueryRouteValue<TPathOriginalDefinition>>

  // implementation
  get(...args: any[]): string {
    const { queryInput, paramsInput, absInput } = ((): {
      queryInput: Record<string, string | number>
      paramsInput: Record<string, string | number>
      absInput: boolean
    } => {
      if (args.length === 0) {
        return { queryInput: {}, paramsInput: {}, absInput: false }
      }
      const input = args[0]
      if (typeof input !== 'object' || input === null) {
        // throw new Error("Invalid get route input: expected object")
        return { queryInput: {}, paramsInput: {}, absInput: false }
      }
      const { query, abs, ...params } = input
      return { queryInput: query || {}, paramsInput: params, absInput: abs ?? false }
    })()

    // validate params
    const neededParamsKeys = Object.keys(this.paramsDefinition)
    const providedParamsKeys = Object.keys(paramsInput)
    const notProvidedKeys = neededParamsKeys.filter((k) => !providedParamsKeys.includes(k))
    if (notProvidedKeys.length) {
      // throw new Error(`Missing params: not defined keys ${notProvidedKeys.map((k) => `"${k}"`).join(", ")}.`)
      Object.assign(paramsInput, Object.fromEntries(notProvidedKeys.map((k) => [k, 'undefined'])))
    }

    // create url
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    let url = String(this.pathDefinition)
    // replace params
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    url = url.replace(/:([A-Za-z0-9_]+)/g, (_m, k) => encodeURIComponent(String(paramsInput?.[k] ?? '')))
    // query params
    const queryInputStringified = Object.fromEntries(Object.entries(queryInput).map(([k, v]) => [k, String(v)]))
    url = [url, new URLSearchParams(queryInputStringified).toString()].filter(Boolean).join('?')
    // dedupe slashes
    url = url.replace(/\/{2,}/g, '/')
    // absolute
    url = absInput ? Route0._getAbsPath(this.baseUrl, url) : url

    return url
  }

  getDefinition() {
    return this.pathDefinition
  }

  clone(config?: Route0.RouteConfigInput) {
    return new Route0(this.pathOriginalDefinition, config)
  }

  static getLocation(url: `${string}://${string}`): Route0.Location
  static getLocation(path: `/${string}`): Route0.Location
  static getLocation(urlOrPath: string): Route0.Location
  static getLocation(urlOrPath: string): Route0.Location {
    // Allow both relative and absolute inputs
    const abs = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlOrPath)
    const base = abs ? undefined : 'http://example.com' // dummy base for relative URLs

    const url = new URL(urlOrPath, base)

    // Extract query and params (params left empty for now — parsed separately)
    const query = Object.fromEntries(url.searchParams.entries())

    // Normalize pathname (remove trailing slash except for root)
    let pathname = url.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    // Build the location object similar to browser location
    return {
      query,
      params: {}, // filled later by .parse()
      pathname,
      search: url.search,
      hash: url.hash,
      origin: abs ? url.origin : undefined,
      href: abs ? url.href : pathname + url.search + url.hash,
      abs,
    }
  }

  match(url: string): Route0.MatchResult<this> {
    const location = Route0.getLocation(url)

    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

    // Normalize both sides (no trailing slash except root)
    const def =
      this.pathDefinition.length > 1 && this.pathDefinition.endsWith('/')
        ? this.pathDefinition.slice(0, -1)
        : this.pathDefinition
    const pathname =
      location.pathname.length > 1 && location.pathname.endsWith('/')
        ? location.pathname.slice(0, -1)
        : location.pathname

    // Build a regex from the route definition: /a/:x/b/:y -> ^/a/([^/]+)/b/([^/]+)$
    const paramNames: string[] = []
    const pattern = def.replace(/:([A-Za-z0-9_]+)/g, (_m, name) => {
      paramNames.push(String(name))
      return '([^/]+)'
    })

    const exactRe = new RegExp(`^${pattern}$`)
    const parentRe = new RegExp(`^${pattern}(?:/.*)?$`) // route matches the beginning of the URL (may have more)
    const exactMatch = pathname.match(exactRe)

    // Fill params only for exact match (keeps behavior predictable)
    if (exactMatch) {
      const values = exactMatch.slice(1)
      const params = Object.fromEntries(paramNames.map((n, i) => [n, decodeURIComponent(values[i] ?? '')]))
      ;(location as any).params = params
    } else {
      ;(location as any).params = {}
    }

    const exact = !!exactMatch
    const parent = !exact && parentRe.test(pathname)

    // "children": the URL is a prefix of the route definition (ignoring params’ concrete values)
    // We check if the definition starts with the URL path boundary-wise.
    const children = !exact && new RegExp(`^${escapeRegex(pathname)}(?:/|$)`).test(def)

    return {
      exact,
      parent,
      children,
      location,
    } as never
  }
}

export namespace Route0 {
  export type AnyRoute = Route0<any, any, any, any>
  export type Callable<T extends AnyRoute> = T & T['get']
  export type RouteConfigInput = {
    baseUrl?: string
  }
  export type Params<TRoute0 extends AnyRoute> = {
    [K in keyof TRoute0['paramsDefinition']]: string
  }
  export type Query<TRoute0 extends AnyRoute> = Partial<
    {
      [K in keyof TRoute0['queryDefinition']]: string | undefined
    } & Record<string, string | undefined>
  >

  export type _TrimQueryTailDefinition<S extends string> = S extends `${infer P}&${string}` ? P : S
  export type _QueryTailDefinitionWithoutFirstAmp<S extends string> = S extends `${string}&${infer T}` ? T : ''
  export type _QueryTailDefinitionWithFirstAmp<S extends string> = S extends `${string}&${infer T}` ? `&${T}` : ''
  export type _AmpSplit<S extends string> = S extends `${infer A}&${infer B}` ? A | _AmpSplit<B> : S
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  export type _NonEmpty<T> = [T] extends ['' | never] ? never : T
  export type _ExtractPathParams<S extends string> = S extends `${string}:${infer After}`
    ? After extends `${infer Name}/${infer Rest}`
      ? Name | _ExtractPathParams<`/${Rest}`>
      : After
    : never
  export type _ReplacePathParams<S extends string> = S extends `${infer Head}:${infer Tail}`
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Tail extends `${infer _Param}/${infer Rest}`
      ? _ReplacePathParams<`${Head}${string}/${Rest}`>
      : `${Head}${string}`
    : S
  export type _DedupeSlashes<S extends string> = S extends `${infer A}//${infer B}` ? _DedupeSlashes<`${A}/${B}`> : S
  export type _EmptyRecord = Record<never, never>
  export type _JoinPath<Parent extends string, Suffix extends string> = _DedupeSlashes<
    _PathDefinition<Parent> extends infer A extends string
      ? _PathDefinition<Suffix> extends infer B extends string
        ? A extends ''
          ? B extends ''
            ? ''
            : B extends `/${string}`
              ? B
              : `/${B}`
          : B extends ''
            ? A
            : A extends `${string}/`
              ? `${A}${B}`
              : B extends `/${string}`
                ? `${A}${B}`
                : `${A}/${B}`
        : never
      : never
  >

  export type _OnlyIfNoParams<TParams extends object, Yes, No = never> = keyof TParams extends never ? Yes : No
  export type _OnlyIfHasParams<TParams extends object, Yes, No = never> = keyof TParams extends never ? No : Yes

  export type _PathDefinition<TPathOriginalDefinition extends string> =
    _TrimQueryTailDefinition<TPathOriginalDefinition>
  export type _ParamsDefinition<TPathOriginalDefinition extends string> =
    _ExtractPathParams<_PathDefinition<TPathOriginalDefinition>> extends infer U
      ? [U] extends [never]
        ? _EmptyRecord
        : { [K in Extract<U, string>]: true }
      : _EmptyRecord
  export type _QueryDefinition<TPathOriginalDefinition extends string> =
    _NonEmpty<_QueryTailDefinitionWithoutFirstAmp<TPathOriginalDefinition>> extends infer Tail extends string
      ? _AmpSplit<Tail> extends infer U
        ? [U] extends [never]
          ? _EmptyRecord
          : { [K in Extract<U, string>]: true }
        : _EmptyRecord
      : _EmptyRecord
  export type _RoutePathOriginalDefinitionExtended<
    TSourcePathOriginalDefinition extends string,
    TSuffixPathOriginalDefinition extends string,
  > = `${_JoinPath<TSourcePathOriginalDefinition, TSuffixPathOriginalDefinition>}${_QueryTailDefinitionWithFirstAmp<TSuffixPathOriginalDefinition>}`

  export type _ParamsInput<TParamsDefinition extends object> = {
    [K in keyof TParamsDefinition]: string | number
  }
  export type _QueryInput<TQueryDefinition extends object> = Partial<{
    [K in keyof TQueryDefinition]: string | number
  }> &
    Record<string, string | number>
  export type _WithParamsInput<
    TParamsDefinition extends object,
    T extends {
      query?: _QueryInput<any>
      abs?: boolean
    },
  > = _ParamsInput<TParamsDefinition> & T

  export type _PathOnlyRouteValue<TPathOriginalDefinition extends string> =
    `${_ReplacePathParams<_PathDefinition<TPathOriginalDefinition>>}`
  export type _WithQueryRouteValue<TPathOriginalDefinition extends string> =
    `${_ReplacePathParams<_PathDefinition<TPathOriginalDefinition>>}?${string}`
  export type _AbsolutePathOnlyRouteValue<TPathOriginalDefinition extends string> =
    `${string}${_PathOnlyRouteValue<TPathOriginalDefinition>}`
  export type _AbsoluteWithQueryRouteValue<TPathOriginalDefinition extends string> =
    `${string}${_WithQueryRouteValue<TPathOriginalDefinition>}`

  export type Location<TRoute0 extends AnyRoute = AnyRoute> = {
    query: _QueryInput<TRoute0['queryDefinition']>
    params: _ParamsInput<TRoute0['paramsDefinition']>
    pathname: string
    search: string
    hash: string
    origin?: string
    href: string
    abs: boolean
  }
  export type MatchResult<TRoute0 extends AnyRoute, TExact extends boolean = boolean> = TExact extends true
    ? {
        exact: true
        parent: false
        children: false
        location: Location<TRoute0>
      }
    : TExact extends false
      ? {
          exact: false
          parent: boolean
          children: boolean
          location: Location
        }
      : never
}
