const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
}

const lightTheme = {
  name: 'Light',
  label: 'light',
  textColor: colors.black,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.gray,
  highlightedTextColor: colors.white,
  backgroundColor: colors.white,
  placeholderTextColor: colors.gray,
  secondaryBackgroundColor: '#ebebeb',
  borderColor: 'rgba(0, 0, 0, .15)',
  buttonTextColor: colors.white,
  tintColor: '#0281ff',
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.gray,
}

const darkTheme = {
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  highlightedTextColor: colors.black,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  laceholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: '#171717',
  borderColor: 'rgba(255, 255, 255, .2)',
  buttonTextColor: colors.white,
  tintColor: '#0281ff',
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
}

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
}


export {
  lightTheme, darkTheme, hackerNews
}