const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
}

const lightTheme = {
  textColor: colors.black,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.gray,
  highlightedTextColor: colors.white,
  backgroundColor: colors.white,
  placeholderTextColor: colors.gray,
  secondaryBackgroundColor: '#ebebeb',
  borderColor: 'rgba(0, 0, 0, .15)',
  tintColor: '#0281ff',
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.gray,
}

const darkTheme = {
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  highlightedTextColor: colors.black,
  backgroundColor: colors.black,
  laceholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: '#171717',
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: '#0281ff',
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
}


export {
  lightTheme, darkTheme
}