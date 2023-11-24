import { AnthropicIcon } from './src/components/AnthropicIcon'
import { CohereIcon } from './src/components/CohereIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'

export const DOMAIN = process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' ?
  process.env.EXPO_PUBLIC_DEV_API_URL :
  process.env.EXPO_PUBLIC_PROD_API_URL

export const MODELS = {
  gpt: { name: 'GPT 4', label: 'gpt', icon: OpenAIIcon },
  gptTurbo: { name: 'GPT Turbo', label: 'gptTurbo', icon: OpenAIIcon },
  claude: { name: 'Claude', label: 'claude', icon: AnthropicIcon },
  claudeInstant: { name: 'Claude Instant', label: 'claudeInstant', icon: AnthropicIcon },
  cohere: { name: 'Cohere', label: 'cohere', icon: CohereIcon },
  cohereWeb: { name: 'Cohere Web', label: 'cohereWeb', icon: CohereIcon }
}

export const IMAGE_MODELS = {
  fastImage: { name: 'Fast Image', label: 'fastImage' },
  removeBg:  { name: 'Remove Background', label: 'removeBg' }
}