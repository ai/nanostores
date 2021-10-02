import { DeepReadonly, Ref } from 'vue'

import { Store } from '../map/index.js'

/**
 * Subscribe to store changes and get store’s value.
 *
 * ```html
 * <template>
 *   <home-view v-if="page.router === 'home'" />
 *   <error-404-view v-else />
 * </template>
 *
 * <script>
 * import { useStore } from 'nanostores/vue'
 *
 * import { router } from './router'
 *
 * export default {
 *   setup () {
 *     let page = useStore(router)
 *     return { page }
 *   }
 * }
 * </script>
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
export function useStore<Value extends any>(
  store: Store<Value>
): DeepReadonly<Ref<Type>>
