import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { KimiIcon } from './src/components/KimiIcon'

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

export const MODELS = {
  claudeOpus: {
    name: 'Claude Opus',
    label: 'claudeOpus',
    icon: AnthropicIcon
  },
  claudeSonnet: {
    name: 'Claude Sonnet',
    label: 'claudeSonnet',
    icon: AnthropicIcon
  },
  claudeHaiku: {
    name: 'Claude Haiku',
    label: 'claudeHaiku',
    icon: AnthropicIcon
  },
  claudeOpus4: {
    name: 'Claude Opus 4',
    label: 'claudeOpus4',
    icon: AnthropicIcon
  },
  claudeSonnet4: {
    name: 'Claude Sonnet 4',
    label: 'claudeSonnet4',
    icon: AnthropicIcon
  },
  gpt52: { name: 'GPT 5.2', label: 'gpt52', icon: OpenAIIcon },
  gpt5Mini: { name: 'GPT 5 Mini', label: 'gpt5Mini', icon: OpenAIIcon },
  gemini: { name: 'Gemini', label: 'gemini', icon: GeminiIcon },
  kimiK25: { name: 'Kimi K2.5', label: 'kimiK25', icon: KimiIcon },
}

export const IMAGE_MODELS = {
  nanoBanana: { name: 'Nano Banana (Gemini Flash Image)', label: 'nanoBanana' },
  nanoBananaPro: { name: 'Nano Banana Pro (Gemini 3 Pro)', label: 'nanoBananaPro' },
}
