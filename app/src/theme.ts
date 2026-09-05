import { Theme } from '../types'

const fonts = {
  ultraLightFont: 'Geist-Regular',
  thinFont: 'Geist-Regular',
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Regular',
  mediumFont: 'Geist-Medium',
  semiBoldFont: 'Geist-SemiBold',
  boldFont: 'Geist-SemiBold',
  blackFont: 'Geist-SemiBold',
  ultraBlackFont: 'Geist-SemiBold'
}

const lightTheme: Theme = {
  ...fonts,
  name: 'Light',
  label: 'light',
  textColor: '#272B26',
  secondaryTextColor: '#FFFFFF',
  mutedForegroundColor: '#71756D',
  backgroundColor: '#FAFAF7',
  placeholderTextColor: '#7B8076',
  secondaryBackgroundColor: '#F0F1EB',
  surfaceColor: '#F1F2EC',
  elevatedColor: '#FFFFFF',
  accentSoft: '#E7EDDF',
  dangerColor: '#A13D36',
  successColor: '#4A6546',
  borderColor: '#E2E5DC',
  tintColor: '#465D3F',
  tintTextColor: '#FFFFFF',
  tabBarActiveTintColor: '#465D3F',
  tabBarInactiveTintColor: '#71756D',
  quoteBackgroundColor: '#F0F1EB',
  codeBorderColor: '#E2E5DC',
  statusBarStyle: 'dark'
}

const darkTheme: Theme = {
  ...lightTheme,
  name: 'Dark',
  label: 'dark',
  textColor: '#E8EBE3',
  secondaryTextColor: '#191D18',
  mutedForegroundColor: '#A0A79B',
  backgroundColor: '#171B17',
  placeholderTextColor: '#939B8D',
  secondaryBackgroundColor: '#232922',
  surfaceColor: '#1F241E',
  elevatedColor: '#252C23',
  accentSoft: '#303E2C',
  dangerColor: '#F3A69C',
  successColor: '#BDD4A7',
  borderColor: '#333B30',
  tintColor: '#BDD4A7',
  tintTextColor: '#202B1C',
  tabBarActiveTintColor: '#BDD4A7',
  tabBarInactiveTintColor: '#A0A79B',
  quoteBackgroundColor: '#232922',
  codeBorderColor: '#333B30',
  statusBarStyle: 'light'
}

const hackerNews: Theme = {
  ...lightTheme,
  name: 'Sand',
  label: 'hackerNews',
  tintColor: '#885439',
  accentSoft: '#F0E5DB'
}
const miami: Theme = {
  ...darkTheme,
  name: 'Rose',
  label: 'miami',
  tintColor: '#E2B6C2',
  accentSoft: '#3F2D35'
}
const vercel: Theme = {
  ...darkTheme,
  name: 'Mono',
  label: 'vercel',
  tintColor: '#E6E6E6',
  accentSoft: '#333333'
}
const cyberpunk = darkTheme
const matrix = darkTheme
const pink = lightTheme
const THEMES: Record<string, Theme> = { light: lightTheme, dark: darkTheme, hackerNews, miami, vercel }

function getTheme(label: string, systemColorScheme?: 'light' | 'dark' | 'unspecified' | null): Theme {
  if (label === 'system') return systemColorScheme === 'dark' ? darkTheme : lightTheme
  return THEMES[label] || lightTheme
}

export { lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix, pink, THEMES, getTheme }
