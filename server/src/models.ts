export type Provider = 'anthropic' | 'openai' | 'google' | 'zai' | 'moonshot'
export type AspectRatio = '1:1' | '3:2' | '2:3' | '16:9' | '9:16'

export interface ChatModel {
  name: string
  label: string
  provider: Provider
  modelId: string
  supportsVision: boolean
  description: string
  tier: 'Fast' | 'Balanced' | 'Deep'
  recommended?: boolean
}

export interface ImageModel {
  name: string
  label: string
  provider: Provider
  modelId: string
  description: string
  supportsEditing: boolean
  aspectRatios: AspectRatio[]
}

const chat = (
  label: string,
  name: string,
  provider: Provider,
  modelId: string,
  tier: ChatModel['tier'],
  description: string,
  supportsVision = true,
  recommended = false
): ChatModel => ({
  label,
  name,
  provider,
  modelId,
  tier,
  description,
  supportsVision,
  recommended
})

export const CHAT_MODELS: Record<string, ChatModel> = {
  claudeSonnet5: chat(
    'claudeSonnet5',
    'Claude Sonnet 5',
    'anthropic',
    'claude-sonnet-5',
    'Balanced',
    'A thoughtful everyday partner for writing and code.',
    true,
    true
  ),
  claudeOpus5: chat(
    'claudeOpus5',
    'Claude Opus 5',
    'anthropic',
    'claude-opus-5',
    'Deep',
    'Complex problems and ambitious projects.'
  ),
  claudeFable5: chat(
    'claudeFable5',
    'Claude Fable 5',
    'anthropic',
    'claude-fable-5',
    'Deep',
    'Long, demanding tasks with room to reason.'
  ),
  claudeHaiku: chat(
    'claudeHaiku',
    'Claude Haiku 4.5',
    'anthropic',
    'claude-haiku-4-5-20251001',
    'Fast',
    'Quick answers and lightweight tasks.'
  ),
  gpt55: chat(
    'gpt55',
    'GPT-5.5',
    'openai',
    'gpt-5.5-2026-04-23',
    'Deep',
    'Reasoning, coding, and professional work.'
  ),
  gpt54Mini: chat(
    'gpt54Mini',
    'GPT-5.4 mini',
    'openai',
    'gpt-5.4-mini-2026-03-17',
    'Fast',
    'An efficient choice for everyday questions.'
  ),
  geminiFlash: chat(
    'geminiFlash',
    'Gemini 3.5 Flash',
    'google',
    'gemini-3.5-flash',
    'Fast',
    'Fast, multimodal thinking for everyday work.'
  ),
  geminiPro: chat(
    'geminiPro',
    'Gemini 3.1 Pro',
    'google',
    'gemini-3.1-pro-preview',
    'Deep',
    'Complex reasoning and visual understanding. Preview.'
  ),
  glm52: chat('glm52', 'GLM 5.2', 'zai', 'glm-5.2', 'Deep', 'Long-context coding and engineering.', false),
  kimi26: chat(
    'kimi26',
    'Kimi K2.6',
    'moonshot',
    'kimi-k2.6',
    'Balanced',
    'Visual understanding and general assistance.'
  )
}

const legacy: Record<string, ChatModel> = {
  claudeOpus: chat(
    'claudeOpus',
    'Claude Opus 4.5',
    'anthropic',
    'claude-opus-4-5-20251101',
    'Deep',
    'Previous-generation model.'
  ),
  claudeOpus47: chat(
    'claudeOpus47',
    'Claude Opus 4.7',
    'anthropic',
    'claude-opus-4-7',
    'Deep',
    'Previous-generation model.'
  ),
  claudeSonnet: chat(
    'claudeSonnet',
    'Claude Sonnet 4.5',
    'anthropic',
    'claude-sonnet-4-5-20250929',
    'Balanced',
    'Previous-generation model.'
  ),
  claudeSonnet4: chat(
    'claudeSonnet4',
    'Claude Sonnet 4.6',
    'anthropic',
    'claude-sonnet-4-6',
    'Balanced',
    'Previous-generation model.'
  ),
  gpt52: chat('gpt52', 'GPT-5.2', 'openai', 'gpt-5.2-2025-12-11', 'Deep', 'Previous-generation model.'),
  gpt5Mini: chat(
    'gpt5Mini',
    'GPT-5 mini',
    'openai',
    'gpt-5-mini-2025-08-07',
    'Fast',
    'Previous-generation model.'
  ),
  gemini: chat(
    'gemini',
    'Gemini 3 Pro',
    'google',
    'gemini-3-pro-preview',
    'Deep',
    'Previous-generation preview.'
  ),
  kimiK27: chat('kimiK27', 'Kimi K2.7', 'moonshot', 'kimi-k2.7', 'Deep', 'Previous registry entry.', false)
}

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:2', '2:3', '16:9', '9:16']
export const IMAGE_MODELS: Record<string, ImageModel> = {
  nanoBanana2: {
    name: 'Nano Banana 2',
    label: 'nanoBanana2',
    provider: 'google',
    modelId: 'gemini-3.1-flash-image',
    description: 'A balance of speed, detail, and creative control.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  },
  nanoBananaPro: {
    name: 'Nano Banana Pro',
    label: 'nanoBananaPro',
    provider: 'google',
    modelId: 'gemini-3-pro-image',
    description: 'Precise compositions and complex visual ideas.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  },
  gptImage2: {
    name: 'GPT Image 2',
    label: 'gptImage2',
    provider: 'openai',
    modelId: 'gpt-image-2-2026-04-21',
    description: 'Detailed images, typography, and faithful edits.',
    supportsEditing: true,
    aspectRatios: ASPECT_RATIOS
  }
}

export const PROVIDER_ENV: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GEMINI_API_KEY',
  zai: 'ZAI_API_KEY',
  moonshot: 'MOONSHOT_API_KEY'
}

export function providerAvailable(provider: Provider): boolean {
  return !!process.env[PROVIDER_ENV[provider]]?.trim()
}

export function getChatModel(label: string): ChatModel | undefined {
  return Object.hasOwn(CHAT_MODELS, label)
    ? CHAT_MODELS[label]
    : Object.hasOwn(legacy, label)
      ? legacy[label]
      : undefined
}

export function getImageModel(label: string): ImageModel | undefined {
  if (label === 'nanoBanana')
    return { ...IMAGE_MODELS.nanoBanana2, label, modelId: 'gemini-2.5-flash-image', name: 'Nano Banana' }
  return Object.hasOwn(IMAGE_MODELS, label) ? IMAGE_MODELS[label] : undefined
}
