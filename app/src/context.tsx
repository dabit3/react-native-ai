import { createContext } from 'react'
import { IMAGE_MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'
import { MODELS } from '../constants'

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

const AppContext = createContext<IAppContext>({
  chatType: MODELS.gptTurbo,
  setChatType: () => null,
  handlePresentModalPress: () => null,
  imageModel: IMAGE_MODELS.fastImage,
  setImageModel: () => null
})

export {
  ThemeContext, AppContext
}