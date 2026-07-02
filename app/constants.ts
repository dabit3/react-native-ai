import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GLMIcon } from './src/components/GLMIcon'
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
  claudeFable5: {
    name: 'Claude Fable 5',
    label: 'claudeFable5',
    icon: AnthropicIcon
  },
  claudeSonnet5: {
    name: 'Claude Sonnet 5',
    label: 'claudeSonnet5',
    icon: AnthropicIcon
  },
  claudeOpus47: {
    name: 'Claude Opus 4.7',
    label: 'claudeOpus47',
    icon: AnthropicIcon
  },
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
  claudeSonnet4: {
    name: 'Claude Sonnet 4',
    label: 'claudeSonnet4',
    icon: AnthropicIcon
  },
  gpt55: { name: 'GPT 5.5', label: 'gpt55', icon: OpenAIIcon },
  gpt52: { name: 'GPT 5.2', label: 'gpt52', icon: OpenAIIcon },
  gpt5Mini: { name: 'GPT 5 Mini', label: 'gpt5Mini', icon: OpenAIIcon },
  gemini: { name: 'Gemini', label: 'gemini', icon: GeminiIcon },
  glm52: { name: 'GLM 5.2', label: 'glm52', icon: GLMIcon },
  kimiK27: { name: 'Kimi K2.7', label: 'kimiK27', icon: KimiIcon },
}

export const IMAGE_MODELS = {
  nanoBanana: { name: 'Nano Banana (Gemini Flash Image)', label: 'nanoBanana' },
  nanoBananaPro: { name: 'Nano Banana Pro (Gemini 3 Pro)', label: 'nanoBananaPro' },
}
