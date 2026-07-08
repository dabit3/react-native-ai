import {
  StyleSheet, View, Text, TouchableHighlight, TouchableOpacity
} from 'react-native'
import { useContext } from 'react'
import { Icon } from './Icon'
import { ThemeContext, AppContext } from '../../src/context'
import { FontAwesome5 as FontAwesome } from '@expo/vector-icons'
import { Theme } from '../../types'

export function Header() {
  const { theme } = useContext(ThemeContext)
  const {
    handlePresentModalPress,
    chatType
  } = useContext(AppContext)
  const styles = getStyles(theme)
  const ModelIcon = chatType.icon

  return (
    <View style={styles.container}>
      <Icon size={34} fill={theme.textColor} />
      <TouchableOpacity
        style={styles.modelPill}
        onPress={handlePresentModalPress}
        accessibilityRole="button"
        accessibilityLabel={`Current model: ${chatType.name}. Tap to change model.`}
      >
        <ModelIcon size={14} theme={theme} />
        <Text style={styles.modelPillText} numberOfLines={1}>
          {chatType.name}
        </Text>
      </TouchableOpacity>
      <TouchableHighlight
        style={styles.buttonContainer}
        underlayColor={'transparent'}
        activeOpacity={0.6}
        onPress={handlePresentModalPress}
        accessibilityRole="button"
        accessibilityLabel="Open model selector"
      >
        <FontAwesome
          name="ellipsis-h"
          size={20}
          color={theme.textColor}
        />
      </TouchableHighlight>
    </View>
  )
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    buttonContainer: {
      position: 'absolute', right: 15,
      padding: 15
    },
    modelPill: {
      position: 'absolute',
      left: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 99,
      paddingVertical: 6,
      paddingHorizontal: 12,
      maxWidth: 170
    },
    modelPillText: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      fontSize: 12,
      marginLeft: 6
    },
    container: {
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor
    }
  })
}
