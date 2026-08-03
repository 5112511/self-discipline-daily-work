import { useSyncExternalStore } from 'react'
import { store, type AppData } from './store'

export function useStore(): AppData {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
