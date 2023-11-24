import { createContext } from 'react'
import { IMAGE_MODELS } from '../constants'
import { IThemeContext, IAppContext } from '../types'
import { MODELS, ILLUSION_DIFFUSION_IMAGES} from '../constants'

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

const AppContext = createContext<IAppContext>({
  chatType: MODELS.gptTurbo,
  setChatType: () => null,
  handlePresentModalPress: () => null,
  imageModel: IMAGE_MODELS.fastImage.name,
  setImageModel: () => null,
  closeModal: () => null,
  illusionImage: ILLUSION_DIFFUSION_IMAGES.tinyCheckers.label,
  setIllusionImage: () => null
})

export {
  ThemeContext, AppContext
}