// TODO: type utils
// TODO: fix location fn
// TODO: location suitable and non suitable
// TODO: asterisk
// TODO: optional params
// TODO: required search
// TODO: collection

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

// point0
// TODO: Сделать чисто фронтовую штуку, которая сама вызывает лоадер, сама вызывает нужные мета и title, и отдаёт в компонент нужные штуки

// ssr0
// TODO: ССР работает просто поверх любого роутера, который поддерживает асинхронную загрузку страниц

export class Route0<TPath extends string> {
  readonly pathOriginal: TPath
  readonly pathDefinition: PathDefinition<TPath>
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
    return pathDefinition as PathDefinition<TPath>
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

  static getLocation(url: `${string}://${string}`): Location
  static getLocation(path: `/${string}`): Location
  static getLocation(urlOrPath: string): Location
  static getLocation(urlOrPath: string): Location {
    // Allow both relative and absolute inputs
    const abs = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlOrPath)
    const base = abs ? undefined : 'http://example.com' // dummy base for relative URLs

    const url = new URL(urlOrPath, base)

    // Extract search and params (params left empty for now — parsed separately)
    const searchParams = Object.fromEntries(url.searchParams.entries())

    // Normalize pathname (remove trailing slash except for root)
    let pathname = url.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    // Build the location object similar to browser location
    return {
      searchParams,
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
    const locationCloned = { ...location, params: { ...location.params }, searchParams: { ...location.searchParams } }
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

export type AnyRoute = Route0<string>
export type Callable<T extends AnyRoute> = T & T['get']
export type RouteConfigInput = {
  baseUrl?: string
}

// public utils

export type PathDefinition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['pathDefinition']
  : T extends string
    ? TrimSearchTailDefinition<T>
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

export type IsUnder<T extends AnyRoute | string, TParent extends AnyRoute | string> = _IsUnder<
  PathDefinition<T>,
  PathDefinition<TParent>
>

export type HasParams<T extends AnyRoute | string> =
  ExtractPathParams<PathDefinition<T>> extends infer U ? ([U] extends [never] ? false : true) : false
export type HasSearch<T extends AnyRoute | string> =
  NonEmpty<SearchTailDefinitionWithoutFirstAmp<PathDefinition<T>>> extends infer Tail extends string
    ? AmpSplit<Tail> extends infer U
      ? [U] extends [never]
        ? false
        : true
      : false
    : false

export type ParamsOutput<T extends AnyRoute | string> = {
  [K in keyof ParamsDefinition<T>]: string
}
export type SearchOutput<T extends AnyRoute | string> = Partial<
  {
    [K in keyof SearchDefinition<T>]: string | undefined
  } & Record<string, string | undefined>
>
export type StrictSearchOutput<T extends AnyRoute | string> = Partial<{
  [K in keyof SearchDefinition<T>]: string | undefined
}>
export type ParamsInput<T extends AnyRoute | string> = _ParamsInput<PathDefinition<T>>
export type SearchInput<T extends AnyRoute | string> = _SearchInput<PathDefinition<T>>
export type StrictSearchInput<T extends AnyRoute | string> = _StrictSearchInput<PathDefinition<T>>

// TODO: flatGet, FlatGetArgs, GetArgs

// location

export type LocationParams<TPath extends string> = {
  [K in keyof _ParamsDefinition<TPath>]: string
}
export type LocationSearch<TPath extends string> = {
  [K in keyof _SearchDefinition<TPath>]: string | undefined
} & Record<string, string | undefined>

export type Location<TRoute0 extends AnyRoute = AnyRoute> = {
  searchParams: LocationSearch<TRoute0['pathOriginal']>
  params: LocationParams<TRoute0['pathOriginal']>
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

// internal utils

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

export type _IsUnder<T extends string, TParent extends string> = T extends `${TParent}${string}` ? true : false
