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

  static overrideMany<T extends Record<string, Route0<any, any, any, any>>>(
    routes: T,
    config: Route0.RouteConfigInput,
  ): T {
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
}

export namespace Route0 {
  export type Callable<T extends Route0<any, any, any, any>> = T & T['get']
  export type RouteConfigInput = {
    baseUrl?: string
  }
  export type Params<TRoute0 extends Route0<any, any, any, any>> = {
    [K in keyof TRoute0['paramsDefinition']]: string
  }
  export type Query<TRoute0 extends Route0<any, any, any, any>> = Partial<
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
}
