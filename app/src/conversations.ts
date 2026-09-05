import type { ChatMessage, Conversation } from '../types'

export function conversationTitle(messages: ChatMessage[]): string {
  const text = messages.find((message) => message.role === 'user')?.content.trim()
  return text ? text.replace(/\s+/g, ' ').slice(0, 72) : 'An image conversation'
}

export function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false
  const c = value as Conversation
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.model === 'string' &&
    Number.isFinite(c.createdAt) &&
    Number.isFinite(c.updatedAt) &&
    Array.isArray(c.messages) &&
    c.messages.every(
      (m) =>
        !!m &&
        typeof m.id === 'string' &&
        ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' &&
        (!m.error || typeof m.error === 'string') &&
        (!m.model || typeof m.model === 'string') &&
        (!m.images ||
          (Array.isArray(m.images) &&
            m.images.every(
              (i) =>
                !!i && typeof i.id === 'string' && typeof i.uri === 'string' && typeof i.mimeType === 'string'
            )))
    )
  )
}

export function migrateLegacyChats(value: unknown): Conversation[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value).flatMap(([model, entries], index) => {
    if (!Array.isArray(entries)) return []
    const messages: ChatMessage[] = entries
      .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .map((m, i) => ({
        id: `legacy-${index}-${i}`,
        role: m.role,
        content: m.content,
        model: m.model || model,
        ...(m.error ? { error: String(m.error) } : {}),
        ...(m.image?.uri ? { images: [{ ...m.image, id: `legacy-image-${index}-${i}` }] } : {})
      }))
    if (!messages.length) return []
    return [
      {
        id: `legacy-${model}`,
        title: conversationTitle(messages),
        model,
        messages,
        createdAt: index,
        updatedAt: index
      }
    ]
  })
}

export function getContextMessages(messages: ChatMessage[]): { messages: ChatMessage[]; trimmed: boolean } {
  const valid = messages.filter((m) => !m.error && (m.content.trim() || m.images?.length))
  let start = valid.length
  let characters = 0
  while (start > 0 && valid.length - start < 80) {
    const next = valid[start - 1]
    if (characters + next.content.length > 100000) break
    characters += next.content.length
    start--
  }
  while (start < valid.length && valid[start].role !== 'user') start++
  return { messages: valid.slice(start), trimmed: start > 0 }
}

export function transcript(conversation: Conversation): string {
  return `# ${conversation.title}\n\n${conversation.messages.map((m) => `## ${m.role === 'user' ? 'You' : m.model || 'Assistant'}\n\n${m.content}${m.images?.length ? `\n\n[${m.images.length} attached image(s)]` : ''}${m.error ? `\n\nError: ${m.error}` : ''}`).join('\n\n')}`
}
