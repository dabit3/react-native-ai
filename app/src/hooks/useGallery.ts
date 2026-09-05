import { useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Creation } from '../../types'
import { AppContext } from '../context'

const KEY = 'rnai-gallery-v2'

export function useGallery() {
  const { notify } = useContext(AppContext)
  const [creations, setCreations] = useState<Creation[]>([])
  const [hydrated, setHydrated] = useState(false)
  const writable = useRef(true)
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let mounted = true
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (!mounted || !value) return
        const data: unknown = JSON.parse(value)
        if (
          !Array.isArray(data) ||
          !data.every(
            (c) =>
              typeof c.id === 'string' &&
              typeof c.prompt === 'string' &&
              typeof c.modelName === 'string' &&
              typeof c.image?.id === 'string' &&
              typeof c.image?.mimeType === 'string' &&
              typeof c.image?.uri === 'string'
          )
        )
          throw new Error('Invalid gallery')
        setCreations(data)
      })
      .catch(() => {
        writable.current = false
        notify('Your saved gallery could not be read. The original data will not be overwritten.')
      })
      .finally(() => {
        if (mounted) setHydrated(true)
      })
    return () => {
      mounted = false
    }
  }, [notify])

  useEffect(() => {
    if (!hydrated || !writable.current) return
    const value = JSON.stringify(creations)
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, value))
      .catch(() =>
        notify('Gallery details could not be saved. Download your image before you close the app.')
      )
  }, [creations, hydrated, notify])

  return { creations, setCreations, hydrated }
}
