import type { StandardSchemaV1 } from '@standard-schema/spec'

type RuntimePathToken =
  | { kind: 'static'; value: string }
  | { kind: 'param'; name: string; optional: boolean }
  | { kind: 'wildcard'; prefix: string; optional: boolean }

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getPathSegments = (definition: string): string[] => {
  if (definition === '' || definition === '/') return []
  return definition.split('/').filter(Boolean)
}

const getRuntimePathTokens = (definition: string): RuntimePathToken[] => {
  const segments = getPathSegments(definition)
  return segments.map((segment): RuntimePathToken => {
    const param = segment.match(/^:([A-Za-z0-9_]+)(\?)?$/)
    if (param) {
      return { kind: 'param', name: param[1], optional: param[2] === '?' }
    }
    if (segment === '*' || segment === '*?') {
      return { kind: 'wildcard', prefix: '', optional: segment.endsWith('?') }
    }
    const wildcard = segment.match(/^(.*)\*(\?)?$/)
    if (wildcard && !segment.includes('\\*')) {
      return { kind: 'wildcard', prefix: wildcard[1], optional: wildcard[2] === '?' }
    }
    return { kind: 'static', value: segment }
  })
}

const getPathRegexBaseStrictString = (definition: string): string => {
  const tokens = getRuntimePathTokens(definition)
  if (tokens.length === 0) return ''
  let pattern = ''
  for (const token of tokens) {
    if (token.kind === 'static') {
      pattern += `/${escapeRegex(token.value)}`
      continue
    }
    if (token.kind === 'param') {
      pattern += token.optional ? '(?:/([^/]+))?' : '/([^/]+)'
      continue
    }
    if (token.prefix.length > 0) {
      pattern += `/${escapeRegex(token.prefix)}(.*)`
    } else {
      // Wouter-compatible splat: /orders/* matches /orders and /orders/...
      pattern += '(?:/(.*))?'
    }
  }
  return pattern
}

const getPathCaptureKeys = (definition: string): string[] => {
  const keys: string[] = []
  for (const token of getRuntimePathTokens(definition)) {
    if (token.kind === 'param') keys.push(token.name)
    if (token.kind === 'wildcard') keys.push('*')
  }
  return keys
}

const getPathParamsDefinition = (definition: string): Record<string, boolean> => {
  const entries = getRuntimePathTokens(definition)
    .filter((t) => t.kind !== 'static')
    .map((t): [string, boolean] => (t.kind === 'param' ? [t.name, !t.optional] : ['*', !t.optional]))
  return Object.fromEntries(entries)
}

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
export class Route0<TDefinition extends string, TSearch extends UnknownSearch = UnknownSearch> {
  readonly definition: TDefinition
  readonly params: _ParamsDefinition<TDefinition>
  private _origin: string | undefined
  private _callable: CallableRoute<TDefinition, TSearch>

  Infer: {
    ParamsDefinition: _ParamsDefinition<TDefinition>
    ParamsInput: _ParamsInput<TDefinition>
    ParamsInputStringOnly: _ParamsInputStringOnly<TDefinition>
    ParamsOutput: ParamsOutput<TDefinition>
    SearchInput: TSearch
  } = null as never

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
    this.params = Route0._getParamsDefinitionByDefinition(definition)

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
    const callable = this.get.bind(this)
    Object.setPrototypeOf(callable, this)
    Object.defineProperty(callable, Symbol.toStringTag, {
      value: this.definition,
    })
    this._callable = callable as CallableRoute<TDefinition, TSearch>
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
    if (typeof definition === 'function' || typeof definition === 'object') {
      return definition.clone(config) as CallableRoute<TDefinition>
    }
    const original = new Route0<TDefinition>(definition, config)
    return original._callable
  }

  /**
   * Normalizes a definition/route into a callable route.
   *
   * Unlike `create`, passing a callable route returns the same instance.
   */
  static from<TDefinition extends string, TSearch extends UnknownSearch>(
    definition: TDefinition | AnyRoute<TDefinition, TSearch> | CallableRoute<TDefinition, TSearch>,
  ): CallableRoute<TDefinition, TSearch> {
    if (typeof definition === 'function') {
      return definition
    }
    const original = typeof definition === 'object' ? definition : new Route0<TDefinition>(definition)
    return original._callable as CallableRoute<TDefinition, TSearch>
  }

  private static _getAbsPath(origin: string, url: string) {
    return new URL(url, origin).toString().replace(/\/$/, '')
  }

  private static _getParamsDefinitionByDefinition<TDefinition extends string>(
    definition: TDefinition,
  ): _ParamsDefinition<TDefinition> {
    return getPathParamsDefinition(definition) as _ParamsDefinition<TDefinition>
  }

  search<TNewSearch extends UnknownSearch>(): CallableRoute<TDefinition, TNewSearch> {
    return this._callable as CallableRoute<TDefinition, TNewSearch>
  }

  /** Extends the current route definition by appending a suffix route. */
  extend<TSuffixDefinition extends string>(
    suffixDefinition: TSuffixDefinition,
  ): CallableRoute<PathExtended<TDefinition, TSuffixDefinition>, TSearch> {
    const definition = `${this.definition}/${suffixDefinition}`.replace(/\/{2,}/g, '/')
    return Route0.create<PathExtended<TDefinition, TSuffixDefinition>>(
      definition as PathExtended<TDefinition, TSuffixDefinition>,
      { origin: this._origin },
    )
  }

  get(...args: IsParamsOptional<TDefinition> extends true ? [abs: boolean | string | undefined] : never): string
  get(
    ...args: IsParamsOptional<TDefinition> extends true
      ? [
          input?:
            | (_ParamsInput<TDefinition> & {
                '?'?: TSearch
                '#'?: string | number
              })
            | undefined,
          abs?: boolean | string | undefined,
        ]
      : [
          input: _ParamsInput<TDefinition> & {
            '?'?: TSearch
            '#'?: string | number
          },
          abs?: boolean | string | undefined,
        ]
  ): string

  // implementation
  get(...args: unknown[]): string {
    const { searchInput, paramsInput, absInput, absOriginInput, hashInput } = ((): {
      searchInput: Record<string, unknown>
      paramsInput: Record<string, string | undefined>
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
      const [input, abs] = ((): [Record<string, unknown>, boolean | string | undefined] => {
        if (typeof args[0] === 'object' && args[0] !== null) {
          return [args[0], args[1]] as [Record<string, unknown>, boolean | string | undefined]
        }
        if (typeof args[1] === 'object' && args[1] !== null) {
          return [args[1], args[0]] as [Record<string, unknown>, boolean | string | undefined]
        }
        if (typeof args[0] === 'boolean' || typeof args[0] === 'string') {
          return [{}, args[0]]
        }
        if (typeof args[1] === 'boolean' || typeof args[1] === 'string') {
          return [{}, args[1]]
        }
        return [{}, undefined]
      })()
      let searchInput: Record<string, unknown> = {}
      let hashInput: string | undefined = undefined
      const paramsInput: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(input)) {
        if (key === '?' && typeof value === 'object' && value !== null) {
          searchInput = value as Record<string, unknown>
        } else if (key === '#' && (typeof value === 'string' || typeof value === 'number')) {
          hashInput = String(value)
        } else if (key in this.params && (typeof value === 'string' || typeof value === 'number')) {
          Object.assign(paramsInput, { [key]: String(value) })
        }
      }
      const absOriginInput = typeof abs === 'string' && abs.length > 0 ? abs : undefined
      return {
        searchInput,
        paramsInput,
        absInput: absOriginInput !== undefined || abs === true,
        absOriginInput,
        hashInput,
      }
    })()

    // create url

    let url = this.definition as string
    // optional named params like /:id?
    url = url.replace(/\/:([A-Za-z0-9_]+)\?/g, (_m, k) => {
      const value = paramsInput[k]
      if (value === undefined) return ''
      return `/${encodeURIComponent(String(value))}`
    })
    // required named params
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    url = url.replace(/:([A-Za-z0-9_]+)(?!\?)/g, (_m, k) => encodeURIComponent(String(paramsInput?.[k] ?? 'undefined')))
    // optional wildcard segment (/*?)
    url = url.replace(/\/\*\?/g, () => {
      const value = paramsInput['*']
      if (value === undefined) return ''
      const stringValue = String(value)
      return stringValue.startsWith('/') ? stringValue : `/${stringValue}`
    })
    // required wildcard segment (/*)
    url = url.replace(/\/\*/g, () => {
      const value = String(paramsInput['*'] ?? '')
      return value.startsWith('/') ? value : `/${value}`
    })
    // optional wildcard inline (e.g. /app*?)
    url = url.replace(/\*\?/g, () => String(paramsInput['*'] ?? ''))
    // required wildcard inline (e.g. /app*)
    url = url.replace(/\*/g, () => String(paramsInput['*'] ?? ''))
    // search params
    const searchInputStringified = Object.fromEntries(Object.entries(searchInput).map(([k, v]) => [k, String(v)]))
    // TODO: add here flat0
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

  /** Returns path param keys extracted from route definition. */
  getParamsKeys(): string[] {
    return Object.keys(this.params)
  }

  /** Clones route with optional config override. */
  clone(config?: RouteConfigInput): CallableRoute<TDefinition> {
    return Route0.create(this.definition, config)
  }

  getRegexBaseStrictString(): string {
    return getPathRegexBaseStrictString(this.definition)
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
    // TODO: add here flat0
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

    const paramNames = getPathCaptureKeys(this.definition)
    const def =
      this.definition.length > 1 && this.definition.endsWith('/') ? this.definition.slice(0, -1) : this.definition

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
      const params = Object.fromEntries(
        paramNames.map((n, i) => {
          const value = values[i] as string | undefined
          return [n, value === undefined ? undefined : decodeURIComponent(value)]
        }),
      )
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
        if (defPart.includes('*')) {
          const prefix = defPart.replace(/\*\??$/, '')
          if (pathPart.startsWith(prefix)) continue
          isPrefix = false
          break
        }
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
          descendantParams[defPart.replace(/^:/, '').replace(/\?$/, '')] = decodeURIComponent(pathPart)
        } else if (defPart.includes('*')) {
          descendantParams['*'] = decodeURIComponent(pathPart)
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
    const paramsEntries = Object.entries(this.params) as Array<[string, boolean]>
    const paramsMap = this.params as Record<string, boolean>
    const requiredParamsKeys = paramsEntries.filter(([, required]) => required).map(([k]) => k)
    const paramsKeys = paramsEntries.map(([k]) => k)
    if (input === undefined) {
      if (requiredParamsKeys.length) {
        return {
          issues: [
            {
              message: `Missing params: ${requiredParamsKeys.map((k) => `"${k}"`).join(', ')}`,
            },
          ],
        }
      }
      input = {}
    }
    if (typeof input !== 'object' || input === null) {
      return {
        issues: [{ message: 'Invalid route params: expected object' }],
      }
    }
    const inputObj = input as Record<string, unknown>
    const inputKeys = Object.keys(inputObj)
    const notDefinedKeys = requiredParamsKeys.filter((k) => !inputKeys.includes(k))
    if (notDefinedKeys.length) {
      return {
        issues: [
          {
            message: `Missing params: ${notDefinedKeys.map((k) => `"${k}"`).join(', ')}`,
          },
        ],
      }
    }
    const data: Record<string, string | undefined> = {}
    for (const k of paramsKeys) {
      const v = inputObj[k]
      const required = paramsMap[k]
      if (v === undefined && !required) {
        data[k] = undefined as never
      } else if (typeof v === 'string') {
        data[k] = v
      } else if (typeof v === 'number') {
        data[k] = String(v)
      } else {
        return {
          issues: [{ message: `Invalid route params: expected string, number, got ${typeof v} for "${k}"` }],
        }
      }
    }
    return {
      value: data as ParamsOutput<TDefinition>,
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
  readonly paramsSchema: SchemaRoute0<ParamsInput<TDefinition>, ParamsOutput<TDefinition>> = {
    '~standard': {
      version: 1,
      vendor: 'route0',
      validate: (value) => this._validateParamsInput(value),
      types: undefined as unknown as StandardSchemaV1.Types<ParamsInput<TDefinition>, ParamsOutput<TDefinition>>,
    },
    parse: (value) => this._parseSchemaResult(this._validateParamsInput(value)),
    safeParse: (value) => this._safeParseSchemaResult(this._validateParamsInput(value)),
  }

  /** True when path structure is equal (param names are ignored). */
  isSame(other: AnyRoute): boolean {
    return (
      getRuntimePathTokens(this.definition)
        .map((t) => {
          if (t.kind === 'static') return `s:${t.value}`
          if (t.kind === 'param') return `p:${t.optional ? 'o' : 'r'}`
          return `w:${t.prefix}:${t.optional ? 'o' : 'r'}`
        })
        .join('/') ===
      getRuntimePathTokens(other.definition)
        .map((t) => {
          if (t.kind === 'static') return `s:${t.value}`
          if (t.kind === 'param') return `p:${t.optional ? 'o' : 'r'}`
          return `w:${t.prefix}:${t.optional ? 'o' : 'r'}`
        })
        .join('/')
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
    if (other.definition === '/' && this.definition !== '/') {
      return true
    }
    const thisParts = getParts(this.definition)
    const otherParts = getParts(other.definition)

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
    if (this.definition === '/' && other.definition !== '/') {
      return true
    }
    const thisParts = getParts(this.definition)
    const otherParts = getParts(other.definition)

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
    const thisRegex = this.getRegex()
    const otherRegex = other.getRegex()
    const makeCandidates = (definition: string): string[] => {
      const tokens = getRuntimePathTokens(definition)
      const values = (token: RuntimePathToken): string[] => {
        if (token.kind === 'static') return [token.value]
        if (token.kind === 'param') return token.optional ? ['', 'x'] : ['x']
        if (token.prefix.length > 0) return [token.prefix, `${token.prefix}-x`, `${token.prefix}/x/y`]
        return ['', 'x', 'x/y']
      }
      let acc: string[] = ['']
      for (const token of tokens) {
        const next: string[] = []
        for (const base of acc) {
          for (const value of values(token)) {
            if (value === '') {
              next.push(base)
            } else if (value.startsWith('/')) {
              next.push(`${base}${value}`)
            } else {
              next.push(`${base}/${value}`)
            }
          }
        }
        acc = next
      }
      if (acc.length === 0) return ['/']
      return Array.from(new Set(acc.map((x) => (x === '' ? '/' : x.replace(/\/{2,}/g, '/')))))
    }
    const thisCandidates = makeCandidates(this.definition)
    const otherCandidates = makeCandidates(other.definition)
    if (thisCandidates.some((path) => otherRegex.test(path))) return true
    if (otherCandidates.some((path) => thisRegex.test(path))) return true
    return false
  }

  /** True when paths are same or can overlap when optional parts are omitted. */
  isMayBeSame(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    return this.isSame(other) || this.isConflict(other)
  }

  /** Specificity comparator used for deterministic route ordering. */
  isMoreSpecificThan(other: AnyRoute | string | undefined): boolean {
    if (!other) return false
    other = Route0.create(other)
    const getParts = (path: string) => {
      if (path === '/') return ['/']
      return path.split('/').filter(Boolean)
    }
    const rank = (part: string): number => {
      if (part.includes('*')) return -1
      if (part.startsWith(':') && part.endsWith('?')) return 0
      if (part.startsWith(':')) return 1
      return 2
    }
    const thisParts = getParts(this.definition)
    const otherParts = getParts(other.definition)
    for (let i = 0; i < Math.min(thisParts.length, otherParts.length); i++) {
      const thisRank = rank(thisParts[i])
      const otherRank = rank(otherParts[i])
      if (thisRank > otherRank) return true
      if (thisRank < otherRank) return false
    }
    return this.definition < other.definition
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

    // Sort: overlapping routes by specificity first, otherwise by path depth and alphabetically.
    entries.sort(([_keyA, routeA], [_keyB, routeB]) => {
      const partsA = getParts(routeA.definition)
      const partsB = getParts(routeB.definition)

      // 1. Overlapping routes: more specific first
      if (routeA.isMayBeSame(routeB)) {
        if (routeA.isMoreSpecificThan(routeB)) return -1
        if (routeB.isMoreSpecificThan(routeA)) return 1
      }

      // 2. Different non-overlapping depth: shorter first
      if (partsA.length !== partsB.length) {
        return partsA.length - partsB.length
      }

      // 3. Fallback: alphabetically for deterministic ordering
      return routeA.definition.localeCompare(routeB.definition)
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
export type AnyRoute<
  T extends Route0<string> | string = string,
  TSearch extends UnknownSearch = UnknownSearch,
> = T extends string ? Route0<T, TSearch> : T
/** Callable route (`route(input)`) plus route instance methods/properties. */
export type CallableRoute<
  T extends Route0<string> | string = string,
  TSearch extends UnknownSearch = UnknownSearch,
> = AnyRoute<T, TSearch> & AnyRoute<T, TSearch>['get']
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
export type ParamsDefinition<T extends AnyRoute | string> = T extends AnyRoute
  ? T['params']
  : T extends string
    ? _ParamsDefinition<T>
    : undefined

export type Extended<
  T extends AnyRoute | string | undefined,
  TSuffixDefinition extends string,
  TSearch extends UnknownSearch = UnknownSearch,
> = T extends AnyRoute
  ? Route0<PathExtended<T['definition'], TSuffixDefinition>, TSearch>
  : T extends string
    ? Route0<PathExtended<T, TSuffixDefinition>, TSearch>
    : T extends undefined
      ? Route0<TSuffixDefinition, TSearch>
      : never

export type IsAncestor<T extends AnyRoute | string, TAncestor extends AnyRoute | string> = _IsAncestor<
  Definition<T>,
  Definition<TAncestor>
>
export type IsDescendant<T extends AnyRoute | string, TDescendant extends AnyRoute | string> = _IsDescendant<
  Definition<T>,
  Definition<TDescendant>
>
export type IsSame<T extends AnyRoute | string, TExact extends AnyRoute | string> = _IsSame<
  Definition<T>,
  Definition<TExact>
>
export type IsSameParams<T1 extends AnyRoute | string, T2 extends AnyRoute | string> = _IsSameParams<
  ParamsDefinition<T1>,
  ParamsDefinition<T2>
>

export type HasParams<T extends AnyRoute | string> = keyof _ParamsDefinition<Definition<T>> extends never ? false : true
export type HasRequiredParams<T extends AnyRoute | string> =
  _RequiredParamKeys<Definition<T>> extends never ? false : true

export type ParamsOutput<T extends AnyRoute | string> = {
  [K in keyof ParamsDefinition<T>]: ParamsDefinition<T>[K] extends true ? string : string | undefined
}
export type ParamsInput<T extends AnyRoute | string = string> = _ParamsInput<Definition<T>>
export type IsParamsOptional<T extends AnyRoute | string> = HasRequiredParams<Definition<T>> extends true ? false : true
export type ParamsInputStringOnly<T extends AnyRoute | string = string> = _ParamsInputStringOnly<Definition<T>>

// location

export type LocationParams<TDefinition extends string> = {
  [K in keyof _ParamsDefinition<TDefinition>]: _ParamsDefinition<TDefinition>[K] extends true
    ? string
    : string | undefined
}

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
  // TODO: add flat0, and search is TSearch. searchParams remove, add searchString
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
  searchParams: UnknownSearch
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
  searchParams: UnknownSearch
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
  searchParams: UnknownSearch
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
  searchParams: UnknownSearch
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
  searchParams: UnknownSearch
  exact: false
  ancestor: false
  descendant: true
  unmatched: false
}
export type DescendantLocation<TRoute extends AnyRoute | string = AnyRoute | string> = _GeneralLocation &
  DescendantLocationState<TRoute>

export type UnknownSearch = Record<string, unknown>

/** It is when route not match at all, but params partially match. */
export type WeakDescendantLocationState<TRoute extends AnyRoute | string = AnyRoute | string> = {
  known: true
  route: Definition<TRoute>
  params: Partial<ParamsOutput<TRoute>>
  searchParams: UnknownSearch
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

export type _ParamsDefinition<TDefinition extends string> = _ExtractParamsDefinitionBySegments<
  _SplitPathSegments<Definition<TDefinition>>
>

export type _Simplify<T> = { [K in keyof T]: T[K] } & {}
export type _IfNoKeys<T extends object, TYes, TNo> = keyof T extends never ? TYes : TNo

export type _ParamsInput<TDefinition extends string> =
  _ParamsDefinition<TDefinition> extends infer TDef extends Record<string, boolean>
    ? _IfNoKeys<
        TDef,
        Record<never, never>,
        _Simplify<
          {
            [K in keyof TDef as TDef[K] extends true ? K : never]: string | number
          } & {
            [K in keyof TDef as TDef[K] extends false ? K : never]?: string | number | undefined
          }
        >
      >
    : Record<never, never>

export type _ParamsInputStringOnly<TDefinition extends string> =
  _ParamsDefinition<TDefinition> extends infer TDef extends Record<string, boolean>
    ? _IfNoKeys<
        TDef,
        Record<never, never>,
        _Simplify<
          {
            [K in keyof TDef as TDef[K] extends true ? K : never]: string
          } & {
            [K in keyof TDef as TDef[K] extends false ? K : never]?: string | undefined
          }
        >
      >
    : Record<never, never>

export type _SplitPathSegments<TPath extends string> = TPath extends ''
  ? []
  : TPath extends '/'
    ? []
    : TPath extends `/${infer Rest}`
      ? _SplitPathSegments<Rest>
      : TPath extends `${infer Segment}/${infer Rest}`
        ? Segment extends ''
          ? _SplitPathSegments<Rest>
          : [Segment, ..._SplitPathSegments<Rest>]
        : TPath extends ''
          ? []
          : [TPath]

export type _ParamDefinitionFromSegment<TSegment extends string> = TSegment extends `:${infer Name}?`
  ? { [K in Name]: false }
  : TSegment extends `:${infer Name}`
    ? { [K in Name]: true }
    : TSegment extends `${string}*?`
      ? { '*': false }
      : TSegment extends `${string}*`
        ? { '*': true }
        : Record<never, never>

export type _MergeParamDefinitions<A extends Record<string, boolean>, B extends Record<string, boolean>> = {
  [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never
}

export type _ExtractParamsDefinitionBySegments<TSegments extends string[]> = TSegments extends [
  infer Segment extends string,
  ...infer Rest extends string[],
]
  ? _MergeParamDefinitions<_ParamDefinitionFromSegment<Segment>, _ExtractParamsDefinitionBySegments<Rest>>
  : Record<never, never>

export type _RequiredParamKeys<TDefinition extends string> = {
  [K in keyof _ParamsDefinition<TDefinition>]: _ParamsDefinition<TDefinition>[K] extends true ? K : never
}[keyof _ParamsDefinition<TDefinition>]
export type ReplacePathParams<S extends string> = S extends `${infer Head}:${infer Tail}`
  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Tail extends `${infer _Param}/${infer Rest}`
    ? ReplacePathParams<`${Head}${string}/${Rest}`>
    : `${Head}${string}`
  : S
export type DedupeSlashes<S extends string> = S extends `${infer A}//${infer B}` ? DedupeSlashes<`${A}/${B}`> : S
export type EmptyRecord = Record<never, never>
export type JoinPath<Parent extends string, Suffix extends string> = DedupeSlashes<
  Definition<Parent> extends infer A extends string
    ? Definition<Suffix> extends infer B extends string
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

export type PathExtended<
  TSourceDefinitionDefinition extends string,
  TSuffixDefinitionDefinition extends string,
> = `${JoinPath<TSourceDefinitionDefinition, TSuffixDefinitionDefinition>}`

export type IsAny<T> = 0 extends 1 & T ? true : false

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

export type SchemaRoute0<
  TInput extends Record<string, unknown>,
  TOutput extends Record<string, unknown>,
> = StandardSchemaV1<TInput, TOutput> & {
  parse: (input: unknown) => TOutput
  safeParse: (input: unknown) => _SafeParseInputResult<TOutput>
}
