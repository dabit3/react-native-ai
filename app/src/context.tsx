import { createContext } from 'react'
import { IMAGE_MODELS, MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'
import { lightTheme } from './theme'

export const ThemeContext = createContext<IThemeContext>({
  theme: lightTheme,
  setTheme: () => undefined,
  themeName: 'system'
})

export const AppContext = createContext<IAppContext>({
  chatType: MODELS.claudeSonnet5,
  imageModel: IMAGE_MODELS.nanoBanana2.label,
  setChatType: () => undefined,
  handlePresentModalPress: () => undefined,
  setImageModel: () => undefined,
  closeModal: () => undefined,
  models: Object.values(MODELS),
  imageModels: Object.values(IMAGE_MODELS),
  systemPrompt: '',
  setSystemPrompt: () => undefined,
  apiUrl: '',
  token: '',
  setConnection: () => undefined,
  connection: 'unconfigured',
  refreshModels: async () => undefined,
  notify: () => undefined
})
