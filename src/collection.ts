import { Route0, type AnyRoute, type RouteConfigInput } from './index.js'

export class Routes<T extends RoutesRecord> {
  private readonly routes: RoutesRecordHydrated<T>

  private constructor(routes: T, isHydrated?: boolean) {
    if (isHydrated) {
      this.routes = routes as unknown as RoutesRecordHydrated<T>
    } else {
      this.routes = Routes.hydrate(routes)
    }
  }

  static create<T extends RoutesRecord>(routes: T): RoutesPretty<T> {
    const result = new Routes(routes, false)
    Object.setPrototypeOf(result, Routes.prototype)
    Object.defineProperty(result, Symbol.toStringTag, {
      value: 'Routes',
    })
    Object.assign(result, {
      get: result.get.bind(result),
      override: result.override.bind(result),
    })
    Object.assign(result, result.routes)
    return result as unknown as RoutesPretty<T>
  }

  static hydrate<T extends RoutesRecord>(routes: T): RoutesRecordHydrated<T> {
    const result = {} as RoutesRecordHydrated<T>
    for (const key in routes) {
      if (Object.prototype.hasOwnProperty.call(routes, key)) {
        const value = routes[key]
        result[key] = (typeof value === 'string' ? Route0.create(value) : value) as AnyRoute<T[typeof key]>
      }
    }
    return result
  }

  get<TKey extends keyof T>(key: TKey): AnyRoute<T[TKey]> {
    return this.routes[key]
  }

  override(config: RouteConfigInput): Routes<T> {
    const newRoutes = {} as RoutesRecordHydrated<T>
    for (const key in this.routes) {
      if (Object.prototype.hasOwnProperty.call(this.routes, key)) {
        newRoutes[key] = this.routes[key].clone(config) as AnyRoute<T[typeof key]>
      }
    }
    return new Routes(newRoutes as unknown as T, true)
  }
}

export type RoutesRecord = Record<string, AnyRoute | string>
export type RoutesRecordHydrated<TRoutesRecord extends RoutesRecord> = {
  [K in keyof TRoutesRecord]: AnyRoute<TRoutesRecord[K]>
}
export type RoutesPretty<TRoutesRecord extends RoutesRecord> = RoutesRecordHydrated<TRoutesRecord> &
  Routes<TRoutesRecord>
