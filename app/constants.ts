export const DOMAIN = process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' ?
  process.env.EXPO_PUBLIC_DEV_API_URL :
  process.env.EXPO_PUBLIC_PROD_API_URL

export const CHAT_TYPES = {
  gpt: 'gpt',
  gptTurbo: 'gptTurbo',
  claude: 'claude',
  claudeInstant: 'claudeInstant',
  cohere: 'cohere',
}