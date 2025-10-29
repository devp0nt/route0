// TODO: в локейшен хранить и сам роут route and also isRouteDetected
// TODO: normal name of route proxy so it can be printable and readable
// TODO: getLocation by windows location
// TODO: избавиться от жутких эни в роуте
// TODO: .extension('.json') to not add additional / but just add some extension
// TODO: query input can be boolean, or even object with qs
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
// TODO: optional route params /x/:id?

// point0
// TODO: Сделать чисто фронтовую штуку, которая сама вызывает лоадер, сама вызывает нужные мета и title, и отдаёт в компонент нужные штуки

// ssr0
// TODO: ССР работает просто поверх любого роутера, который поддерживает асинхронную загрузку страниц

export class Route0<
  TPath extends string,
  TPathDefinition extends PathDefinition<TPath>,
  TParamsDefinition extends ParamsDefinition<TPath>,
  TQueryDefinition extends QueryDefinition<TPath>,
> {
  readonly pathOriginalDefinition: TPath
  readonly pathDefinition: TPathDefinition
  readonly paramsDefinition: TParamsDefinition
  readonly queryDefinition: TQueryDefinition
  baseUrl: string

  private constructor(definition: TPath, config: RouteConfigInput = {}) {
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
      if (typeof g?.location?.origin === 'string' && g.location.origin.length > 0) {
        this.baseUrl = g.location.origin
      } else {
        this.baseUrl = 'https://example.com'
      }
    }
  }

  static create<
    TPathOriginalDefinition extends string,
    TPathDefinition extends PathDefinition<TPathOriginalDefinition>,
    TParamsDefinition extends ParamsDefinition<TPathOriginalDefinition>,
    TQueryDefinition extends QueryDefinition<TPathOriginalDefinition>,
  >(
    definition: TPathOriginalDefinition,
    config?: RouteConfigInput,
  ): Callable<Route0<TPathOriginalDefinition, TPathDefinition, TParamsDefinition, TQueryDefinition>> {
    const original = new Route0<TPathOriginalDefinition, TPathDefinition, TParamsDefinition, TQueryDefinition>(
      definition,
      config,
    )
    const callable = original.get.bind(original)
    Object.setPrototypeOf(callable, original)
    Object.defineProperty(callable, Symbol.toStringTag, {
      value: original.pathOriginalDefinition,
    })
    return callable as never
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
    return pathDefinition as PathDefinition<TPathOriginalDefinition>
  }

  private static _getParamsDefinitionByRouteDefinition<TPathOriginalDefinition extends string>(
    pathOriginalDefinition: TPathOriginalDefinition,
  ) {
    const { pathDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition)
    const matches = Array.from(pathDefinition.matchAll(/:([A-Za-z0-9_]+)/g))
    const paramsDefinition = Object.fromEntries(matches.map((m) => [m[1], true]))
    return paramsDefinition as ParamsDefinition<TPathOriginalDefinition>
  }

  private static _getQueryDefinitionByRouteDefinition<TPathOriginalDefinition extends string>(
    pathOriginalDefinition: TPathOriginalDefinition,
  ) {
    const { queryTailDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(pathOriginalDefinition)
    if (!queryTailDefinition) {
      return {} as QueryDefinition<TPathOriginalDefinition>
    }
    const keys = queryTailDefinition.split('&').map(Boolean)
    const queryDefinition = Object.fromEntries(keys.map((k) => [k, true]))
    return queryDefinition as QueryDefinition<TPathOriginalDefinition>
  }

  static overrideMany<T extends Record<string, AnyRoute>>(routes: T, config: RouteConfigInput): T {
    const result = {} as T
    for (const [key, value] of Object.entries(routes)) {
      ;(result as any)[key] = value.clone(config)
    }
    return result
  }

  extend<TSuffixDefinition extends string>(
    suffixDefinition: TSuffixDefinition,
  ): Callable<
    Route0<
      RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>,
      PathDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>,
      ParamsDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>,
      QueryDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>
    >
  > {
    const { pathDefinition: parentPathDefinition } = Route0._splitPathDefinitionAndQueryTailDefinition(
      this.pathOriginalDefinition,
    )
    const { pathDefinition: suffixPathDefinition, queryTailDefinition: suffixQueryTailDefinition } =
      Route0._splitPathDefinitionAndQueryTailDefinition(suffixDefinition)
    const pathDefinition = `${parentPathDefinition}/${suffixPathDefinition}`.replace(/\/{2,}/g, '/')
    const pathOriginalDefinition =
      `${pathDefinition}${suffixQueryTailDefinition}` as RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>
    return Route0.create<
      RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>,
      PathDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>,
      ParamsDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>,
      QueryDefinition<RoutePathOriginalDefinitionExtended<TPath, TSuffixDefinition>>
    >(pathOriginalDefinition, { baseUrl: this.baseUrl })
  }

  // has params
  get(
    input: OnlyIfHasParams<TParamsDefinition, WithParamsInput<TParamsDefinition, { query?: undefined; abs?: false }>>,
  ): OnlyIfHasParams<TParamsDefinition, PathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<
      TParamsDefinition,
      WithParamsInput<TParamsDefinition, { query: QueryInput<TQueryDefinition>; abs?: false }>
    >,
  ): OnlyIfHasParams<TParamsDefinition, WithQueryRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<TParamsDefinition, WithParamsInput<TParamsDefinition, { query?: undefined; abs: true }>>,
  ): OnlyIfHasParams<TParamsDefinition, AbsolutePathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<
      TParamsDefinition,
      WithParamsInput<TParamsDefinition, { query: QueryInput<TQueryDefinition>; abs: true }>
    >,
  ): OnlyIfHasParams<TParamsDefinition, AbsoluteWithQueryRouteValue<TPath>>

  // no params
  get(...args: OnlyIfNoParams<TParamsDefinition, [], [never]>): PathOnlyRouteValue<TPath>
  get(
    input: OnlyIfNoParams<TParamsDefinition, { query?: undefined; abs?: false }>,
  ): OnlyIfNoParams<TParamsDefinition, PathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<TParamsDefinition, { query: QueryInput<TQueryDefinition>; abs?: false }>,
  ): OnlyIfNoParams<TParamsDefinition, WithQueryRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<TParamsDefinition, { query?: undefined; abs: true }>,
  ): OnlyIfNoParams<TParamsDefinition, AbsolutePathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<TParamsDefinition, { query: QueryInput<TQueryDefinition>; abs: true }>,
  ): OnlyIfNoParams<TParamsDefinition, AbsoluteWithQueryRouteValue<TPath>>

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
    const neededParamsKeys = this.paramsDefinition ? Object.keys(this.paramsDefinition) : []
    const providedParamsKeys = Object.keys(paramsInput)
    const notProvidedKeys = neededParamsKeys.filter((k) => !providedParamsKeys.includes(k))
    if (notProvidedKeys.length) {
      // throw new Error(`Missing params: not defined keys ${notProvidedKeys.map((k) => `"${k}"`).join(", ")}.`)
      Object.assign(paramsInput, Object.fromEntries(notProvidedKeys.map((k) => [k, 'undefined'])))
    }

    // create url

    let url = this.pathDefinition as string
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

  getDefinition(): string {
    return this.pathDefinition
  }

  clone(config?: RouteConfigInput): Route0<TPath, TPathDefinition, TParamsDefinition, TQueryDefinition> {
    return new Route0(this.pathOriginalDefinition, config)
  }

  static getLocation(url: `${string}://${string}`): Location
  static getLocation(path: `/${string}`): Location
  static getLocation(urlOrPath: string): Location
  static getLocation(urlOrPath: string): Location {
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

  static getMatch<TRoute0 extends AnyRoute>(route0: TRoute0, location: Location): MatchResult<TRoute0> {
    const locationCloned = { ...location, params: { ...location.params }, query: { ...location.query } }
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

    // Normalize both sides (no trailing slash except root)
    const def =
      route0.pathDefinition.length > 1 && route0.pathDefinition.endsWith('/')
        ? route0.pathDefinition.slice(0, -1)
        : route0.pathDefinition
    const pathname =
      locationCloned.pathname.length > 1 && locationCloned.pathname.endsWith('/')
        ? locationCloned.pathname.slice(0, -1)
        : locationCloned.pathname

    // Build a regex from the route definition: /a/:x/b/:y -> ^/a/([^/]+)/b/([^/]+)$
    const paramNames: string[] = []
    const pattern = def.replace(/:([A-Za-z0-9_]+)/g, (_m: string, name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
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
      locationCloned.params = params
    } else {
      locationCloned.params = {}
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
      location: locationCloned,
    } as never
  }
  match(url: string): MatchResult<this> {
    const location = Route0.getLocation(url)
    return Route0.getMatch(this, location)
  }
}

// main

export type AnyRoute = Route0<string, any, any, any>
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
export type LocationParams<TParamsDefinition extends object> = {
  [K in keyof TParamsDefinition]: string
}
export type LocationQuery<TQueryDefinition extends object> = {
  [K in keyof TQueryDefinition]: string | undefined
} & Record<string, string | undefined>
export type Location<TRoute0 extends AnyRoute = AnyRoute> = {
  query: LocationQuery<TRoute0['queryDefinition']>
  params: LocationParams<TRoute0['paramsDefinition']>
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
export type HasParams<TRoute0 extends AnyRoute> =
  ExtractPathParams<PathDefinition<TRoute0['pathOriginalDefinition']>> extends infer U
    ? [U] extends [never]
      ? false
      : true
    : false

// helpers

export type TrimQueryTailDefinition<S extends string> = S extends `${infer P}&${string}` ? P : S
export type QueryTailDefinitionWithoutFirstAmp<S extends string> = S extends `${string}&${infer T}` ? T : ''
export type QueryTailDefinitionWithFirstAmp<S extends string> = S extends `${string}&${infer T}` ? `&${T}` : ''
export type AmpSplit<S extends string> = S extends `${infer A}&${infer B}` ? A | AmpSplit<B> : S
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type NonEmpty<T> = [T] extends ['' | never] ? never : T
export type ExtractPathParams<S extends string> = S extends `${string}:${infer After}`
  ? After extends `${infer Name}/${infer Rest}`
    ? Name | ExtractPathParams<`/${Rest}`>
    : After
  : never
export type ReplacePathParams<S extends string> = S extends `${infer Head}:${infer Tail}`
  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Tail extends `${infer _Param}/${infer Rest}`
    ? ReplacePathParams<`${Head}${string}/${Rest}`>
    : `${Head}${string}`
  : S
export type DedupeSlashes<S extends string> = S extends `${infer A}//${infer B}` ? DedupeSlashes<`${A}/${B}`> : S
export type EmptyRecord = Record<never, never>
export type JoinPath<Parent extends string, Suffix extends string> = DedupeSlashes<
  PathDefinition<Parent> extends infer A extends string
    ? PathDefinition<Suffix> extends infer B extends string
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

export type OnlyIfNoParams<TParams extends object | undefined, Yes, No = never> = TParams extends undefined ? Yes : No
export type OnlyIfHasParams<TParams extends object | undefined, Yes, No = never> = TParams extends undefined ? No : Yes

export type PathDefinition<TPathOriginalDefinition extends string> = TrimQueryTailDefinition<TPathOriginalDefinition>
export type ParamsDefinition<TPathOriginalDefinition extends string> =
  ExtractPathParams<PathDefinition<TPathOriginalDefinition>> extends infer U
    ? [U] extends [never]
      ? undefined
      : { [K in Extract<U, string>]: true }
    : undefined
export type QueryDefinition<TPathOriginalDefinition extends string> =
  NonEmpty<QueryTailDefinitionWithoutFirstAmp<TPathOriginalDefinition>> extends infer Tail extends string
    ? AmpSplit<Tail> extends infer U
      ? [U] extends [never]
        ? undefined
        : { [K in Extract<U, string>]: true }
      : undefined
    : undefined
export type RoutePathOriginalDefinitionExtended<
  TSourcePathOriginalDefinition extends string,
  TSuffixPathOriginalDefinition extends string,
> = `${JoinPath<TSourcePathOriginalDefinition, TSuffixPathOriginalDefinition>}${QueryTailDefinitionWithFirstAmp<TSuffixPathOriginalDefinition>}`

export type ParamsInput<TParamsDefinition extends object | undefined> = TParamsDefinition extends undefined
  ? Record<never, never>
  : {
      [K in keyof TParamsDefinition]: string | number
    }
export type QueryInput<TQueryDefinition extends object | undefined> = TQueryDefinition extends undefined
  ? Record<string, string | number>
  : Partial<{
      [K in keyof TQueryDefinition]: string | number
    }> &
      Record<string, string | number>
export type WithParamsInput<
  TParamsDefinition extends object | undefined,
  T extends {
    query?: QueryInput<any>
    abs?: boolean
  },
> = ParamsInput<TParamsDefinition> & T

export type PathOnlyRouteValue<TPathOriginalDefinition extends string> =
  `${ReplacePathParams<PathDefinition<TPathOriginalDefinition>>}`
export type WithQueryRouteValue<TPathOriginalDefinition extends string> =
  `${ReplacePathParams<PathDefinition<TPathOriginalDefinition>>}?${string}`
export type AbsolutePathOnlyRouteValue<TPathOriginalDefinition extends string> =
  `${string}${PathOnlyRouteValue<TPathOriginalDefinition>}`
export type AbsoluteWithQueryRouteValue<TPathOriginalDefinition extends string> =
  `${string}${WithQueryRouteValue<TPathOriginalDefinition>}`
