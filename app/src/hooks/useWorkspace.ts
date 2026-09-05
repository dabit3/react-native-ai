import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Conversation } from '../../types'
import { AppContext } from '../context'
import { isConversation, migrateLegacyChats } from '../conversations'

const KEY = 'rnai-conversations-v2'

export function useWorkspace() {
  const { notify } = useContext(AppContext)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const writable = useRef(true)
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let mounted = true
    AsyncStorage.multiGet([KEY, 'rnai-chats-v1'])
      .then(([current, legacy]) => {
        if (!mounted) return
        if (current[1]) {
          const data: unknown = JSON.parse(current[1])
          if (!Array.isArray(data) || !data.every(isConversation))
            throw new Error('Invalid saved conversations')
          setConversations(data)
        } else if (legacy[1]) setConversations(migrateLegacyChats(JSON.parse(legacy[1])))
      })
      .catch(() => {
        writable.current = false
        notify('Saved conversations could not be read. The original data will not be overwritten.')
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
    const data = JSON.stringify(conversations)
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, data))
      .catch(() => notify('This conversation could not be saved. Export it before you close the app.'))
  }, [conversations, hydrated, notify])

  const save = useCallback((conversation: Conversation) => {
    setConversations((current) =>
      [conversation, ...current.filter((c) => c.id !== conversation.id)].sort(
        (a, b) => b.updatedAt - a.updatedAt
      )
    )
  }, [])
  const remove = useCallback((id: string) => {
    setConversations((current) => current.filter((c) => c.id !== id))
    setActiveId((current) => (current === id ? null : current))
  }, [])
  const rename = useCallback((id: string, title: string) => {
    if (!title.trim()) return
    setConversations((current) =>
      current.map((c) => (c.id === id ? { ...c, title: title.trim().slice(0, 72) } : c))
    )
  }, [])

  return { conversations, activeId, setActiveId, hydrated, save, remove, rename }
}
