import type { StandardSchemaV1 } from '@standard-schema/spec'

// TODO: asterisk
// TODO: when asterisk then query params will be extended also after extend
// TODO: optional params
// TODO: required search

// TODO: .extension('.json') to not add additional / but just add some extension
// TODO: search input can be boolean, or even object with qs
// TODO: route0 if ens with "...&" then can be any query, else only provided type of queries
// TODO: Роут0 три мод, тогда там все ноуты кончаются на .селф
// TODO: use splats in param definition "*"
// TODO: ? check extend for search only .extend('&x&z')
// TODO: .create(route, {useSearch, useParams})
// TODO: Из пас экзакт, из пасвизквери экзает, из чилдрен, из парент, из экзактОр
// TODO: isEqual, isDescendant, isAncestor
// TODO: extractParams, extractSearch
// TODO: getPathDefinition respecting definitionParamPrefix, definitionSearchPrefix
// TODO: prepend
// TODO: ?? Route0.createTree({base:{self: x, children: ...})
// TODO: ? Routes.create({base:{self: x, children: ...}).attach('section', Routes.create({...}))
// TODO: overrideTree
// TODO: .create(route, {origin, useLocation})
// TODO: ? optional path params as @
// TODO: prependMany, extendMany, overrideMany, with types
// TODO: optional route params /x/:id?
// TODO: fix CallableRoute<CallableRoute<>> in RoutesPretty type, it should be just CallableRoute<>

/**
 * Strongly typed route descriptor and URL builder.
 *
 * A route definition uses:
 * - path params: `/users/:id`
 * - named search keys: `/users&tab&sort`
 * - loose search mode: trailing `&`, e.g. `/users&`
 *
 * Instances are callable (same as `.get()`), so `route(input)` and
 * `route.get(input)` are equivalent.
 */
export class Route0<TDefinition extends string> {
  readonly definition: TDefinition
  readonly pathDefinition: _PathDefinition<TDefinition>
  readonly paramsDefinition: _ParamsDefinition<TDefinition>
  readonly searchDefinition: _SearchDefinition<TDefinition>
  readonly hasLooseSearch: HasLooseSearch<TDefinition>
  private _origin: string | undefined

  /** Base URL used when generating absolute URLs (`abs: true`). */
  get origin(): string {
    if (!this._origin) {
      throw new Error(
        'origin for route ' +
          this.definition +
          ' is not set, please provide it like Route0.create(route, {origin: "https://example.com"}) in config or set via clones like routes._.clone({origin: "https://example.com"})',
      )
    }
    return this._origin
  }
  set origin(origin: string) {
    this._origin = origin
  }

  private constructor(definition: TDefinition, config: RouteConfigInput = {}) {
    this.definition = definition
    this.pathDefinition = Route0._getPathDefinitionBydefinition(definition)
    this.paramsDefinition = Route0._getParamsDefinitionBydefinition(definition)
    this.searchDefinition = Route0._getSearchDefinitionBydefinition(definition)
    this.hasLooseSearch = Route0._hasLooseSearch(definition)

    const { origin } = config
    if (origin && typeof origin === 'string' && origin.length) {
      this._origin = origin
    } else {
      const g = globalThis as unknown as { location?: { origin?: string } } | undefined
      if (typeof g?.location?.origin === 'string' && g.location.origin.length > 0) {
        this._origin = g.location.origin
      } else {
        this._origin = undefined
      }
    }
  }

  /**
   * Creates a callable route instance.
   *
   * If an existing route/callable route is provided, it is cloned.
   */
  static create<TDefinition extends string>(
    definition: TDefinition | AnyRoute<TDefinition> | CallableRoute<TDefinition>,
    config?: RouteConfigInput,
  ): CallableRoute<TDefinition> {
    if (typeof definition === 'function') {
      return definition.clone(config) as CallableRoute<TDefinition>
    }
    if (typeof definition === 'object') {
      return definition.clone(config) as CallableRoute<TDefinition>
    }
    const original = new Route0<TDefinition>(definition, config)
    const callable = original.get.bind(original)
    Object.setPrototypeOf(callable, original)
    Object.defineProperty(callable, Symbol.toStringTag, {
      value: original.definition,
    })
    return callable as never
  }

  /**
   * Normalizes a definition/route into a callable route.
   *
   * Unlike `create`, passing a callable route returns the same instance.
   */
  static from<TDefinition extends string>(
    definition: TDefinition | AnyRoute<TDefinition> | CallableRoute<TDefinition>,
  ): CallableRoute<TDefinition> {
    if (typeof definition === 'function') {
      return definition
    }
    const original = typeof definition === 'object' ? definition : new Route0<TDefinition>(definition)
    const callable = original.get.bind(original)
    Object.setPrototypeOf(callable, original)
    Object.defineProperty(callable, Symbol.toStringTag, {
      value: original.definition,
    })
    return callable as never
  }

  private static _splitPathDefinitionAndSearchTailDefinition(definition: string) {
    const i = definition.indexOf('&')
    if (i === -1) return { pathDefinition: definition, searchTailDefinition: '' }
    return {
      pathDefinition: definition.slice(0, i),
      searchTailDefinition: definition.slice(i),
    }
  }

  private static _getAbsPath(origin: string, pathWithSearch: string) {
    return new URL(pathWithSearch, origin).toString().replace(/\/$/, '')
  }

  private static _getPathDefinitionBydefinition<TDefinition extends string>(definition: TDefinition) {
    const { pathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(definition)
    return pathDefinition as _PathDefinition<TDefinition>
  }

  private static _getParamsDefinitionBydefinition<TDefinition extends string>(
    definition: TDefinition,
  ): _ParamsDefinition<TDefinition> {
    const { pathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(definition)
    const matches = Array.from(pathDefinition.matchAll(/:([A-Za-z0-9_]+)/g))
    const paramsDefinition = Object.fromEntries(matches.map((m) => [m[1], true]))
    const keysCount = Object.keys(paramsDefinition).length
    if (keysCount === 0) {
      return undefined as _ParamsDefinition<TDefinition>
    }
    return paramsDefinition as _ParamsDefinition<TDefinition>
  }

  private static _getSearchDefinitionBydefinition<TDefinition extends string>(
    definition: TDefinition,
  ): _SearchDefinition<TDefinition> {
    const { searchTailDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(definition)
    if (!searchTailDefinition) {
      return undefined as _SearchDefinition<TDefinition>
    }
    const keys = searchTailDefinition.split('&').filter(Boolean)
    const searchDefinition = Object.fromEntries(keys.map((k) => [k, true]))
    const keysCount = Object.keys(searchDefinition).length
    if (keysCount === 0) {
      return undefined as _SearchDefinition<TDefinition>
    }
    return searchDefinition as _SearchDefinition<TDefinition>
  }

  private static _hasLooseSearch<TDefinition extends string>(definition: TDefinition): HasLooseSearch<TDefinition> {
    // ends with &
    return definition.endsWith('&') as HasLooseSearch<TDefinition>
  }

  /** Extends the current route definition by appending a suffix route. */
  extend<TSuffixDefinition extends string>(
    suffixDefinition: TSuffixDefinition,
  ): CallableRoute<PathExtended<TDefinition, TSuffixDefinition>> {
    const { pathDefinition: parentPathDefinition } = Route0._splitPathDefinitionAndSearchTailDefinition(this.definition)
    const { pathDefinition: suffixPathDefinition, searchTailDefinition: suffixSearchTailDefinition } =
      Route0._splitPathDefinitionAndSearchTailDefinition(suffixDefinition)
    const pathDefinition = `${parentPathDefinition}/${suffixPathDefinition}`.replace(/\/{2,}/g, '/')
    const definition = `${pathDefinition}${suffixSearchTailDefinition}` as PathExtended<TDefinition, TSuffixDefinition>
    return Route0.create<PathExtended<TDefinition, TSuffixDefinition>>(definition, { origin: this._origin })
  }

  // has params
  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search?: undefined; abs?: false; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, PathOnlyRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search: _SearchInput<TDefinition>; abs?: false; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, WithSearchRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search?: undefined; abs: true; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsolutePathOnlyRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search: _SearchInput<TDefinition>; abs: true; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsoluteWithSearchRouteValue<TDefinition>>

  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search?: _SearchInput<TDefinition>; abs?: false; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, PathRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, { search: _SearchInput<TDefinition>; abs: true; hash?: string | number }>
  //   >,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsolutePathRouteValue<TDefinition>>

  /**
   * Builds a URL string from typed params/search input.
   *
   * - `abs: true` returns absolute URL using `origin`
   * - `hash` appends URL fragment
   * - `search` accepts named/loose search input based on definition
   */
  get(
    input: OnlyIfHasParams<
      TDefinition,
      WithParamsInput<
        TDefinition,
        {
          search?: _LooseSearchInput<TDefinition>
          abs?: boolean | string
          hash?: string | number
        }
      >
    >,
  ): OnlyIfHasParams<TDefinition, string>

  // no params
  // get(...args: OnlyIfNoParams<_ParamsDefinition<TDefinition>, [], [never]>): PathOnlyRouteValue<TDefinition>
  // get(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, { search?: undefined; abs?: false; hash?: string | number }>,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, PathOnlyRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfNoParams<
  //     _ParamsDefinition<TDefinition>,
  //     { search: _SearchInput<TDefinition>; abs?: false; hash?: string | number }
  //   >,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, WithSearchRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, { search?: undefined; abs: true; hash?: string | number }>,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsolutePathOnlyRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfNoParams<
  //     _ParamsDefinition<TDefinition>,
  //     { search: _SearchInput<TDefinition>; abs: true; hash?: string | number }
  //   >,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsoluteWithSearchRouteValue<TDefinition>>

  // get(...args: OnlyIfNoParams<_ParamsDefinition<TDefinition>, [], [never]>): PathRouteValue<TDefinition>
  // get(
  //   input: OnlyIfNoParams<
  //     _ParamsDefinition<TDefinition>,
  //     { search?: _SearchInput<TDefinition>; abs?: false; hash?: string | number }
  //   >,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, PathRouteValue<TDefinition>>
  // get(
  //   input: OnlyIfNoParams<
  //     _ParamsDefinition<TDefinition>,
  //     { search?: _SearchInput<TDefinition>; abs: true; hash?: string | number }
  //   >,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsolutePathRouteValue<TDefinition>>

  get(...args: OnlyIfNoParams<TDefinition, [], [never]>): string
  get(
    input: OnlyIfNoParams<
      TDefinition,
      {
        search?: _LooseSearchInput<TDefinition>
        abs?: boolean | string
        hash?: string | number
      }
    >,
  ): OnlyIfNoParams<TDefinition, string>

  // implementation
  get(...args: unknown[]): string {
    const { searchInput, paramsInput, absInput, absOriginInput, hashInput } = ((): {
      searchInput: Record<string, string | number>
      paramsInput: Record<string, string | number>
      absInput: boolean
      absOriginInput: string | undefined
      hashInput: string | undefined
    } => {
      if (args.length === 0) {
        return {
          searchInput: {},
          paramsInput: {},
          absInput: false,
          absOriginInput: undefined,
          hashInput: undefined,
        }
      }
      const input = args[0]
      if (typeof input !== 'object' || input === null) {
        // throw new Error("Invalid get route input: expected object")
        return {
          searchInput: {},
          paramsInput: {},
          absInput: false,
          absOriginInput: undefined,
          hashInput: undefined,
        }
      }
      const { search, abs, hash, ...params } = input as Record<string, string | number> & {
        search: Record<string, string | number>
        abs: boolean | string
        hash: string | undefined
        [key: string]: unknown
      }
      const absOriginInput = typeof abs === 'string' && abs.length > 0 ? abs : undefined
      return {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        searchInput: search || {},
        paramsInput: params,
        absInput: absOriginInput !== undefined || abs === true,
        absOriginInput,
        hashInput: hash,
      }
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
    url = absInput ? Route0._getAbsPath(absOriginInput || this.origin, url) : url
    // hash
    if (hashInput !== undefined) {
      url = `${url}#${hashInput}`
    }

    return url
  }

  // has params
  // flat(
  //   input: OnlyIfHasParams<_ParamsDefinition<TDefinition>, WithParamsInput<TDefinition, { hash?: string | number }>>,
  //   abs?: false,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, PathOnlyRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, _SearchInput<TDefinition> & { hash?: string | number }>
  //   >,
  //   abs?: false,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, WithSearchRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfHasParams<_ParamsDefinition<TDefinition>, WithParamsInput<TDefinition, { hash?: string | number }>>,
  //   abs: true,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsolutePathOnlyRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, _SearchInput<TDefinition> & { hash?: string | number }>
  //   >,
  //   abs: true,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsoluteWithSearchRouteValue<TDefinition>>

  // flat(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, _SearchInput<TDefinition> & { hash?: string | number }>
  //   >,
  //   abs?: false,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, PathRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfHasParams<
  //     _ParamsDefinition<TDefinition>,
  //     WithParamsInput<TDefinition, _SearchInput<TDefinition> & { hash?: string | number }>
  //   >,
  //   abs: true,
  // ): OnlyIfHasParams<_ParamsDefinition<TDefinition>, AbsolutePathRouteValue<TDefinition>>

  /**
   * Flat input variant of `get()`, where path params + search keys
   * are provided in a single object.
   */
  flat<TLoose extends boolean = HasLooseSearch<TDefinition>>(
    input: OnlyIfHasParams<
      TDefinition,
      WithParamsInput<TDefinition, FlatInput<TDefinition, TLoose> & { hash?: string | number }>
    >,
    abs?: boolean | string,
    loose?: TLoose,
  ): OnlyIfHasParams<TDefinition, string>

  // no params
  // flat(...args: OnlyIfNoParams<_ParamsDefinition<TDefinition>, [], [never]>): PathOnlyRouteValue<TDefinition>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, { hash?: string | number }>,
  //   abs?: false,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, PathOnlyRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, _SearchInput<TDefinition> & { hash?: string | number }>,
  //   abs?: false,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, WithSearchRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, { hash?: string | number }>,
  //   abs: true,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsolutePathOnlyRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, _SearchInput<TDefinition> & { hash?: string | number }>,
  //   abs: true,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsoluteWithSearchRouteValue<TDefinition>>

  // flat(...args: OnlyIfNoParams<_ParamsDefinition<TDefinition>, [], [never]>): PathRouteValue<TDefinition>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, _SearchInput<TDefinition> & { hash?: string | number }>,
  //   abs?: false,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, PathRouteValue<TDefinition>>
  // flat(
  //   input: OnlyIfNoParams<_ParamsDefinition<TDefinition>, _SearchInput<TDefinition> & { hash?: string | number }>,
  //   abs: true,
  // ): OnlyIfNoParams<_ParamsDefinition<TDefinition>, AbsolutePathRouteValue<TDefinition>>

  flat(...args: OnlyIfNoParams<TDefinition, [], [never]>): string
  flat<TLoose extends boolean = HasLooseSearch<TDefinition>>(
    input: OnlyIfNoParams<TDefinition, FlatInput<TDefinition, TLoose> & { hash?: string | number }>,
    abs?: boolean | string,
    loose?: TLoose,
  ): OnlyIfNoParams<TDefinition, string>

  // implementation
  flat(...args: unknown[]): string {
    const { searchInput, paramsInput, absInput, hashInput } = ((): {
      searchInput: Record<string, string | number>
      paramsInput: Record<string, string | number>
      absInput: boolean | string
      hashInput: string | undefined
    } => {
      if (args.length === 0) {
        return {
          searchInput: {},
          paramsInput: {},
          absInput: false,
          hashInput: undefined,
        }
      }
      const input = args[0] as Record<string, string | number> | undefined
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeof input !== 'object' || input === null) {
        // throw new Error("Invalid get route input: expected object")
        return {
          searchInput: {},
          paramsInput: {},
          absInput: (args[1] as boolean | string | undefined) ?? false,
          hashInput: undefined,
        }
      }
      const loose = (args[2] as boolean | undefined) ?? this.hasLooseSearch
      const paramsKeys = this.getParamsKeys()
      const paramsInput = paramsKeys.reduce<Record<string, string | number>>((acc, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (input[key] !== undefined) {
          acc[key] = input[key]
        }
        return acc
      }, {})
      const searchKeys = this.getSearchKeys()
      const searchInput = Object.keys(input)
        .filter((k) => {
          if (k === 'hash') {
            return false
          }
          if (searchKeys.includes(k)) {
            return true
          }
          if (paramsKeys.includes(k)) {
            return false
          }
          return loose
        })
        .reduce<Record<string, string | number>>((acc, key) => {
          acc[key] = input[key]
          return acc
        }, {})
      const hashInput = input.hash
      return {
        searchInput,
        paramsInput,
        absInput: (args[1] as boolean | string | undefined) ?? false,
        hashInput: hashInput as string | undefined,
      }
    })()

    return this.get({
      ...paramsInput,
      search: searchInput,
      abs: absInput,
      hash: hashInput,
    } as never)
  }

  /** Same as `flat()`, but always accepts loose search keys. */
  flatLoose(
    input: OnlyIfHasParams<
      TDefinition,
      WithParamsInput<TDefinition, LooseFlatInput<TDefinition> & { hash?: string | number }>
    >,
    abs?: boolean | string,
  ): OnlyIfHasParams<TDefinition, string>
  flatLoose(...args: OnlyIfNoParams<TDefinition, [], [never]>): string
  flatLoose(
    input: OnlyIfNoParams<TDefinition, LooseFlatInput<TDefinition> & { hash?: string | number }>,
    abs?: boolean | string,
  ): OnlyIfNoParams<TDefinition, string>
  flatLoose(...args: unknown[]): string {
    return this.flat(args[0] as never, args[1] as never, true)
  }

  /** Same as `flat()`, but only allows declared search keys. */
  flatStrict(
    input: OnlyIfHasParams<
      TDefinition,
      WithParamsInput<TDefinition, StrictFlatInput<TDefinition> & { hash?: string | number }>
    >,
    abs?: boolean | string,
  ): OnlyIfHasParams<TDefinition, string>
  flatStrict(...args: OnlyIfNoParams<TDefinition, [], [never]>): string
  flatStrict(
    input: OnlyIfNoParams<TDefinition, StrictFlatInput<TDefinition> & { hash?: string | number }>,
    abs?: boolean | string,
  ): OnlyIfNoParams<TDefinition, string>
  flatStrict(...args: unknown[]): string {
    return this.flat(args[0] as never, args[1] as never, false)
  }

  /** Returns path param keys extracted from route definition. */
  getParamsKeys(): string[] {
    return Object.keys(this.paramsDefinition || {})
  }
  /** Returns named search keys extracted from route definition. */
  getSearchKeys(): string[] {
    return Object.keys(this.searchDefinition || {})
  }
  /** Returns all flat input keys (`search + params`). */
  getFlatKeys(): string[] {
    return [...this.getSearchKeys(), ...this.getParamsKeys()]
  }

  getDefinition(): string {
    return this.pathDefinition
  }

  /** Clones route with optional config override. */
  clone(config?: RouteConfigInput): CallableRoute<TDefinition> {
    return Route0.create(this.definition, config)
  }

  getRegexBaseStrictString(): string {
    return this.pathDefinition
      .replace(/:(\w+)/g, '___PARAM___') // temporarily replace params with placeholder
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars
      .replace(/___PARAM___/g, '([^/]+)')
  }

  getRegexBaseString(): string {
    return this.getRegexBaseStrictString().replace(/\/+$/, '') + '/?' // remove trailing slashes and add optional slash
  }

  getRegexStrictString(): string {
    return `^${this.getRegexBaseStrictString()}$`
  }

  getRegexString(): string {
    return `^${this.getRegexBaseString()}$`
  }

  getRegexStrict(): RegExp {
    return new RegExp(this.getRegexStrictString())
  }

  getRegex(): RegExp {
    return new RegExp(this.getRegexString())
  }

  /** Creates a grouped strict regex pattern string from many routes. */
  static getRegexStrictStringGroup(routes: AnyRoute[]): string {
    const patterns = routes.map((route) => route.getRegexStrictString()).join('|')
    return `(${patterns})`
  }

  /** Creates a strict grouped regex from many routes. */
  static getRegexStrictGroup(routes: AnyRoute[]): RegExp {
    const patterns = Route0.getRegexStrictStringGroup(routes)
    return new RegExp(`^(${patterns})$`)
  }

  /** Creates a grouped regex pattern string from many routes. */
  static getRegexStringGroup(routes: AnyRoute[]): string {
    const patterns = routes.map((route) => route.getRegexString()).join('|')
    return `(${patterns})`
  }

  /** Creates a grouped regex from many routes. */
  static getRegexGroup(routes: AnyRoute[]): RegExp {
    const patterns = Route0.getRegexStringGroup(routes)
    return new RegExp(`^(${patterns})$`)
  }

  /** Converts any location shape to relative form (removes host/origin fields). */
  static toRelLocation<TLocation extends AnyLocation>(location: TLocation): TLocation {
    return {
      ...location,
      abs: false,
      origin: undefined,
      href: undefined,
      port: undefined,
      host: undefined,
      hostname: undefined,
    }
  }

  /** Converts a location to absolute form using provided origin URL. */
  static toAbsLocation<TLocation extends AnyLocation>(location: TLocation, origin: string): TLocation {
    const relLoc = Route0.toRelLocation(location)
    const url = new URL(relLoc.hrefRel, origin)
    return {
      ...location,
      abs: true,
      origin: url.origin,
      href: url.href,
      port: url.port,
      host: url.host,
      hostname: url.hostname,
    }
  }

  /**
   * Parses a URL-like input into raw location object (without route knowledge).
   *
   * Result is always `UnknownLocation` because no route matching is applied.
   */
  static getLocation(href: `${string}://${string}`): UnknownLocation
  static getLocation(hrefRel: `/${string}`): UnknownLocation
  static getLocation(hrefOrHrefRel: string): UnknownLocation
  static getLocation(location: AnyLocation): UnknownLocation
  static getLocation(url: URL): UnknownLocation
  static getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): UnknownLocation
  static getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): UnknownLocation {
    if (hrefOrHrefRelOrLocation instanceof URL) {
      return Route0.getLocation(hrefOrHrefRelOrLocation.href)
    }
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

    // Build the location object consistent with _GeneralLocation
    const location: UnknownLocation = {
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

      // specific to UnknownLocation
      searchParams,
      params: undefined,
      route: undefined,
      known: false,
      exact: false,
      ancestor: false,
      descendant: false,
      unmatched: false,
    }

    return location
  }

  /**
   * Parses input and matches it against this route definition.
   *
   * Result includes relation flags:
   * - `exact`
   * - `ancestor`
   * - `descendant`
   * - `unmatched`
   */
  getLocation(href: `${string}://${string}`): KnownLocation<TDefinition>
  getLocation(hrefRel: `/${string}`): KnownLocation<TDefinition>
  getLocation(hrefOrHrefRel: string): KnownLocation<TDefinition>
  getLocation(location: AnyLocation): KnownLocation<TDefinition>
  getLocation(url: AnyLocation): KnownLocation<TDefinition>
  getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): KnownLocation<TDefinition>
  getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): KnownLocation<TDefinition> {
    if (hrefOrHrefRelOrLocation instanceof URL) {
      return this.getLocation(hrefOrHrefRelOrLocation.href)
    }
    if (typeof hrefOrHrefRelOrLocation !== 'string') {
      hrefOrHrefRelOrLocation = hrefOrHrefRelOrLocation.href || hrefOrHrefRelOrLocation.hrefRel
    }
    const location = Route0.getLocation(hrefOrHrefRelOrLocation) as never as KnownLocation<TDefinition>
    location.route = this.definition as Definition<TDefinition>
    location.params = {}

    // Normalize pathname (no trailing slash except root)
    const pathname =
      location.pathname.length > 1 && location.pathname.endsWith('/')
        ? location.pathname.slice(0, -1)
        : location.pathname

    // Extract param names from the definition
    const paramNames: string[] = []
    const def =
      this.pathDefinition.length > 1 && this.pathDefinition.endsWith('/')
        ? this.pathDefinition.slice(0, -1)
        : this.pathDefinition
    def.replace(/:([A-Za-z0-9_]+)/g, (_m: string, name: string) => {
      paramNames.push(String(name))
      return ''
    })

    const exactRe = new RegExp(`^${this.getRegexBaseString()}$`)
    const ancestorRe = new RegExp(`^${this.getRegexBaseString()}(?:/.*)?$`) // route matches the beginning of the URL (may have more)
    const exactMatch = pathname.match(exactRe)
    const ancestorMatch = pathname.match(ancestorRe)
    const exact = !!exactMatch
    const ancestor = !exact && !!ancestorMatch

    // Parse params for exact and ancestor matches.
    const paramsMatch = exactMatch || (ancestor ? ancestorMatch : null)
    if (paramsMatch) {
      const values = paramsMatch.slice(1, 1 + paramNames.length)
      const params = Object.fromEntries(paramNames.map((n, i) => [n, decodeURIComponent(values[i] ?? '')]))
      location.params = params
    } else {
      location.params = {}
    }

    // "descendant": the URL is a prefix of the route definition (params match any single segment)
    const getParts = (path: string) => (path === '/' ? ['/'] : path.split('/').filter(Boolean))
    const defParts = getParts(def)
    const pathParts = getParts(pathname)

    let isPrefix = true
    if (pathParts.length > defParts.length) {
      isPrefix = false
    } else {
      for (let i = 0; i < pathParts.length; i++) {
        const defPart = defParts[i]
        const pathPart = pathParts[i]
        if (!defPart) {
          isPrefix = false
          break
        }
        if (defPart.startsWith(':')) continue
        if (defPart !== pathPart) {
          isPrefix = false
          break
        }
      }
    }
    const descendant = !exact && isPrefix
    const unmatched = !exact && !ancestor && !descendant

    // For descendant matches, include only params that are already determined
    // by the current (shorter) pathname prefix.
    if (descendant) {
      const descendantParams: Record<string, string> = {}
      for (let i = 0; i < pathParts.length; i++) {
        const defPart = defParts[i]
        const pathPart = pathParts[i]
        if (!defPart || !pathPart) continue
        if (defPart.startsWith(':')) {
          descendantParams[defPart.slice(1)] = decodeURIComponent(pathPart)
        }
      }
      location.params = descendantParams
    }

    return {
      ...location,
      known: true,
      exact,
      ancestor,
      descendant,
      unmatched,
    } as KnownLocation<TDefinition>
  }

  private _validateParamsInput(input: unknown): StandardSchemaV1.Result<ParamsOutput<TDefinition>> {
    const paramsKeys = this.getParamsKeys()
    if (input === undefined) {
      if (paramsKeys.length) {
        return {
          issues: [
            {
              message: `Missing params: ${paramsKeys.map((k) => `"${k}"`).join(', ')}`,
            },
          ],
        }
      }
      input = {}
    }
    if (typeof input !== 'object' || input === null) {
      return {
        issues: [{ message: 'Invalid input: expected object' }],
      }
    }
    const inputObj = input as Record<string, unknown>
    const inputKeys = Object.keys(inputObj)
    const notDefinedKeys = paramsKeys.filter((k) => !inputKeys.includes(k))
    if (notDefinedKeys.length) {
      return {
        issues: [
          {
            message: `Missing params: ${notDefinedKeys.map((k) => `"${k}"`).join(', ')}`,
          },
        ],
      }
    }
    const data: Record<string, string> = {}
    for (const k of paramsKeys) {
      const v = inputObj[k]
      if (typeof v === 'string') {
        data[k] = v
      } else if (typeof v === 'number') {
        data[k] = String(v)
      } else {
        return {
          issues: [{ message: `Invalid input: expected string, number, got ${typeof v} for "${k}"` }],
        }
      }
    }
    return {
      value: data as ParamsOutput<TDefinition>,
    }
  }

  private _validateSearchInput<TLoose extends boolean>(
    input: unknown,
    loose: TLoose,
  ): StandardSchemaV1.Result<TLoose extends true ? LooseSearchOutput<TDefinition> : StrictSearchOutput<TDefinition>> {
    if (input === undefined) {
      input = {}
    }
    if (typeof input !== 'object' || input === null) {
      return {
        issues: [{ message: 'Invalid input: expected object' }],
      }
    }
    const inputObj = input as Record<string, unknown>
    const paramsKeys = this.getParamsKeys()
    const searchKeys = this.getSearchKeys()
    const data: Record<string, string> = {}
    for (const [k, v] of Object.entries(inputObj)) {
      if (k === 'hash') continue
      if (paramsKeys.includes(k)) continue
      if (!loose && !searchKeys.includes(k)) continue
      if (v === undefined) continue
      if (typeof v === 'string') {
        data[k] = v
      } else if (typeof v === 'number') {
        data[k] = String(v)
      } else {
        return {
          issues: [{ message: `Invalid input: expected string, number, or undefined, got ${typeof v} for "${k}"` }],
        }
      }
    }
    return {
      value: data as TLoose extends true ? LooseSearchOutput<TDefinition> : StrictSearchOutput<TDefinition>,
    }
  }

  private _validateFlatInput<TLoose extends boolean>(
    input: unknown,
    loose: TLoose,
  ): StandardSchemaV1.Result<TLoose extends true ? LooseFlatOutput<TDefinition> : StrictFlatOutput<TDefinition>> {
    const paramsResult = this._validateParamsInput(input)
    if ('issues' in paramsResult) {
      return {
        issues: paramsResult.issues ?? [],
      }
    }

    const searchResult = this._validateSearchInput(input, loose)
    if ('issues' in searchResult) {
      return {
        issues: searchResult.issues ?? [],
      }
    }

    return {
      value: {
        ...(searchResult.value as Record<string, string>),
        ...(paramsResult.value as Record<string, string>),
      } as TLoose extends true ? LooseFlatOutput<TDefinition> : StrictFlatOutput<TDefinition>,
    }
  }

  private _safeParseSchemaResult<TOutput extends Record<string, unknown>>(
    result: StandardSchemaV1.Result<TOutput>,
  ): _SafeParseInputResult<TOutput> {
    if ('issues' in result) {
      return {
        success: false,
        data: undefined,
        error: new Error(result.issues?.[0]?.message ?? 'Invalid input'),
      }
    }
    return {
      success: true,
      data: result.value,
      error: undefined,
    }
  }

  private _parseSchemaResult<TOutput extends Record<string, unknown>>(
    result: StandardSchemaV1.Result<TOutput>,
  ): TOutput {
    const safeResult = this._safeParseSchemaResult(result)
    if (safeResult.error) {
      throw safeResult.error
    }
    return safeResult.data
  }

  /** Standard Schema for route params input. */
  readonly paramsInputSchema: Route0Schema<ParamsInput<TDefinition> | undefined, ParamsOutput<TDefinition>> = {
    '~standard': {
      version: 1,
      vendor: 'route0',
      validate: (value) => this._validateParamsInput(value),
      types: undefined as unknown as StandardSchemaV1.Types<
        ParamsInput<TDefinition> | undefined,
        ParamsOutput<TDefinition>
      >,
    },
    parse: (value) => this._parseSchemaResult(this._validateParamsInput(value)),
    safeParse: (value) => this._safeParseSchemaResult(this._validateParamsInput(value)),
  }

  /** Standard Schema for strict search input. */
  readonly strictSearchInputSchema: Route0Schema<
    StrictSearchInput<TDefinition> | undefined,
    StrictSearchOutput<TDefinition>
  > = {
    '~standard': {
      version: 1,
      vendor: 'route0',
      validate: (value) => this._validateSearchInput(value, false),
      types: undefined as unknown as StandardSchemaV1.Types<
        StrictSearchInput<TDefinition> | undefined,
        StrictSearchOutput<TDefinition>
      >,
    },
    parse: (value) => this._parseSchemaResult(this._validateSearchInput(value, false)),
    safeParse: (value) => this._safeParseSchemaResult(this._validateSearchInput(value, false)),
  }

  /** Standard Schema for loose search input. */
  readonly looseSearchInputSchema: Route0Schema<
    LooseSearchInput<TDefinition> | undefined,
    LooseSearchOutput<TDefinition>
  > = {
    '~standard': {
      version: 1,
      vendor: 'route0',
      validate: (value) => this._validateSearchInput(value, true),
      types: undefined as unknown as StandardSchemaV1.Types<
        LooseSearchInput<TDefinition> | undefined,
        LooseSearchOutput<TDefinition>
      >,
    },
    parse: (value) => this._parseSchemaResult(this._validateSearchInput(value, true)),
    safeParse: (value) => this._safeParseSchemaResult(this._validateSearchInput(value, true)),
  }

  /** Standard Schema for route flat input (uses route default strict/loose mode). */
  readonly flatInputSchema: Route0Schema<
    FlatInput<TDefinition, HasLooseSearch<TDefinition>> | undefined,
    FlatOutput<TDefinition, HasLooseSearch<TDefinition>>
  > = {
    '~standard': {
      version: 1,
      vendor: 'route0',
      validate: (value) => this._validateFlatInput(value, this.hasLooseSearch as HasLooseSearch<TDefinition>),
      types: undefined as unknown as StandardSchemaV1.Types<
        FlatInput<TDefinition, HasLooseSearch<TDefinition>> | undefined,
        FlatOutput<TDefinition, HasLooseSearch<TDefinition>>
      >,
    },
    parse: (value) =>
      this._parseSchemaResult(this._validateFlatInput(value, this.hasLooseSearch as HasLooseSearch<TDefinition>)),
    safeParse: (value) =>
      this._safeParseSchemaResult(this._validateFlatInput(value, this.hasLooseSearch as HasLooseSearch<TDefinition>)),
  }

  /** True when path structure is equal (param names are ignored). */
  isSame(other: AnyRoute): boolean {
    return (
      this.pathDefinition.replace(/:([A-Za-z0-9_]+)/g, '__PARAM__') ===
      other.pathDefinition.replace(/:([A-Za-z0-9_]+)/g, '__PARAM__')
    )
  }
  /** Static convenience wrapper for `isSame`. */
  static isSame(a: AnyRoute | string | undefined, b: AnyRoute | string | undefined): boolean {
    if (!a) {
      if (!b) return true
      return false
    }
    if (!b) {
      return false
    }
    return Route0.create(a).isSame(Route0.create(b))
  }

  /** True when current route is more specific/deeper than `other`. */
  isDescendant(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    // this is a descendant of other if:
    // - paths are not exactly the same
    // - other's path is a prefix of this path, matching params as wildcards
    const getParts = (path: string) => (path === '/' ? ['/'] : path.split('/').filter(Boolean))
    // Root is ancestor of any non-root; thus any non-root is a descendant of root
    if (other.pathDefinition === '/' && this.pathDefinition !== '/') {
      return true
    }
    const thisParts = getParts(this.pathDefinition)
    const otherParts = getParts(other.pathDefinition)

    // A descendant must be deeper
    if (thisParts.length <= otherParts.length) return false

    for (let i = 0; i < otherParts.length; i++) {
      const otherPart = otherParts[i]
      const thisPart = thisParts[i]
      if (otherPart.startsWith(':')) continue
      if (otherPart !== thisPart) return false
    }
    // Not equal (depth already ensures not equal)
    return true
  }

  /** True when current route is broader/shallower than `other`. */
  isAncestor(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    // this is an ancestor of other if:
    // - paths are not exactly the same
    // - this path is a prefix of other path, matching params as wildcards
    const getParts = (path: string) => (path === '/' ? ['/'] : path.split('/').filter(Boolean))
    // Root is ancestor of any non-root path
    if (this.pathDefinition === '/' && other.pathDefinition !== '/') {
      return true
    }
    const thisParts = getParts(this.pathDefinition)
    const otherParts = getParts(other.pathDefinition)

    // An ancestor must be shallower
    if (thisParts.length >= otherParts.length) return false

    for (let i = 0; i < thisParts.length; i++) {
      const thisPart = thisParts[i]
      const otherPart = otherParts[i]
      if (thisPart.startsWith(':')) continue
      if (thisPart !== otherPart) return false
    }
    // Not equal (depth already ensures not equal)
    return true
  }

  /** True when two route patterns can match the same concrete URL. */
  isConflict(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    const getParts = (path: string) => {
      if (path === '/') return ['/']
      return path.split('/').filter(Boolean)
    }

    const thisParts = getParts(this.pathDefinition)
    const otherParts = getParts(other.pathDefinition)

    // Different lengths = no conflict (one is deeper than the other)
    if (thisParts.length !== otherParts.length) {
      return false
    }

    // Check if all segments could match
    for (let i = 0; i < thisParts.length; i++) {
      const thisPart = thisParts[i]
      const otherPart = otherParts[i]

      // Both params = always match
      if (thisPart.startsWith(':') && otherPart.startsWith(':')) {
        continue
      }

      // One is param = can match
      if (thisPart.startsWith(':') || otherPart.startsWith(':')) {
        continue
      }

      // Both static = must be same
      if (thisPart !== otherPart) {
        return false
      }
    }

    return true
  }

  /** Specificity comparator used for deterministic route ordering. */
  isMoreSpecificThan(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    // More specific = should come earlier when conflicted
    // Static segments beat param segments at the same position
    const getParts = (path: string) => {
      if (path === '/') return ['/']
      return path.split('/').filter(Boolean)
    }

    const thisParts = getParts(this.pathDefinition)
    const otherParts = getParts(other.pathDefinition)

    // Compare segment by segment
    for (let i = 0; i < Math.min(thisParts.length, otherParts.length); i++) {
      const thisIsStatic = !thisParts[i].startsWith(':')
      const otherIsStatic = !otherParts[i].startsWith(':')

      if (thisIsStatic && !otherIsStatic) return true
      if (!thisIsStatic && otherIsStatic) return false
    }

    // All equal, use lexicographic
    return this.pathDefinition < other.pathDefinition
  }
}

/**
 * Typed route collection with deterministic matching order.
 *
 * `Routes.create()` accepts either plain string definitions or route objects
 * and returns a "pretty" object with direct route access + helper methods under `._`.
 */

export class Routes<const T extends RoutesRecord = any> {
  _routes: RoutesRecordHydrated<T>
  _pathsOrdering: string[]
  _keysOrdering: string[]
  _ordered: CallableRoute[]

  _: {
    routes: Routes<T>['_routes']
    getLocation: Routes<T>['_getLocation']
    clone: Routes<T>['_clone']
    pathsOrdering: Routes<T>['_pathsOrdering']
    keysOrdering: Routes<T>['_keysOrdering']
    ordered: Routes<T>['_ordered']
  }

  private constructor({
    routes,
    isHydrated = false,
    pathsOrdering,
    keysOrdering,
    ordered,
  }: {
    routes: RoutesRecordHydrated<T> | T
    isHydrated?: boolean
    pathsOrdering?: string[]
    keysOrdering?: string[]
    ordered?: CallableRoute[]
  }) {
    this._routes = (
      isHydrated ? (routes as RoutesRecordHydrated<T>) : Routes.hydrate(routes)
    ) as RoutesRecordHydrated<T>
    if (!pathsOrdering || !keysOrdering || !ordered) {
      const ordering = Routes.makeOrdering(this._routes)
      this._pathsOrdering = ordering.pathsOrdering
      this._keysOrdering = ordering.keysOrdering
      this._ordered = this._keysOrdering.map((key) => this._routes[key])
    } else {
      this._pathsOrdering = pathsOrdering
      this._keysOrdering = keysOrdering
      this._ordered = ordered
    }
    this._ = {
      routes: this._routes,
      getLocation: this._getLocation.bind(this),
      clone: this._clone.bind(this),
      pathsOrdering: this._pathsOrdering,
      keysOrdering: this._keysOrdering,
      ordered: this._ordered,
    }
  }

  /** Creates and hydrates a typed routes collection. */
  static create<const T extends RoutesRecord>(routes: T, override?: RouteConfigInput): RoutesPretty<T> {
    const result = Routes.prettify(new Routes({ routes }))
    if (!override) {
      return result
    }
    return result._.clone(override)
  }

  private static prettify<const T extends RoutesRecord>(instance: Routes<T>): RoutesPretty<T> {
    Object.setPrototypeOf(instance, Routes.prototype)
    Object.defineProperty(instance, Symbol.toStringTag, {
      value: 'Routes',
    })
    Object.assign(instance, {
      clone: instance._clone.bind(instance),
    })
    Object.assign(instance, instance._routes)
    return instance as unknown as RoutesPretty<T>
  }

  private static hydrate<const T extends RoutesRecord>(routes: T): RoutesRecordHydrated<T> {
    const result = {} as RoutesRecordHydrated<T>
    for (const key in routes) {
      if (Object.hasOwn(routes, key)) {
        const value = routes[key]
        result[key] = (typeof value === 'string' ? Route0.create(value) : value) as CallableRoute<T[typeof key]>
      }
    }
    return result
  }

  /**
   * Matches an input URL against collection routes.
   *
   * Returns first exact match according to precomputed ordering,
   * otherwise returns `UnknownLocation`.
   */
  _getLocation(href: `${string}://${string}`): UnknownLocation | ExactLocation
  _getLocation(hrefRel: `/${string}`): UnknownLocation | ExactLocation
  _getLocation(hrefOrHrefRel: string): UnknownLocation | ExactLocation
  _getLocation(location: AnyLocation): UnknownLocation | ExactLocation
  _getLocation(url: URL): UnknownLocation | ExactLocation
  _getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): UnknownLocation | ExactLocation
  _getLocation(hrefOrHrefRelOrLocation: string | AnyLocation | URL): UnknownLocation | ExactLocation {
    // Find the route that exactly matches the given location
    const input = hrefOrHrefRelOrLocation
    for (const route of this._ordered) {
      const loc = route.getLocation(hrefOrHrefRelOrLocation)
      if (loc.exact) {
        return loc
      }
    }
    // No exact match found, return UnknownLocation
    return typeof input === 'string' ? Route0.getLocation(input) : Route0.getLocation(input)
  }

  private static makeOrdering(routes: RoutesRecord): {
    pathsOrdering: string[]
    keysOrdering: string[]
  } {
    const hydrated = Routes.hydrate(routes)
    const entries = Object.entries(hydrated)

    const getParts = (path: string) => {
      if (path === '/') return ['/']
      return path.split('/').filter(Boolean)
    }

    // Sort: shorter paths first, then by specificity, then alphabetically
    entries.sort(([_keyA, routeA], [_keyB, routeB]) => {
      const partsA = getParts(routeA.pathDefinition)
      const partsB = getParts(routeB.pathDefinition)

      // 1. Shorter paths first (by segment count)
      if (partsA.length !== partsB.length) {
        return partsA.length - partsB.length
      }

      // 2. Same length: check if they conflict
      if (routeA.isConflict(routeB)) {
        // Conflicting routes: more specific first
        if (routeA.isMoreSpecificThan(routeB)) return -1
        if (routeB.isMoreSpecificThan(routeA)) return 1
      }

      // 3. Same length, not conflicting or equal specificity: alphabetically
      return routeA.pathDefinition.localeCompare(routeB.pathDefinition)
    })

    const pathsOrdering = entries.map(([_key, route]) => route.definition)
    const keysOrdering = entries.map(([_key]) => _key)
    return { pathsOrdering, keysOrdering }
  }

  /** Returns a cloned routes collection with config applied to each route. */
  _clone(config: RouteConfigInput): RoutesPretty<T> {
    const newRoutes = {} as RoutesRecordHydrated<T>
    for (const key in this._routes) {
      if (Object.hasOwn(this._routes, key)) {
        newRoutes[key] = this._routes[key].clone(config) as CallableRoute<T[typeof key]>
      }
    }
    const instance = new Routes({
      routes: newRoutes,
      isHydrated: true,
      pathsOrdering: this._pathsOrdering,
      keysOrdering: this._keysOrdering,
      ordered: this._keysOrdering.map((key) => newRoutes[key]),
    })
    return Routes.prettify(instance)
  }

  static _ = {
    prettify: Routes.prettify.bind(Routes),
    hydrate: Routes.hydrate.bind(Routes),
    makeOrdering: Routes.makeOrdering.bind(Routes),
  }
}

// main

/** Any route instance shape, preserving literal path type when known. */
export type AnyRoute<T extends Route0<string> | string = string> = T extends string ? Route0<T> : T
/** Callable route (`route(input)`) plus route instance methods/properties. */
export type CallableRoute<T extends Route0<string> | string = string> = AnyRoute<T> & AnyRoute<T>['get']
/** Route input accepted by most APIs: definition string or route object/callable. */
export type AnyRouteOrDefinition<T extends string = string> = AnyRoute<T> | CallableRoute<T> | T
/** Route-level runtime configuration. */
export type RouteConfigInput = {
  origin?: string
}

// collection

/** User-provided routes map (plain definitions or route instances). */
export type RoutesRecord = Record<string, AnyRoute | string>
/** Same as `RoutesRecord` but all values normalized to callable routes. */
export type RoutesRecordHydrated<TRoutesRecord extends RoutesRecord = any> = {
  [K in keyof TRoutesRecord]: CallableRoute<TRoutesRecord[K]>
}
/** Public shape returned by `Routes.create()`. Default `any` so `satisfies RoutesPretty` accepts any created routes. */
export type RoutesPretty<TRoutesRecord extends RoutesRecord = any> = RoutesRecordHydrated<TRoutesRecord> &
  Omit<Routes<TRoutesRecord>, '_routes' | '_getLocation' | '_clone' | '_pathsOrdering' | '_keysOrdering' | '_ordered'>
export type ExtractRoutesKeys<TRoutes extends RoutesPretty | RoutesRecord> = TRoutes extends RoutesPretty
  ? Extract<keyof TRoutes['_']['routes'], string>
  : TRoutes extends RoutesRecord
    ? Extract<keyof TRoutes, string>
    : never
export type ExtractRoute<
  TRoutes extends RoutesPretty | RoutesRecord,
  TKey extends ExtractRoutesKeys<TRoutes>,
> = TRoutes extends RoutesPretty ? TRoutes['_']['routes'][TKey] : TRoutes extends RoutesRecord ? TRoutes[TKey] : never

// public utils

export type Definition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['definition']
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
  ? Route0<PathExtended<T['definition'], TSuffixDefinition>>
  : T extends string
    ? Route0<PathExtended<T, TSuffixDefinition>>
    : T extends undefined
      ? Route0<TSuffixDefinition>
      : never

export type IsAncestor<T extends AnyRoute | string, TAncestor extends AnyRoute | string> = _IsAncestor<
  PathDefinition<T>,
  PathDefinition<TAncestor>
>
export type IsDescendant<T extends AnyRoute | string, TDescendant extends AnyRoute | string> = _IsDescendant<
  PathDefinition<T>,
  PathDefinition<TDescendant>
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
export type HasSearch<T extends AnyRoute | string> = Definition<T> extends `${string}&${string}` ? true : false
export type HasNamedSearch<T extends AnyRoute | string> = // Definition<T> extends `${string}&${string}` ? true : false
  SearchTailDefinitionWithoutFirstAndLastAmp<Definition<T>> extends '' ? false : true
export type HasLooseSearch<T extends AnyRoute | string> = Definition<T> extends `${string}&` ? true : false

export type ParamsOutput<T extends AnyRoute | string> = {
  [K in keyof ParamsDefinition<T>]: string
}
export type LooseSearchOutput<T extends AnyRoute | string = string> = Partial<
  {
    [K in keyof SearchDefinition<T>]?: string
  } & Record<string, string | undefined>
>
export type StrictSearchOutput<T extends AnyRoute | string> = Partial<{
  [K in keyof SearchDefinition<T>]?: string | undefined
}>
export type LooseFlatOutput<T extends AnyRoute | string = string> =
  HasParams<Definition<T>> extends true ? ParamsOutput<T> & LooseSearchOutput<T> : LooseSearchOutput<T>
export type StrictFlatOutput<T extends AnyRoute | string> =
  HasParams<Definition<T>> extends true ? ParamsOutput<T> & StrictSearchOutput<T> : StrictSearchOutput<T>
export type FlatOutput<T extends AnyRoute | string, TLoose extends boolean = HasLooseSearch<T>> = TLoose extends true
  ? LooseFlatOutput<T>
  : StrictFlatOutput<T>
export type LooseFlatOutputWithHash<T extends AnyRoute | string = string> = LooseFlatOutput<T> & {
  hash?: string | undefined
}
export type StrictFlatOutputWithHash<T extends AnyRoute | string> = StrictFlatOutput<T> & { hash?: string | undefined }
export type FlatOutputWithHash<T extends AnyRoute | string, TLoose extends boolean = HasLooseSearch<T>> = FlatOutput<
  T,
  TLoose
> & { hash?: string | undefined }
export type ParamsInput<T extends AnyRoute | string = string> = _ParamsInput<PathDefinition<T>>
export type LooseSearchInput<T extends AnyRoute | string = string> = _LooseSearchInput<Definition<T>>
export type StrictSearchInput<T extends AnyRoute | string> = _StrictSearchInput<Definition<T>>
export type LooseFlatInput<T extends AnyRoute | string> = _LooseFlatInput<Definition<T>>
export type StrictFlatInput<T extends AnyRoute | string> = _StrictFlatInput<Definition<T>>
export type FlatInput<T extends AnyRoute | string, TLoose extends boolean = HasLooseSearch<T>> = TLoose extends true
  ? LooseFlatInput<T>
  : StrictFlatInput<T>
export type LooseFlatInputWithHash<T extends AnyRoute | string> = LooseFlatInput<T> & {
  hash?: string | number
}
export type StrictFlatInputWithHash<T extends AnyRoute | string> = StrictFlatInput<T> & {
  hash?: string | number
}
export type FlatInputWithHash<T extends AnyRoute | string, TLoose extends boolean = HasLooseSearch<T>> = FlatInput<
  T,
  TLoose
> & { hash?: string | number }
export type CanInputBeEmpty<T extends AnyRoute | string> = HasParams<Definition<T>> extends true ? false : true

export type ParamsInputStringOnly<T extends AnyRoute | string = string> = _ParamsInputStringOnly<PathDefinition<T>>
export type LooseSearchInputStringOnly<T extends AnyRoute | string = string> = _LooseSearchInputStringOnly<
  Definition<T>
>
export type StrictSearchInputStringOnly<T extends AnyRoute | string> = _StrictSearchInputStringOnly<Definition<T>>
export type LooseFlatInputStringOnly<T extends AnyRoute | string> = _LooseFlatInputStringOnly<Definition<T>>
export type StrictFlatInputStringOnly<T extends AnyRoute | string> = _StrictFlatInputStringOnly<Definition<T>>
export type FlatInputStringOnly<
  T extends AnyRoute | string,
  TLoose extends boolean = HasLooseSearch<T>,
> = TLoose extends true ? LooseFlatInputStringOnly<T> : StrictFlatInputStringOnly<T>

// location

export type LocationParams<TDefinition extends string> = {
  [K in keyof _ParamsDefinition<TDefinition>]: string
}
export type LocationSearch<TDefinition extends string = string> = {
  [K in keyof _SearchDefinition<TDefinition>]: string | undefined
} & Record<string, string | undefined>

/**
 * URL location primitives independent from route-matching state.
 *
 * `hrefRel` is relative href and includes `pathname + search + hash`.
 */
export type _GeneralLocation = {
  /**
   * Path without search/hash (normalized for trailing slash).
   *
   * Example:
   * - input: `https://example.com/users/42?tab=posts#section`
   * - pathname: `/users/42`
   */
  pathname: string
  /**
   * Raw query string with leading `?`, if present.
   *
   * Example:
   * - `?tab=posts&sort=desc`
   */
  search: string
  /**
   * Parsed query map (first value per key).
   *
   * Example:
   * - search: `?tab=posts&sort=desc`
   * - searchParams: `{ tab: 'posts', sort: 'desc' }`
   */
  searchParams: Record<string, string | undefined>
  /**
   * Raw hash with leading `#`, if present.
   *
   * Example:
   * - `#section`
   */
  hash: string
  /**
   * URL origin for absolute inputs.
   *
   * Example:
   * - href: `https://example.com/users/42`
   * - origin: `https://example.com`
   */
  origin?: string
  /**
   * Full absolute href for absolute inputs.
   *
   * Example:
   * - `https://example.com/users/42?tab=posts#section`
   */
  href?: string
  /**
   * Relative href (`pathname + search + hash`).
   *
   * Example:
   * - pathname: `/users/42`
   * - search: `?tab=posts`
   * - hash: `#section`
   * - hrefRel: `/users/42?tab=posts#section`
   */
  hrefRel: string
  /**
   * Whether input was absolute URL.
   *
   * Examples:
   * - `https://example.com/users/42` -> `true`
   * - `/users/42` -> `false`
   */
  abs: boolean
  port?: string
  host?: string
  hostname?: string
}
/** Location state before matching against a concrete route. */
export type UnknownLocationState = {
  known: false
  route: undefined
  params: undefined
  searchParams: LooseSearchOutput
  exact: false
  ancestor: false
  descendant: false
  unmatched: false
}
export type UnknownLocation = _GeneralLocation & UnknownLocationState

/** Known route context, but no exact/ancestor/descendant relation matched. */
export type UnmatchedLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: Record<never, never>
  searchParams: Record<string, string | undefined>
  exact: false
  ancestor: false
  descendant: false
  unmatched: true
}
export type UnmatchedLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  UnmatchedLocationState<TRoute>

/** Exact match state for a known route. */
export type ExactLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: ParamsOutput<TRoute>
  searchParams: LooseSearchOutput<TRoute>
  exact: true
  ancestor: false
  descendant: false
  unmatched: false
}
export type ExactLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  ExactLocationState<TRoute>

/** Input URL is a descendant of route definition (route is ancestor). */
export type AncestorLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: ParamsOutput<TRoute>
  searchParams: LooseSearchOutput<TRoute>
  exact: false
  ancestor: true
  descendant: false
  unmatched: false
}
export type AncestorLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  AncestorLocationState<TRoute>

/** It is when route not match at all, but params match. */
export type WeakAncestorLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: ParamsOutput<TRoute>
  searchParams: LooseSearchOutput<TRoute>
  exact: false
  ancestor: true
  descendant: false
  unmatched: false
}
export type WeakAncestorLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  WeakAncestorLocationState<TRoute>

/** Input URL is an ancestor prefix of route definition (route is descendant). */
export type DescendantLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: Partial<ParamsOutput<TRoute>>
  searchParams: LooseSearchOutput<TRoute>
  exact: false
  ancestor: false
  descendant: true
  unmatched: false
}
export type DescendantLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  DescendantLocationState<TRoute>

/** It is when route not match at all, but params partially match. */
export type WeakDescendantLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: Partial<ParamsOutput<TRoute>>
  searchParams: LooseSearchOutput<TRoute>
  exact: false
  ancestor: false
  descendant: true
  unmatched: false
}
export type WeakDescendantLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  WeakDescendantLocationState<TRoute>
export type KnownLocation<TRoute extends AnyRoute | string = AnyRoute | string> =
  | UnmatchedLocation<TRoute>
  | ExactLocation<TRoute>
  | AncestorLocation<TRoute>
  | WeakAncestorLocation<TRoute>
  | DescendantLocation<TRoute>
  | WeakDescendantLocation<TRoute>
export type AnyLocation<TRoute extends AnyRoute | string = AnyRoute | string> = UnknownLocation | KnownLocation<TRoute>

// internal utils

export type _PathDefinition<T extends string> = T extends string ? TrimSearchTailDefinition<T> : never
export type _ParamsDefinition<TDefinition extends string> =
  ExtractPathParams<PathDefinition<TDefinition>> extends infer U
    ? [U] extends [never]
      ? undefined
      : { [K in Extract<U, string>]: true }
    : undefined
export type _SearchDefinition<TDefinition extends string> =
  NonEmpty<SearchTailDefinitionWithoutFirstAndLastAmp<TDefinition>> extends infer Tail extends string
    ? AmpSplit<Tail> extends infer U
      ? [U] extends [never]
        ? undefined
        : { [K in Extract<U, string>]: true }
      : undefined
    : undefined

export type _ParamsInput<TDefinition extends string> =
  _ParamsDefinition<TDefinition> extends undefined
    ? Record<never, never>
    : {
        [K in keyof _ParamsDefinition<TDefinition>]: string | number
      }
export type _LooseSearchInput<TDefinition extends string> =
  _SearchDefinition<TDefinition> extends undefined
    ? Record<string, string | number>
    : Partial<{
        [K in keyof _SearchDefinition<TDefinition>]: string | number
      }> &
        Record<string, string | number>
export type _StrictSearchInput<TDefinition extends string> = Partial<{
  [K in keyof _SearchDefinition<TDefinition>]: string | number
}>
export type _LooseFlatInput<TDefinition extends string> =
  HasParams<TDefinition> extends true
    ? _ParamsInput<TDefinition> & _LooseSearchInput<TDefinition>
    : _LooseSearchInput<TDefinition>
export type _StrictFlatInput<TDefinition extends string> =
  HasParams<TDefinition> extends true
    ? HasNamedSearch<TDefinition> extends true
      ? _StrictSearchInput<TDefinition> & _ParamsInput<TDefinition>
      : _ParamsInput<TDefinition>
    : HasNamedSearch<TDefinition> extends true
      ? _StrictSearchInput<TDefinition>
      : Record<never, never>

export type _ParamsInputStringOnly<TDefinition extends string> =
  _ParamsDefinition<TDefinition> extends undefined
    ? Record<never, never>
    : {
        [K in keyof _ParamsDefinition<TDefinition>]: string
      }
export type _LooseSearchInputStringOnly<TDefinition extends string> =
  _SearchDefinition<TDefinition> extends undefined
    ? Record<string, string>
    : Partial<{
        [K in keyof _SearchDefinition<TDefinition>]: string
      }> &
        Record<string, string>
export type _StrictSearchInputStringOnly<TDefinition extends string> = Partial<{
  [K in keyof _SearchDefinition<TDefinition>]: string
}>
export type _LooseFlatInputStringOnly<TDefinition extends string> =
  HasParams<TDefinition> extends true
    ? _ParamsInputStringOnly<TDefinition> & _LooseSearchInputStringOnly<TDefinition>
    : _LooseSearchInputStringOnly<TDefinition>
export type _StrictFlatInputStringOnly<TDefinition extends string> =
  HasParams<TDefinition> extends true
    ? HasNamedSearch<TDefinition> extends true
      ? _StrictSearchInputStringOnly<TDefinition> & _ParamsInputStringOnly<TDefinition>
      : _ParamsInputStringOnly<TDefinition>
    : HasNamedSearch<TDefinition> extends true
      ? _StrictSearchInputStringOnly<TDefinition>
      : Record<never, never>

export type TrimSearchTailDefinition<S extends string> = S extends `${infer P}&${string}` ? P : S
export type SearchTailDefinitionWithoutFirstAmp<S extends string> = S extends `${string}&${infer T}` ? T : ''
export type SearchTailDefinitionWithoutFirstAndLastAmp<S extends string> = S extends `${string}&${infer T}&`
  ? T
  : S extends `${string}&${infer T}`
    ? T
    : ''
export type SearchTailDefinitionWithFirstAmp<S extends string> = S extends `${string}&${infer T}` ? `&${T}` : ''
export type AmpSplit<S extends string> = S extends `${infer A}&${infer B}` ? A | AmpSplit<B> : S
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

export type OnlyIfNoParams<TRoute extends AnyRoute | string, Yes, No = never> =
  HasParams<TRoute> extends false ? Yes : No
export type OnlyIfHasParams<TRoute extends AnyRoute | string, Yes, No = never> =
  HasParams<TRoute> extends true ? Yes : No

// export type PathRouteValue<TDefinition extends string> = `${ReplacePathParams<PathDefinition<TDefinition>>}`
// export type PathOnlyRouteValue<TDefinition extends string> = `${ReplacePathParams<PathDefinition<TDefinition>>}`
// export type WithSearchRouteValue<TDefinition extends string> =
//   `${ReplacePathParams<PathDefinition<TDefinition>>}?${string}`
// export type AbsolutePathRouteValue<TDefinition extends string> =
//   PathRouteValue<TDefinition> extends '/' ? string : `${string}${PathRouteValue<TDefinition>}`
// export type AbsolutePathOnlyRouteValue<TDefinition extends string> =
//   PathOnlyRouteValue<TDefinition> extends '/' ? string : `${string}${PathOnlyRouteValue<TDefinition>}`
// export type AbsoluteWithSearchRouteValue<TDefinition extends string> = `${string}${WithSearchRouteValue<TDefinition>}`

export type PathExtended<
  TSourcedefinitionDefinition extends string,
  TSuffixdefinitionDefinition extends string,
> = `${JoinPath<TSourcedefinitionDefinition, TSuffixdefinitionDefinition>}${SearchTailDefinitionWithFirstAmp<TSuffixdefinitionDefinition>}`

export type WithParamsInput<
  TDefinition extends string,
  T extends
    | {
        search?: _LooseSearchInput<any>
        abs?: boolean | string
        hash?: string | number
      }
    | undefined = undefined,
> = _ParamsInput<TDefinition> & (T extends undefined ? Record<never, never> : T)

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

export type _IsAncestor<T extends string, TAncestor extends string> = T extends TAncestor
  ? false
  : T extends `${TAncestor}${string}`
    ? true
    : false
export type _IsDescendant<T extends string, TDescendant extends string> = TDescendant extends T
  ? false
  : TDescendant extends `${T}${string}`
    ? true
    : false
export type _IsSame<T extends string, TExact extends string> = T extends TExact
  ? TExact extends T
    ? true
    : false
  : false

export type _SafeParseInputResult<TInputParsed extends Record<string, unknown>> =
  | {
      success: true
      data: TInputParsed
      error: undefined
    }
  | {
      success: false
      data: undefined
      error: Error
    }
export type SafeParseInputStrictResult<TDefinition extends string> = _SafeParseInputResult<
  StrictFlatOutput<TDefinition>
>
export type SafeParseInputLooseResult<TDefinition extends string> = _SafeParseInputResult<LooseFlatOutput<TDefinition>>
export type Route0Schema<
  TInput extends Record<string, unknown> | undefined,
  TOutput extends Record<string, unknown>,
> = StandardSchemaV1<TInput, TOutput> & {
  parse: (input: unknown) => TOutput
  safeParse: (input: unknown) => _SafeParseInputResult<TOutput>
}
