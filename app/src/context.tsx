import { createContext } from 'react'
import { IMAGE_MODELS, MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'
import { lightTheme } from './theme'

const ThemeContext = createContext<IThemeContext>({
  theme: lightTheme,
  setTheme: () => null,
  themeName: ''
})

const AppContext = createContext<IAppContext>({
  chatType: MODELS.claudeOpus,
  imageModel: IMAGE_MODELS.nanoBanana.label,
  setChatType: () => null,
  handlePresentModalPress: () => null,
  setImageModel: () => null,
  closeModal: () => null,
  models: Object.values(MODELS),
  systemPrompt: '',
  setSystemPrompt: () => null,
})

export {
  ThemeContext, AppContext
}
