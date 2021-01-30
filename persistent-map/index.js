import { LocalStore } from '../local-store/index.js'

let listeners = {}
function listener (e) {
  for (let prefix in listeners) {
    if (e.key.startsWith(prefix)) {
      let store = listeners[prefix]
      let prop = e.key.slice(prefix.length)
      store.changeKey(prop, localStorage[e.key])
      break
    }
  }
}

export class PersistentMap extends LocalStore {
  constructor () {
    super()
    if (process.env.NODE_ENV !== 'production') {
      if (!this.constructor.id) {
        throw new Error(`Set ${this.constructor.name}.id`)
      }
    }
    if (Object.keys(listeners).length === 0) {
      window.addEventListener('storage', listener)
    }
    let prefix = this.constructor.id + ':'
    listeners[prefix] = this
    Object.keys(localStorage)
      .filter(i => i.startsWith(prefix))
      .forEach(i => {
        this[i.slice(prefix.length)] = localStorage[i]
      })
  }

  change (key, value) {
    localStorage[this.constructor.id + ':' + key] = value
    this.changeKey(key, value)
  }

  remove (key) {
    localStorage.removeItem(this.constructor.id + ':' + key)
    this.changeKey(key, undefined)
  }

  destroy () {
    delete listeners[this.constructor.id + ':']
    if (Object.keys(listeners).length === 0) {
      window.removeEventListener('storage', listener)
    }
  }
}
