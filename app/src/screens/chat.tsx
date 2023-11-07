import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  Dimensions,
  FlatList,
  Keyboard,
  Share
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext, AppContext } from '../context'

export function Chat() {
  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
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
        >Chat</Text>
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