import '@testing-library/jest-dom/extend-expect'
import { h, FunctionalComponent as FC } from 'preact'
import PreactTesting from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { delay } from 'nanodelay'

import { STORE_UNMOUNT_DELAY, mapTemplate, atom, map, mount } from '../index.js'
import { useStore } from './index.js'

let { render, screen, act } = PreactTesting

function getCatcher(cb: () => void): [string[], FC] {
  let errors: string[] = []
  let Catcher: FC = () => {
    try {
      cb()
    } catch (e) {
      if (e instanceof Error) errors.push(e.message)
    }
    return null
  }
  return [errors, Catcher]
}

it('throws on builder instead of store', () => {
  let Test = (): void => {}
  let [errors, Catcher] = getCatcher(() => {
    // @ts-expect-error
    useStore(Test, 'ID')
  })
  render(h(Catcher, null))
  expect(errors).toEqual([
    'Use useStore(Builder(id)) or useSync() ' +
      'from @logux/client/preact for builders'
  ])
})

it('renders simple store', async () => {
  let events: string[] = []
  let renders = 0

  let letter = atom<string>()

  mount(letter, () => {
    events.push('constructor')
    letter.set('a')
    return () => {
      events.push('destroy')
    }
  })

  let Test1: FC = () => {
    renders += 1
    let value = useStore(letter)
    return h('div', { 'data-testid': 'test1' }, value)
  }

  let Test2: FC = () => {
    let value = useStore(letter)
    return h('div', { 'data-testid': 'test2' }, value)
  }

  let Wrapper: FC = () => {
    let [show, setShow] = useState<boolean>(true)
    return h(
      'div',
      {},
      h('button', {
        onClick: () => {
          setShow(false)
        }
      }),
      show && h(Test1, null),
      show && h(Test2, null)
    )
  }

  render(h(Wrapper, null))
  expect(events).toEqual(['constructor'])
  expect(screen.getByTestId('test1')).toHaveTextContent('a')
  expect(screen.getByTestId('test2')).toHaveTextContent('a')
  expect(renders).toEqual(1)

  await act(async () => {
    letter.set('b')
    letter.set('c')
    await delay(1)
  })

  expect(screen.getByTestId('test1')).toHaveTextContent('c')
  expect(screen.getByTestId('test2')).toHaveTextContent('c')
  expect(renders).toEqual(2)

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(renders).toEqual(2)
  await delay(STORE_UNMOUNT_DELAY)

  expect(events).toEqual(['constructor', 'destroy'])
})

it('does not reload store on component changes', async () => {
  let destroyed = ''
  let simple = atom<string>()

  mount(simple, () => {
    simple.set('S')
    return () => {
      destroyed += 'S'
    }
  })

  let Map = mapTemplate<{ id: string }>((store, id) => {
    return () => {
      destroyed += id
    }
  })

  let TestA: FC = () => {
    let simpleValue = useStore(simple)
    let { id } = useStore(Map('M'))
    return h('div', { 'data-testid': 'test' }, `1 ${simpleValue} ${id}`)
  }

  let TestB: FC = () => {
    let simpleValue = useStore(simple)
    let { id } = useStore(Map('M'))
    return h('div', { 'data-testid': 'test' }, `2 ${simpleValue} ${id}`)
  }

  let Switcher: FC = () => {
    let [state, setState] = useState<'a' | 'b' | 'none'>('a')
    if (state === 'a') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('b')
          }
        }),
        h(TestA, null)
      )
    } else if (state === 'b') {
      return h(
        'div',
        {},
        h('button', {
          onClick: () => {
            setState('none')
          }
        }),
        h(TestB, null)
      )
    } else {
      return null
    }
  }

  render(h(Switcher, null))
  expect(screen.getByTestId('test')).toHaveTextContent('1 S M')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.getByTestId('test')).toHaveTextContent('2 S M')
  expect(destroyed).toEqual('')

  act(() => {
    screen.getByRole('button').click()
  })
  expect(screen.queryByTestId('test')).not.toBeInTheDocument()
  expect(destroyed).toEqual('')

  await delay(STORE_UNMOUNT_DELAY)
  expect(destroyed).toEqual('SM')
})

it('has keys option', async () => {
  type MapStore = {
    a?: string
    b?: string
  }
  let Wrapper: FC = ({ children }) => h('div', {}, children)
  let mapSore = map<MapStore>()
  let renderCount = 0
  let MapTest: FC = () => {
    renderCount++
    let [keys, setKeys] = useState<(keyof MapStore)[]>(['a'])
    let { a, b } = useStore(mapSore, { keys })
    return h(
      'div',
      { 'data-testid': 'map-test' },
      h('button', {
        onClick: () => {
          setKeys(['a', 'b'])
        }
      }),
      `map:${a}-${b}`
    )
  }

  render(h(Wrapper, {}, h(MapTest, {})))

  expect(screen.getByTestId('map-test')).toHaveTextContent(
    'map:undefined-undefined'
  )
  expect(renderCount).toBe(1)

  // updates on init
  await act(async () => {
    mapSore.notify(undefined as unknown as keyof MapStore)
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent(
    'map:undefined-undefined'
  )
  expect(renderCount).toBe(2)

  // updates when has key
  await act(async () => {
    mapSore.setKey('a', 'a')
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-undefined')
  expect(renderCount).toBe(3)

  // does not update when has no key
  await act(async () => {
    mapSore.setKey('b', 'b')
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-undefined')
  expect(renderCount).toBe(3)

  // reacts on parameter changes
  await act(async () => {
    screen.getByRole('button').click()
    await delay(1)
  })

  expect(screen.getByTestId('map-test')).toHaveTextContent('map:a-b')
  expect(renderCount).toBe(4)
})
