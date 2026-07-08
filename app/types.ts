import { ComponentType } from 'react'

export type Provider = 'anthropic' | 'openai' | 'google' | 'zai' | 'moonshot'

export interface Theme {
  name: string
  label: string
  textColor: string
  secondaryTextColor: string
  mutedForegroundColor: string
  backgroundColor: string
  placeholderTextColor: string
  secondaryBackgroundColor: string
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
  icon: ComponentType<any>
}

export interface ImageAttachment {
  uri: string
  mimeType: string
  base64?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: ImageAttachment
  error?: string
  model?: string
}

export interface IThemeContext {
  theme: Theme
  setTheme: (theme: string) => void
  themeName: string
}

export interface IAppContext {
  chatType: Model
  setChatType: (model: Model) => void
  handlePresentModalPress: () => void
  setImageModel: (model: string) => void
  imageModel: string
  closeModal: () => void
  models: Model[]
  systemPrompt: string
  setSystemPrompt: (prompt: string) => void
}
