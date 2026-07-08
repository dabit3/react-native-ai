export type Provider = 'anthropic' | 'openai' | 'google' | 'zai' | 'moonshot'

export interface ChatModel {
  name: string
  label: string
  provider: Provider
  modelId: string
  supportsVision: boolean
}

export interface ImageModel {
  name: string
  label: string
  provider: Provider
  modelId: string
}

export const CHAT_MODELS: Record<string, ChatModel> = {
  claudeFable5: {
    name: 'Claude Fable 5',
    label: 'claudeFable5',
    provider: 'anthropic',
    modelId: 'claude-fable-5',
    supportsVision: true
  },
  claudeSonnet5: {
    name: 'Claude Sonnet 5',
    label: 'claudeSonnet5',
    provider: 'anthropic',
    modelId: 'claude-sonnet-5',
    supportsVision: true
  },
  claudeOpus47: {
    name: 'Claude Opus 4.7',
    label: 'claudeOpus47',
    provider: 'anthropic',
    modelId: 'claude-opus-4-7',
    supportsVision: true
  },
  claudeOpus: {
    name: 'Claude Opus',
    label: 'claudeOpus',
    provider: 'anthropic',
    modelId: 'claude-opus-4-5-20251101',
    supportsVision: true
  },
  claudeSonnet: {
    name: 'Claude Sonnet',
    label: 'claudeSonnet',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5-20250929',
    supportsVision: true
  },
  claudeHaiku: {
    name: 'Claude Haiku',
    label: 'claudeHaiku',
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    supportsVision: true
  },
  claudeSonnet4: {
    name: 'Claude Sonnet 4',
    label: 'claudeSonnet4',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6-20260201',
    supportsVision: true
  },
  gpt52: {
    name: 'GPT 5.2',
    label: 'gpt52',
    provider: 'openai',
    modelId: 'gpt-5.2-2025-12-11',
    supportsVision: true
  },
  gpt5Mini: {
    name: 'GPT 5 Mini',
    label: 'gpt5Mini',
    provider: 'openai',
    modelId: 'gpt-5-mini-2025-08-07',
    supportsVision: true
  },
  gemini: {
    name: 'Gemini',
    label: 'gemini',
    provider: 'google',
    modelId: 'gemini-3-pro-preview',
    supportsVision: true
  },
  glm52: {
    name: 'GLM 5.2',
    label: 'glm52',
    provider: 'zai',
    modelId: 'glm-5.2',
    supportsVision: false
  },
  kimiK27: {
    name: 'Kimi K2.7',
    label: 'kimiK27',
    provider: 'moonshot',
    modelId: 'kimi-k2.7',
    supportsVision: false
  }
}

export const IMAGE_MODELS: Record<string, ImageModel> = {
  nanoBanana: {
    name: 'Nano Banana (Gemini Flash Image)',
    label: 'nanoBanana',
    provider: 'google',
    modelId: 'gemini-2.5-flash-image'
  },
  nanoBananaPro: {
    name: 'Nano Banana Pro (Gemini 3 Pro)',
    label: 'nanoBananaPro',
    provider: 'google',
    modelId: 'gemini-3-pro-image-preview'
  }
}

export function getChatModel(label: string): ChatModel | undefined {
  return CHAT_MODELS[label]
}

export function getImageModel(label: string): ImageModel | undefined {
  return IMAGE_MODELS[label]
}
