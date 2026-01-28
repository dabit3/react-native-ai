import { createContext } from 'react'
import { IMAGE_MODELS, MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'

const ThemeContext = createContext<IThemeContext>({
  theme: {},
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
})

export {
  ThemeContext, AppContext
}