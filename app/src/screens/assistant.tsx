import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native'
import { useContext, useState } from 'react'
import { ThemeContext, AppContext } from '../context'

export function Assistant() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <View>
        <Text
          style={styles.mainText}
        >Assistant</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const getStyles = theme => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  mainText: {
    fontFamily: 'Geist-Regular'
  },
})