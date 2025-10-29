// TODO: FlatGetArgs, GetArgs
// TODO: fix location fn
// TODO: location suitable and non suitable
// TODO: collection

// TODO: asterisk
// TODO: optional params
// TODO: required search

// TODO: в локейшен хранить и сам роут route and also isRouteDetected
// TODO: normal name of route proxy so it can be printable and readable
// TODO: getLocation by windows location
// TODO: избавиться от жутких эни в роуте
// TODO: .extension('.json') to not add additional / but just add some extension
// TODO: search input can be boolean, or even object with qs
// TODO: Роут0 три пусть три тоже сам генерится вероятно
// TODO: Роут0 три мод, тогда там все ноуты кончаются на .селф
// TODO: use splats in param definition "*"
// TODO: ? check extend for search only .extend('&x&z')
// TODO: .create(route, {useSearch, useParams})
// TODO: Из пас экзакт, из пасвизквери экзает, из чилдрен, из парент, из экзактОр
// TODO: isEqual, isChildren, isParent
// TODO: extractParams, extractSearch
// TODO: getPathDefinition respecting definitionParamPrefix, definitionSearchPrefix
// TODO: prepend
// TODO: Route0.createTree({base:{self: x, children: ...})
// TODO: overrideTree
// TODO: .create(route, {baseUrl, useLocation})
// TODO: ? optional path params as @
// TODO: prependMany, extendMany, overrideMany, with types
// TODO: optional route params /x/:id?

export class Route0<TPath extends string> {
  readonly pathOriginal: TPath
  readonly pathDefinition: _PathDefinition<TPath>
  readonly paramsDefinition: _ParamsDefinition<TPath>
  readonly searchDefinition: _SearchDefinition<TPath>
  baseUrl: string

  private constructor(definition: TPath, config: RouteConfigInput = {}) {
    this.pathOriginal = definition
    this.pathDefinition = Route0._getPathDefinitionByPathOriginal(definition)
    this.paramsDefinition = Route0._getParamsDefinitionByPathOriginal(definition)
    this.searchDefinition = Route0._getSearchDefinitionByPathOriginal(definition)

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

  static create<TPath extends string>(definition: TPath, config?: RouteConfigInput): Callable<Route0<TPath>> {
    const original = new Route0<TPath>(definition, config)
    const callable = original.get.bind(original)
    Object.setPrototypeOf(callable, original)
    Object.defineProperty(callable, Symbol.toStringTag, {
      value: original.pathOriginal,
    })
    return callable as never
  }

  private static _splitPathDefinitionAndSearchTailDefinition(pathOriginal: string) {
    const i = pathOriginal.indexOf('&')
    if (i === -1) return { pathDefinition: pathOriginal, searchTailDefinition: '' }
    return {
      pathDefinition: pathOriginal.slice(0, i),
      searchTailDefinition: pathOriginal.slice(i),
    }
  }

  private static _getAbsPath(baseUrl: string, pathWithSearch: string) {
    return new URL(pathWithSearch, baseUrl).toString().replace(/\/$/, '')
  }

  private static _getPathDefinitionByPathOriginal<TPath extends string>(pathOriginal: TPath) {
    const { pathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(pathOriginal)
    return pathDefinition as _PathDefinition<TPath>
  }

  private static _getParamsDefinitionByPathOriginal<TPath extends string>(pathOriginal: TPath) {
    const { pathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(pathOriginal)
    const matches = Array.from(pathDefinition.matchAll(/:([A-Za-z0-9_]+)/g))
    const paramsDefinition = Object.fromEntries(matches.map((m) => [m[1], true]))
    return paramsDefinition as _ParamsDefinition<TPath>
  }

  private static _getSearchDefinitionByPathOriginal<TPath extends string>(pathOriginal: TPath) {
    const { searchTailDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(pathOriginal)
    if (!searchTailDefinition) {
      return {} as _SearchDefinition<TPath>
    }
    const keys = searchTailDefinition.split('&').map(Boolean)
    const searchDefinition = Object.fromEntries(keys.map((k) => [k, true]))
    return searchDefinition as _SearchDefinition<TPath>
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
  ): Callable<Route0<PathExtended<TPath, TSuffixDefinition>>> {
    const { pathDefinition: parentPathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(
      this.pathOriginal,
    )
    const { pathDefinition: suffixPathDefinition, searchTailDefinition: suffixSearchTailDefinition } =
      Route0._splitPathDefinitionAndSearchTailDefinition(suffixDefinition)
    const pathDefinition = `${parentPathDefinition}/${suffixPathDefinition}`.replace(/\/{2,}/g, '/')
    const pathOriginal = `${pathDefinition}${suffixSearchTailDefinition}` as PathExtended<TPath, TSuffixDefinition>
    return Route0.create<PathExtended<TPath, TSuffixDefinition>>(pathOriginal, { baseUrl: this.baseUrl })
  }

  // has params
  get(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath, { search?: undefined; abs?: false }>>,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, PathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<
      _ParamsDefinition<TPath>,
      WithParamsInput<TPath, { search: _SearchInput<TPath>; abs?: false }>
    >,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, WithSearchRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath, { search?: undefined; abs: true }>>,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, AbsolutePathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfHasParams<
      _ParamsDefinition<TPath>,
      WithParamsInput<TPath, { search: _SearchInput<TPath>; abs: true }>
    >,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, AbsoluteWithSearchRouteValue<TPath>>

  // no params
  get(...args: OnlyIfNoParams<_ParamsDefinition<TPath>, [], [never]>): PathOnlyRouteValue<TPath>
  get(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, { search?: undefined; abs?: false }>,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, PathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, { search: _SearchInput<TPath>; abs?: false }>,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, WithSearchRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, { search?: undefined; abs: true }>,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, AbsolutePathOnlyRouteValue<TPath>>
  get(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, { search: _SearchInput<TPath>; abs: true }>,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, AbsoluteWithSearchRouteValue<TPath>>

  // implementation
  get(...args: any[]): string {
    const { searchInput, paramsInput, absInput } = ((): {
      searchInput: Record<string, string | number>
      paramsInput: Record<string, string | number>
      absInput: boolean
    } => {
      if (args.length === 0) {
        return { searchInput: {}, paramsInput: {}, absInput: false }
      }
      const input = args[0]
      if (typeof input !== 'object' || input === null) {
        // throw new Error("Invalid get route input: expected object")
        return { searchInput: {}, paramsInput: {}, absInput: false }
      }
      const { search, abs, ...params } = input
      return { searchInput: search || {}, paramsInput: params, absInput: abs ?? false }
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
    // search params
    const searchInputStringified = Object.fromEntries(Object.entries(searchInput).map(([k, v]) => [k, String(v)]))
    url = [url, new URLSearchParams(searchInputStringified).toString()].filter(Boolean).join('?')
    // dedupe slashes
    url = url.replace(/\/{2,}/g, '/')
    // absolute
    url = absInput ? Route0._getAbsPath(this.baseUrl, url) : url

    return url
  }

  // has params
  flat(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath>>,
    abs?: false,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, PathOnlyRouteValue<TPath>>
  flat(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath, _SearchInput<TPath>>>,
    abs?: false,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, WithSearchRouteValue<TPath>>
  flat(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath>>,
    abs: true,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, AbsolutePathOnlyRouteValue<TPath>>
  flat(
    input: OnlyIfHasParams<_ParamsDefinition<TPath>, WithParamsInput<TPath, _SearchInput<TPath>>>,
    abs: true,
  ): OnlyIfHasParams<_ParamsDefinition<TPath>, AbsoluteWithSearchRouteValue<TPath>>

  // no params
  flat(...args: OnlyIfNoParams<_ParamsDefinition<TPath>, [], [never]>): PathOnlyRouteValue<TPath>
  flat(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, Record<never, never>>,
    abs?: false,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, PathOnlyRouteValue<TPath>>
  flat(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, _SearchInput<TPath>>,
    abs?: false,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, WithSearchRouteValue<TPath>>
  flat(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, Record<never, never>>,
    abs: true,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, AbsolutePathOnlyRouteValue<TPath>>
  flat(
    input: OnlyIfNoParams<_ParamsDefinition<TPath>, _SearchInput<TPath>>,
    abs: true,
  ): OnlyIfNoParams<_ParamsDefinition<TPath>, AbsoluteWithSearchRouteValue<TPath>>

  // implementation
  flat(...args: any[]): string {
    const { searchInput, paramsInput, absInput } = ((): {
      searchInput: Record<string, string | number>
      paramsInput: Record<string, string | number>
      absInput: boolean
    } => {
      if (args.length === 0) {
        return { searchInput: {}, paramsInput: {}, absInput: false }
      }
      const input = args[0]
      if (typeof input !== 'object' || input === null) {
        // throw new Error("Invalid get route input: expected object")
        return { searchInput: {}, paramsInput: {}, absInput: args[1] ?? false }
      }
      const paramsKeys = this.paramsDefinition ? Object.keys(this.paramsDefinition) : []
      const paramsInput = paramsKeys.reduce<Record<string, string | number>>((acc, key) => {
        if (input[key] !== undefined) {
          acc[key] = input[key]
        }
        return acc
      }, {})
      const searchInput = Object.keys(input)
        .filter((k) => !paramsKeys.includes(k))
        .reduce<Record<string, string | number>>((acc, key) => {
          acc[key] = input[key]
          return acc
        }, {})
      return { searchInput, paramsInput, absInput: args[1] ?? false }
    })()

    return this.get({ ...paramsInput, search: searchInput, abs: absInput } as never)
  }

  getDefinition(): string {
    return this.pathDefinition
  }

  clone(config?: RouteConfigInput): Route0<TPath> {
    return new Route0(this.pathOriginal, config)
  }

  static getLocation(href: `${string}://${string}`): LocationUnknown
  static getLocation(hrefRel: `/${string}`): LocationUnknown
  static getLocation(hrefOrHrefRel: string): LocationUnknown
  static getLocation(location: LocationAny): LocationUnknown
  static getLocation(hrefOrHrefRelOrLocation: string | LocationAny): LocationUnknown
  static getLocation(hrefOrHrefRelOrLocation: string | LocationAny): LocationUnknown {
    if (typeof hrefOrHrefRelOrLocation !== 'string') {
      hrefOrHrefRelOrLocation = hrefOrHrefRelOrLocation.href || hrefOrHrefRelOrLocation.hrefRel
    }
    // Check if it's an absolute URL (starts with scheme://)
    const abs = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(hrefOrHrefRelOrLocation)

    // Use dummy base only if relative
    const base = abs ? undefined : 'http://example.com'
    const url = new URL(hrefOrHrefRelOrLocation, base)

    // Extract search params
    const searchParams = Object.fromEntries(url.searchParams.entries())

    // Normalize pathname (remove trailing slash except for root)
    let pathname = url.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    // Common derived values
    const hrefRel = pathname + url.search + url.hash

    // Build the location object consistent with _LocationGeneral
    const location: LocationUnknown = {
      pathname,
      search: url.search,
      hash: url.hash,
      origin: abs ? url.origin : undefined,
      href: abs ? url.href : undefined,
      hrefRel,
      abs,

      // extra host-related fields (available even for relative with dummy base)
      host: abs ? url.host : undefined,
      hostname: abs ? url.hostname : undefined,
      port: abs ? url.port || undefined : undefined,

      // specific to LocationUnknown
      searchParams,
      params: undefined,
      route: undefined,
      exact: false,
      parent: false,
      children: false,
    }

    return location
  }

  getLocation(href: `${string}://${string}`): LocationKnown<TPath>
  getLocation(hrefRel: `/${string}`): LocationKnown<TPath>
  getLocation(hrefOrHrefRel: string): LocationKnown<TPath>
  getLocation(location: LocationAny): LocationKnown<TPath>
  getLocation(hrefOrHrefRelOrLocation: string | LocationAny): LocationKnown<TPath>
  getLocation(hrefOrHrefRelOrLocation: string | LocationAny): LocationKnown<TPath> {
    const location = Route0.getLocation(hrefOrHrefRelOrLocation) as never as LocationKnown<TPath>
    location.route = this.pathOriginal as PathOriginal<TPath>
    location.params = {}

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
      location.params = params
    } else {
      location.params = {}
    }

    const exact = !!exactMatch
    const parent = !exact && parentRe.test(pathname)

    // "children": the URL is a prefix of the route definition (ignoring params’ concrete values)
    // We check if the definition starts with the URL path boundary-wise.
    const children = !exact && new RegExp(`^${escapeRegex(pathname)}(?:/|$)`).test(def)

    return {
      ...location,
      exact,
      parent,
      children,
    } as LocationKnown<TPath>
  }
}

// main

export type AnyRoute<T extends string | Route0<string> = string> = T extends string ? Route0<T> : T
export type Callable<T extends AnyRoute> = T & T['get']
export type RouteConfigInput = {
  baseUrl?: string
}

// public utils

export type PathOriginal<T extends AnyRoute | string> = T extends AnyRoute
  ? T['pathOriginal']
  : T extends string
    ? T
    : never
export type PathDefinition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['pathDefinition']
  : T extends string
    ? _PathDefinition<T>
    : never
export type ParamsDefinition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['paramsDefinition']
  : T extends string
    ? _ParamsDefinition<T>
    : undefined
export type SearchDefinition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['searchDefinition']
  : T extends string
    ? _SearchDefinition<T>
    : undefined

export type Extended<T extends AnyRoute | string | undefined, TSuffixDefinition extends string> = T extends AnyRoute
  ? Route0<PathExtended<T['pathOriginal'], TSuffixDefinition>>
  : T extends string
    ? Route0<PathExtended<T, TSuffixDefinition>>
    : T extends undefined
      ? Route0<TSuffixDefinition>
      : never

export type IsParent<T extends AnyRoute | string, TParent extends AnyRoute | string> = _IsParent<
  PathDefinition<T>,
  PathDefinition<TParent>
>
export type IsChildren<T extends AnyRoute | string, TChildren extends AnyRoute | string> = _IsChildren<
  PathDefinition<T>,
  PathDefinition<TChildren>
>
export type IsSame<T extends AnyRoute | string, TExact extends AnyRoute | string> = _IsSame<
  PathDefinition<T>,
  PathDefinition<TExact>
>
export type IsSameParams<T1 extends AnyRoute | string, T2 extends AnyRoute | string> = _IsSameParams<
  ParamsDefinition<T1>,
  ParamsDefinition<T2>
>

export type HasParams<T extends AnyRoute | string> =
  ExtractPathParams<PathDefinition<T>> extends infer U ? ([U] extends [never] ? false : true) : false
export type HasSearch<T extends AnyRoute | string> =
  NonEmpty<SearchTailDefinitionWithoutFirstAmp<PathOriginal<T>>> extends infer Tail extends string
    ? AmpSplit<Tail> extends infer U
      ? [U] extends [never]
        ? false
        : true
      : false
    : false

export type ParamsOutput<T extends AnyRoute | string> = {
  [K in keyof ParamsDefinition<T>]: string
}
export type SearchOutput<T extends AnyRoute | string = string> = Partial<
  {
    [K in keyof SearchDefinition<T>]?: string
  } & Record<string, string | undefined>
>
export type StrictSearchOutput<T extends AnyRoute | string> = Partial<{
  [K in keyof SearchDefinition<T>]?: string | undefined
}>
export type ParamsInput<T extends AnyRoute | string> = _ParamsInput<PathDefinition<T>>
export type SearchInput<T extends AnyRoute | string> = _SearchInput<PathOriginal<T>>
export type StrictSearchInput<T extends AnyRoute | string> = _StrictSearchInput<PathOriginal<T>>

// location

export type LocationParams<TPath extends string> = {
  [K in keyof _ParamsDefinition<TPath>]: string
}
export type LocationSearch<TPath extends string = string> = {
  [K in keyof _SearchDefinition<TPath>]: string | undefined
} & Record<string, string | undefined>

export type _LocationGeneral = {
  pathname: string
  search: string
  hash: string
  origin?: string
  href?: string
  hrefRel: string
  abs: boolean
  port?: string
  host?: string
  hostname?: string
}
export type LocationUnknown = _LocationGeneral & {
  params: undefined
  searchParams: SearchOutput
  route: undefined
  exact: false
  parent: false
  children: false
}
export type LocationUnmatched<TRoute0 extends AnyRoute | string = AnyRoute | string> = _LocationGeneral & {
  params: Record<never, never>
  searchParams: SearchOutput<TRoute0>
  route: PathOriginal<TRoute0>
  exact: false
  parent: false
  children: false
}
export type LocationExact<TRoute0 extends AnyRoute | string = AnyRoute | string> = _LocationGeneral & {
  params: ParamsOutput<TRoute0>
  searchParams: SearchOutput<TRoute0>
  route: PathOriginal<TRoute0>
  exact: true
  parent: false
  children: false
}
export type LocationParent<TRoute0 extends AnyRoute | string = AnyRoute | string> = _LocationGeneral & {
  params: Partial<ParamsOutput<TRoute0>> // in fact maybe there will be whole params object, but does not matter now
  searchParams: SearchOutput<TRoute0>
  route: PathOriginal<TRoute0>
  exact: false
  parent: true
  children: false
}
export type LocationChildren<TRoute0 extends AnyRoute | string = AnyRoute | string> = _LocationGeneral & {
  params: ParamsOutput<TRoute0>
  searchParams: SearchOutput<TRoute0>
  route: PathOriginal<TRoute0>
  exact: false
  parent: false
  children: true
}
export type LocationKnown<TRoute0 extends AnyRoute | string = AnyRoute | string> =
  | LocationUnmatched<TRoute0>
  | LocationExact<TRoute0>
  | LocationParent<TRoute0>
  | LocationChildren<TRoute0>
export type LocationAny<TRoute0 extends AnyRoute = AnyRoute> = LocationUnknown | LocationKnown<TRoute0>

// internal utils

export type _PathDefinition<T extends string> = T extends string ? TrimSearchTailDefinition<T> : never
export type _ParamsDefinition<TPath extends string> =
  ExtractPathParams<PathDefinition<TPath>> extends infer U
    ? [U] extends [never]
      ? undefined
      : { [K in Extract<U, string>]: true }
    : undefined
export type _SearchDefinition<TPath extends string> =
  NonEmpty<SearchTailDefinitionWithoutFirstAmp<TPath>> extends infer Tail extends string
    ? AmpSplit<Tail> extends infer U
      ? [U] extends [never]
        ? undefined
        : { [K in Extract<U, string>]: true }
      : undefined
    : undefined

export type _ParamsInput<TPath extends string> =
  _ParamsDefinition<TPath> extends undefined
    ? Record<never, never>
    : {
        [K in keyof _ParamsDefinition<TPath>]: string | number
      }
export type _SearchInput<TPath extends string> =
  _SearchDefinition<TPath> extends undefined
    ? Record<string, string | number>
    : Partial<{
        [K in keyof _SearchDefinition<TPath>]: string | number
      }> &
        Record<string, string | number>
export type _StrictSearchInput<TPath extends string> = Partial<{
  [K in keyof _SearchDefinition<TPath>]: string | number
}>

export type TrimSearchTailDefinition<S extends string> = S extends `${infer P}&${string}` ? P : S
export type SearchTailDefinitionWithoutFirstAmp<S extends string> = S extends `${string}&${infer T}` ? T : ''
export type SearchTailDefinitionWithFirstAmp<S extends string> = S extends `${string}&${infer T}` ? `&${T}` : ''
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

export type PathOnlyRouteValue<TPath extends string> = `${ReplacePathParams<PathDefinition<TPath>>}`
export type WithSearchRouteValue<TPath extends string> = `${ReplacePathParams<PathDefinition<TPath>>}?${string}`
export type AbsolutePathOnlyRouteValue<TPath extends string> = `${string}${PathOnlyRouteValue<TPath>}`
export type AbsoluteWithSearchRouteValue<TPath extends string> = `${string}${WithSearchRouteValue<TPath>}`

export type PathExtended<
  TSourcePathOriginalDefinition extends string,
  TSuffixPathOriginalDefinition extends string,
> = `${JoinPath<TSourcePathOriginalDefinition, TSuffixPathOriginalDefinition>}${SearchTailDefinitionWithFirstAmp<TSuffixPathOriginalDefinition>}`

export type WithParamsInput<
  TPath extends string,
  T extends
    | {
        search?: _SearchInput<any>
        abs?: boolean
      }
    | undefined = undefined,
> = _ParamsInput<TPath> & (T extends undefined ? Record<never, never> : T)

export type _IsSameParams<T1 extends object | undefined, T2 extends object | undefined> = T1 extends undefined
  ? T2 extends undefined
    ? true
    : false
  : T2 extends undefined
    ? false
    : T1 extends T2
      ? T2 extends T1
        ? true
        : false
      : false

export type _IsParent<T extends string, TParent extends string> = T extends TParent
  ? false
  : T extends `${TParent}${string}`
    ? true
    : false
export type _IsChildren<T extends string, TChildren extends string> = TChildren extends T
  ? false
  : TChildren extends `${T}${string}`
    ? true
    : false
export type _IsSame<T extends string, TExact extends string> = T extends TExact
  ? TExact extends T
    ? true
    : false
  : false
