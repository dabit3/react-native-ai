import { memo, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleProp, View, ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ImageAttachment } from '../../types'
import { getImageUri } from '../mediaStore'
import { ThemeContext } from '../context'
import { AppText } from './ui'

export const MediaImage = memo(function MediaImage({
  image,
  style,
  contain = false
}: {
  image: ImageAttachment
  style: StyleProp<ViewStyle>
  contain?: boolean
}) {
  const { theme } = useContext(ThemeContext)
  const [uri, setUri] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    let mounted = true
    setError(false)
    setUri('')
    getImageUri(image)
      .then((value) => {
        if (mounted) setUri(value)
      })
      .catch(() => {
        if (mounted) setError(true)
      })
    return () => {
      mounted = false
    }
  }, [image])
  return (
    <View
      style={[
        {
          backgroundColor: theme.surfaceColor,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center'
        },
        style
      ]}
    >
      {error ? (
        <View style={{ alignItems: 'center', gap: 6, padding: 8 }}>
          <Ionicons name="image-outline" size={23} color={theme.mutedForegroundColor} />
          <AppText muted style={{ fontSize: 11 }}>
            Image unavailable
          </AppText>
        </View>
      ) : uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel={image.name || 'Generated image'}
          resizeMode={contain ? 'contain' : 'cover'}
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <ActivityIndicator color={theme.mutedForegroundColor} />
      )}
    </View>
  )
})
