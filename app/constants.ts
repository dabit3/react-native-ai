import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GLMIcon } from './src/components/GLMIcon'
import { KimiIcon } from './src/components/KimiIcon'
import { AspectRatio, ImageModel, Model, Provider } from './types'

export const normalizeDomain = (value = '') => {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (trimmed.includes('://') && !/^https?:\/\//i.test(trimmed))
    throw new Error('Use an HTTP or HTTPS server address.')
  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Enter an HTTP or HTTPS server address without credentials or query parameters.')
  }
  return url.toString().replace(/\/+$/, '')
}

const env = (process.env.EXPO_PUBLIC_ENV || 'DEVELOPMENT').toUpperCase()
const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL
const prodUrl = process.env.EXPO_PUBLIC_PROD_API_URL
export const DOMAIN = (() => {
  try {
    return normalizeDomain((env === 'DEVELOPMENT' ? devUrl : prodUrl) || '')
  } catch {
    return ''
  }
})()

export const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  zai: 'Z.ai',
  moonshot: 'Moonshot'
}

export const PROVIDER_ICONS: Record<Provider, Model['icon']> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  google: GeminiIcon,
  zai: GLMIcon,
  moonshot: KimiIcon
}

export function getProviderIcon(provider: Provider): Model['icon'] {
  return PROVIDER_ICONS[provider] || GeminiIcon
}

const model = (
  label: string,
  name: string,
  provider: Provider,
  tier: Model['tier'],
  description: string,
  supportsVision = true,
  recommended = false
): Model => ({
  label,
  name,
  provider,
  tier,
  description,
  supportsVision,
  recommended,
  icon: getProviderIcon(provider)
})

export const MODELS: Record<string, Model> = {
  claudeSonnet5: model(
    'claudeSonnet5',
    'Claude Sonnet 5',
    'anthropic',
    'Balanced',
    'A thoughtful everyday partner for writing and code.',
    true,
    true
  ),
  claudeOpus5: model(
    'claudeOpus5',
    'Claude Opus 5',
    'anthropic',
    'Deep',
    'Complex problems and ambitious projects.'
  ),
  claudeFable5: model(
    'claudeFable5',
    'Claude Fable 5',
    'anthropic',
    'Deep',
    'Long, demanding tasks with room to reason.'
  ),
  claudeHaiku: model(
    'claudeHaiku',
    'Claude Haiku 4.5',
    'anthropic',
    'Fast',
    'Quick answers and lightweight tasks.'
  ),
  gpt55: model('gpt55', 'GPT-5.5', 'openai', 'Deep', 'Reasoning, coding, and professional work.'),
  gpt54Mini: model(
    'gpt54Mini',
    'GPT-5.4 mini',
    'openai',
    'Fast',
    'An efficient choice for everyday questions.'
  ),
  geminiFlash: model(
    'geminiFlash',
    'Gemini 3.5 Flash',
    'google',
    'Fast',
    'Fast, multimodal thinking for everyday work.'
  ),
  geminiPro: model(
    'geminiPro',
    'Gemini 3.1 Pro',
    'google',
    'Deep',
    'Complex reasoning and visual understanding. Preview.'
  ),
  glm52: model('glm52', 'GLM 5.2', 'zai', 'Deep', 'Long-context coding and engineering.', false),
  kimi26: model('kimi26', 'Kimi K2.6', 'moonshot', 'Balanced', 'Visual understanding and general assistance.')
}

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:2', '2:3', '16:9', '9:16']
export const IMAGE_MODELS: Record<string, ImageModel> = {
  nanoBanana2: {
    name: 'Nano Banana 2',
    label: 'nanoBanana2',
    provider: 'google',
    description: 'A balance of speed, detail, and creative control.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  },
  nanoBananaPro: {
    name: 'Nano Banana Pro',
    label: 'nanoBananaPro',
    provider: 'google',
    description: 'Precise compositions and complex visual ideas.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  },
  gptImage2: {
    name: 'GPT Image 2',
    label: 'gptImage2',
    provider: 'openai',
    description: 'Detailed images, typography, and faithful edits.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  }
}

export const PROMPT_SUGGESTIONS = [
  {
    icon: 'sunny-outline' as const,
    title: 'Find a fresh perspective',
    subtitle: 'Make room for a new idea',
    prompt: 'Help me explore an idea from a fresh perspective. Start by asking what I am working on.'
  },
  {
    icon: 'create-outline' as const,
    title: 'Make the words work',
    subtitle: 'Write something that sounds like you',
    prompt: 'Help me write something clear and natural. Ask me about the audience and what I want to say.'
  },
  {
    icon: 'code-slash-outline' as const,
    title: 'Build something useful',
    subtitle: 'A thought, a plan, a first prototype',
    prompt: 'Help me turn a project idea into a practical plan. Ask me what I want to build.'
  },
  {
    icon: 'scan-outline' as const,
    title: 'Look a little closer',
    subtitle: 'Bring an image into the conversation',
    prompt: 'Help me understand this image. Describe what stands out and what I might have missed.',
    attach: true
  }
]

/**
 * Fetches the model registry from the server so the server remains the
 * single source of truth. Falls back to the local constants when offline.
 */
export async function fetchModels(
  url = DOMAIN,
  signal?: AbortSignal
): Promise<{ models: Model[]; imageModels: ImageModel[]; connected: boolean }> {
  const fallback = {
    models: Object.values(MODELS),
    imageModels: Object.values(IMAGE_MODELS),
    connected: false
  }
  if (!url) return fallback
  try {
    const res = await fetch(`${normalizeDomain(url)}/models`, { signal })
    if (!res.ok) return fallback
    const data = await res.json()
    const providers = Object.keys(PROVIDER_NAMES)
    const valid = (m: Model) =>
      typeof m.name === 'string' && typeof m.label === 'string' && providers.includes(m.provider)
    if (
      !Array.isArray(data.chatModels) ||
      !data.chatModels.length ||
      !data.chatModels.every(valid) ||
      !Array.isArray(data.imageModels)
    )
      return fallback
    return {
      models: data.chatModels.map((m: Model) => ({ ...m, icon: getProviderIcon(m.provider) })),
      imageModels: data.imageModels.filter(valid),
      connected: true
    }
  } catch {
    return fallback
  }
}
