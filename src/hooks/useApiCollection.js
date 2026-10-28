import { useEffect, useState } from 'react'
import { fetchCollection } from '../utils/api'

export default function useApiCollection(path, validateItem) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ path, status: 'loading', data: [], error: '', revision: 0 })

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchCollection(path, { validateItem, signal: controller.signal }).then(
      (data) => {
        if (active) setState({ path, status: 'success', data, error: '', revision: version })
      },
      (error) => {
        if (active && !controller.signal.aborted) {
          setState({ path, status: 'error', data: [], error: error.message, revision: version })
        }
      },
    )
    return () => {
      active = false
      controller.abort()
    }
  }, [path, validateItem, version])

  function reload() {
    setState((current) => ({ ...current, path, status: 'loading', data: [], error: '' }))
    setVersion((current) => current + 1)
  }

  // A new filter must not briefly display results belonging to the previous request.
  return state.path === path
    ? { ...state, reload }
    : {
        status: 'loading',
        data: [],
        error: '',
        revision: version,
        reload,
      }
}
