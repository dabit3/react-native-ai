import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GLMIcon } from './src/components/GLMIcon'
import { KimiIcon } from './src/components/KimiIcon'
import { Model, Provider } from './types'

const normalizeDomain = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  return `http://${value}`
}

const env = (process.env.EXPO_PUBLIC_ENV || 'DEVELOPMENT').toUpperCase()
const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL
const prodUrl = process.env.EXPO_PUBLIC_PROD_API_URL
const rawDomain = env === 'DEVELOPMENT' ? devUrl : prodUrl

export const DOMAIN = normalizeDomain(rawDomain || devUrl || prodUrl || '')

const PROVIDER_ICONS: Record<Provider, Model['icon']> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  google: GeminiIcon,
  zai: GLMIcon,
  moonshot: KimiIcon
}

export function getProviderIcon(provider: Provider): Model['icon'] {
  return PROVIDER_ICONS[provider] || GeminiIcon
}

export const MODELS: Record<string, Model> = {
  claudeFable5: {
    name: 'Claude Fable 5',
    label: 'claudeFable5',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeSonnet5: {
    name: 'Claude Sonnet 5',
    label: 'claudeSonnet5',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeOpus47: {
    name: 'Claude Opus 4.7',
    label: 'claudeOpus47',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeOpus: {
    name: 'Claude Opus',
    label: 'claudeOpus',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeSonnet: {
    name: 'Claude Sonnet',
    label: 'claudeSonnet',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeHaiku: {
    name: 'Claude Haiku',
    label: 'claudeHaiku',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  claudeSonnet4: {
    name: 'Claude Sonnet 4',
    label: 'claudeSonnet4',
    provider: 'anthropic',
    supportsVision: true,
    icon: AnthropicIcon
  },
  gpt52: {
    name: 'GPT 5.2',
    label: 'gpt52',
    provider: 'openai',
    supportsVision: true,
    icon: OpenAIIcon
  },
  gpt5Mini: {
    name: 'GPT 5 Mini',
    label: 'gpt5Mini',
    provider: 'openai',
    supportsVision: true,
    icon: OpenAIIcon
  },
  gemini: {
    name: 'Gemini',
    label: 'gemini',
    provider: 'google',
    supportsVision: true,
    icon: GeminiIcon
  },
  glm52: {
    name: 'GLM 5.2',
    label: 'glm52',
    provider: 'zai',
    supportsVision: false,
    icon: GLMIcon
  },
  kimiK27: {
    name: 'Kimi K2.7',
    label: 'kimiK27',
    provider: 'moonshot',
    supportsVision: false,
    icon: KimiIcon
  }
}

export const IMAGE_MODELS = {
  nanoBanana: { name: 'Nano Banana (Gemini Flash Image)', label: 'nanoBanana' },
  nanoBananaPro: { name: 'Nano Banana Pro (Gemini 3 Pro)', label: 'nanoBananaPro' },
}

export const PROMPT_SUGGESTIONS = [
  'Explain a concept like I am five',
  'Help me brainstorm project ideas',
  'Write a short story about space travel',
  'Summarize the plot of a classic novel'
]

/**
 * Fetches the model registry from the server so the server remains the
 * single source of truth. Falls back to the local constants when offline.
 */
export async function fetchModels(): Promise<Model[]> {
  const fallback = Object.values(MODELS)
  if (!DOMAIN) return fallback
  try {
    const res = await fetch(`${DOMAIN}/models`)
    if (!res.ok) return fallback
    const data = await res.json()
    if (!Array.isArray(data.chatModels) || !data.chatModels.length) return fallback
    return data.chatModels.map((m: any) => ({
      name: m.name,
      label: m.label,
      provider: m.provider,
      supportsVision: !!m.supportsVision,
      icon: getProviderIcon(m.provider)
    }))
  } catch {
    return fallback
  }
}
