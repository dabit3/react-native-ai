import { ComponentType } from 'react'

export type Provider = 'anthropic' | 'openai' | 'google' | 'zai' | 'moonshot'
export type ModelTier = 'Fast' | 'Balanced' | 'Deep'
export type AspectRatio = '1:1' | '3:2' | '2:3' | '16:9' | '9:16'
export type Screen = 'Chat' | 'Images' | 'Settings'

export interface Theme {
  name: string
  label: string
  textColor: string
  secondaryTextColor: string
  mutedForegroundColor: string
  backgroundColor: string
  placeholderTextColor: string
  secondaryBackgroundColor: string
  surfaceColor: string
  elevatedColor: string
  accentSoft: string
  dangerColor: string
  successColor: string
  borderColor: string
  tintColor: string
  tintTextColor: string
  tabBarActiveTintColor: string
  tabBarInactiveTintColor: string
  quoteBackgroundColor: string
  codeBorderColor: string
  statusBarStyle: 'light' | 'dark'
  regularFont: string
  lightFont: string
  mediumFont: string
  semiBoldFont: string
  boldFont: string
  blackFont: string
  thinFont: string
  ultraLightFont: string
  ultraBlackFont: string
}

export interface IconProps {
  size?: number
  theme: Theme
  selected?: boolean
  color?: string
  style?: object
  fill?: string
}

export interface IIconProps {
  type: string
  props: any
}

export interface Model {
  name: string
  label: string
  provider: Provider
  supportsVision: boolean
  description: string
  tier: ModelTier
  available?: boolean
  recommended?: boolean
  icon: ComponentType<any>
}

export interface ImageModel {
  name: string
  label: string
  provider: Provider
  description: string
  available?: boolean
  supportsEditing: boolean
  aspectRatios: AspectRatio[]
}

export interface ImageAttachment {
  id: string
  uri: string
  mimeType: string
  name?: string
  width?: number
  height?: number
  base64?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: ImageAttachment[]
  image?: ImageAttachment
  error?: string
  model?: string
  stopped?: boolean
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface Creation {
  id: string
  prompt: string
  model: string
  modelName: string
  image: ImageAttachment
  aspectRatio: AspectRatio
  createdAt: number
}

export interface IThemeContext {
  theme: Theme
  setTheme: (theme: string) => void
  themeName: string
}

export interface IAppContext {
  chatType: Model
  setChatType: (model: Model) => void
  handlePresentModalPress: (mode?: 'chat' | 'image') => void
  setImageModel: (model: string) => void
  imageModel: string
  closeModal: () => void
  models: Model[]
  imageModels: ImageModel[]
  systemPrompt: string
  setSystemPrompt: (prompt: string) => void
  apiUrl: string
  token: string
  setConnection: (url: string, token: string) => void
  connection: 'checking' | 'connected' | 'offline' | 'unconfigured'
  refreshModels: () => Promise<void>
  notify: (message: string) => void
}
