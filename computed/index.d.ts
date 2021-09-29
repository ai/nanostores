import { ReadableStore, StoreValue } from '../atom/index.js'

type StoreValues<Stores extends ReadableStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

interface Computed {
  <Value extends any, OriginStore extends ReadableStore>(
    stores: OriginStore,
    cb: (value: StoreValue<OriginStore>) => Value
  ): ReadableStore<Value>
  <Value extends any, OriginStores extends ReadableStore[]>(
    stores: [...OriginStores],
    cb: (...values: StoreValues<OriginStores>) => Value
  ): ReadableStore<Value>
}

/**
 * Create derived store, which use generates value from another stores.
 *
 * ```js
 * import { computed } from 'nanostores'
 *
 * import { users } from './users.js'
 *
 * export const admins = computed(users, list => {
 *   return list.filter(user => user.isAdmin)
 * })
 * ```
 */
export const computed: Computed