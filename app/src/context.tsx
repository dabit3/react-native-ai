import { createContext, SetStateAction, Dispatch  } from 'react'
import { IMAGE_MODELS } from '../constants'

interface IThemeContext {
  theme: any
  setTheme: Dispatch<SetStateAction<string>>
  themeName: string
}

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

interface IAppContext {
  chatType: string
  setChatType: Dispatch<SetStateAction<string>>
  handlePresentModalPress: () => void
  setImageModel: Dispatch<SetStateAction<string>>
  imageModel: string
}

const AppContext = createContext<IAppContext>({
  chatType: '',
  setChatType: () => null,
  handlePresentModalPress: () => null,
  imageModel: IMAGE_MODELS.fastImage,
  setImageModel: () => null
})

export {
  ThemeContext, AppContext
}