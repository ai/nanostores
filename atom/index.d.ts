type ReadonlyIfObject<Value> = Value extends object ? Readonly<Value> : Value

/**
 * Store object.
 */
export interface ReadableStore<Value = any> {
  /**
   * Low-level access to store’s value. Can be empty without listeners.
   * It is better to always use {@link getValue}.
   */
  value: Value | undefined

  /**
   * Subscribe to store changes and call listener immediately.
   *
   * ```
   * import { router } from '../store'
   *
   * router.subscribe(page => {
   *   console.log(page)
   * })
   * ```
   *
   * @param listener Callback with store value.
   * @returns Function to remove listener.
   */
  subscribe(listener: (value: ReadonlyIfObject<Value>) => void): () => void

  /**
   * Subscribe to store changes.
   *
   * In contrast with {@link Store#subscribe} it do not call listener
   * immediately.
   *
   * @param listener Callback with store value.
   * @returns Function to remove listener.
   */
  listen(listener: (value: ReadonlyIfObject<Value>) => void): () => void

  /**
   * Get store value.
   *
   * ```js
   * store.get()
   * ```
   *
   * @param value Store value.
   */
  get(): Value
}

/**
 * Store with a way to manually change the value.
 */
export interface WritableStore<Value = any> extends ReadableStore<Value> {
  /**
   * Change store value.
   *
   * ```js
   * router.set({ path: location.pathname, page: parse(location.pathname) })
   * ```
   *
   * @param newValue New store value.
   */
  set(newValue: Value): void
}

/**
 * Create store with atomic value. It could be a string or an object, which you
 * will replace completly.
 *
 * If you want to change keys in the object inside store, use {@link map}.
 *
 * ```js
 * import { atom } from 'nanostores'
 *
 * function parse () {
 *   router.set({ path: location.pathname, page: parse(location.pathname) })
 * }
 *
 * export const router = atom(() => {
 *   parse()
 *   window.addEventListener('popstate', parse)
 *   return () => {
 *     window.removeEventListener('popstate', parse)
 *   }
 * })
 * ```
 *
 * @param init Initialize store and return store destructor.
 * @returns The store object with methods to subscribe.
 */
export function atom<Value>(state?: Value): WritableStore<Value>
