import { useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { AspectRatio, Creation, ImageAttachment } from '../../types'
import { ASPECT_RATIOS, PROVIDER_ICONS } from '../../constants'
import { useGallery } from '../hooks/useGallery'
import { getImageUri, putImage } from '../mediaStore'
import { newId, pickImages, saveImage, shareImage } from '../media'
import { errorMessage, responseError } from '../utils'
import { AppText, Button, IconButton, Notice, Sheet, Tag } from '../components/ui'
import { MediaImage } from '../components/MediaImage'
import { PromptArt } from '../components/PromptArt'

const ideas = [
  {
    title: 'The beauty in the everyday',
    prompt:
      'An editorial photograph of a handmade ivory ceramic vase with a single olive branch, warm morning light, limestone backdrop, subtle film grain, quiet minimal composition.'
  },
  {
    title: 'Somewhere a little quieter',
    prompt:
      'An atmospheric landscape of layered green mountains with a winding path, a pale golden sun, soft morning haze, a restrained natural palette, fine art print.'
  },
  {
    title: 'A different point of view',
    prompt:
      'A surreal architectural study of terracotta arches, a deep sage doorway, a single ivory sphere, long afternoon shadows, warm tones, precise geometric composition.'
  }
]
const looks = ['Natural', 'Photography', 'Illustration', 'Cinematic', 'Minimal']

export function Images({ onSettings }: { onSettings: () => void }) {
  const { theme } = useContext(ThemeContext)
  const { apiUrl, token, imageModel, imageModels, handlePresentModalPress, notify, connection } =
    useContext(AppContext)
  const { creations, setCreations, hydrated } = useGallery()
  const { width } = useWindowDimensions()
  const compact = width < 650
  const [input, setInput] = useState('')
  const [references, setReferences] = useState<ImageAttachment[]>([])
  const [ratio, setRatio] = useState<AspectRatio>('1:1')
  const [look, setLook] = useState('Natural')
  const [loading, setLoading] = useState(false)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Creation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const generation = useRef<AbortController | null>(null)
  const listRef = useRef<FlatList<Creation>>(null)
  const inputRef = useRef<TextInput>(null)
  const model = imageModels.find((m) => m.label === imageModel) || imageModels[0]
  const ModelIcon = PROVIDER_ICONS[model?.provider || 'google']
  const ratios = model?.aspectRatios || ASPECT_RATIOS
  const chosenRatio = ratios.includes(ratio) ? ratio : ratios[0]

  useEffect(
    () => () => {
      generation.current?.abort()
      generation.current = null
    },
    []
  )

  async function attach() {
    if (loading || picking) return
    setPicking(true)
    try {
      const images = await pickImages(4 - references.length)
      setReferences((current) => [...current, ...images])
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setPicking(false)
    }
  }

  function cancel() {
    generation.current?.abort()
    generation.current = null
    setLoading(false)
    notify(
      'Image request stopped. Your prompt is unchanged. The provider may still bill work already started.'
    )
  }

  async function generate() {
    if (generation.current || picking || !input.trim() || !model) return
    if (!apiUrl) {
      onSettings()
      return
    }
    if (model.available === false) {
      handlePresentModalPress('image')
      return
    }
    const controller = new AbortController()
    generation.current = controller
    setLoading(true)
    setError('')
    Keyboard.dismiss()
    const prompt =
      look === 'Natural' ? input.trim() : `${input.trim()}\n\nVisual style: ${look.toLowerCase()}.`
    const id = newId()
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 180000)
    try {
      let body: FormData | string
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      if (references.length) {
        const formData = new FormData()
        formData.append('prompt', prompt)
        formData.append('model', model.label)
        formData.append('aspectRatio', chosenRatio)
        for (const image of references) {
          const uri = await getImageUri(image)
          if (Platform.OS === 'web')
            formData.append('files', await (await fetch(uri)).blob(), `${image.id}.png`)
          else {
            // @ts-ignore
            formData.append('files', { uri, name: `${image.id}.png`, type: image.mimeType })
          }
        }
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({ prompt, model: model.label, aspectRatio: chosenRatio })
      }
      if (generation.current !== controller) return
      const response = await fetch(`${apiUrl}/images/generate`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = await response.json()
      const match =
        typeof data.image === 'string' &&
        data.image.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/)
      if (!match) throw new Error('The model did not return an image. Try a different prompt.')
      if (generation.current !== controller) return
      const image = await putImage(id, match[2], match[1])
      if (generation.current !== controller) return
      const creation: Creation = {
        id,
        prompt,
        model: model.label,
        modelName: model.name,
        aspectRatio: chosenRatio,
        image: { ...image, name: input.trim().slice(0, 100) },
        createdAt: Date.now()
      }
      setCreations((current) => [creation, ...current])
      setReferences([])
      setInput('')
      setSelected(creation)
    } catch (failure) {
      if (generation.current !== controller) return
      setError(
        timedOut
          ? 'The image request timed out. Your prompt is still here. Try again.'
          : failure instanceof TypeError
            ? 'The server could not be reached. Check your connection in Settings.'
            : errorMessage(failure)
      )
    } finally {
      clearTimeout(timeout)
      if (generation.current === controller) {
        generation.current = null
        setLoading(false)
      }
    }
  }

  function editCreation(creation: Creation) {
    setReferences([creation.image])
    setInput('')
    setRatio(creation.aspectRatio)
    setSelected(null)
    setLook('Natural')
    setError('')
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
    inputRef.current?.focus()
  }

  async function exportImage(share = false) {
    if (!selected || saving) return
    setSaving(true)
    try {
      if (share) await shareImage(selected.image)
      else {
        await saveImage(selected.image)
        notify('Image saved.')
      }
    } catch (failure) {
      if (!(failure instanceof Error && failure.name === 'AbortError')) notify(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  const header = (
    <View style={{ gap: 28 }}>
      <View style={[styles.titleRow, compact && { alignItems: 'flex-start' }]}>
        <View style={{ gap: 12, flex: 1 }}>
          <AppText muted style={{ fontSize: 10, letterSpacing: 1.8 }}>
            THE IMAGE STUDIO
          </AppText>
          <AppText
            style={{
              fontFamily: theme.mediumFont,
              fontSize: compact ? 32 : 40,
              lineHeight: compact ? 40 : 49,
              letterSpacing: -1.5
            }}
          >
            From a thought{'\n'}to something you can see.
          </AppText>
          <AppText muted>Make it. Refine it. Make it yours.</AppText>
        </View>
        {!compact && <Tag accent>Images, reimagined</Tag>}
      </View>
      <View style={[styles.editor, { borderColor: theme.borderColor, backgroundColor: theme.elevatedColor }]}>
        <TextInput
          ref={inputRef}
          multiline
          value={input}
          onChangeText={setInput}
          editable={!loading}
          maxLength={8000}
          accessibilityLabel="Image prompt"
          placeholder={
            references.length
              ? 'Describe the changes you want to make…'
              : 'A place, a feeling, an idea. What do you want to create?'
          }
          placeholderTextColor={theme.placeholderTextColor}
          style={[styles.prompt, { fontFamily: theme.regularFont, color: theme.textColor }]}
        />
        {!!references.length && (
          <ScrollView horizontal contentContainerStyle={styles.references}>
            {references.map((image) => (
              <View key={image.id}>
                <MediaImage image={image} style={{ width: 78, height: 78, borderRadius: 12 }} />
                <IconButton
                  label="Remove reference image"
                  icon="close"
                  disabled={loading}
                  onPress={() => setReferences((current) => current.filter((i) => i.id !== image.id))}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 30,
                    height: 30,
                    backgroundColor: theme.elevatedColor
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
        <View style={[styles.controls, { borderColor: theme.borderColor }]}>
          <View style={styles.controlGroup}>
            <AppText muted style={styles.controlLabel}>
              FRAME
            </AppText>
            <View style={styles.row}>
              {ratios.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setRatio(value)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Aspect ratio ${value}`}
                  accessibilityState={{ selected: chosenRatio === value }}
                  style={[
                    styles.ratio,
                    compact && { paddingHorizontal: 7 },
                    {
                      borderColor: chosenRatio === value ? theme.tintColor : theme.borderColor,
                      backgroundColor: chosenRatio === value ? theme.accentSoft : 'transparent'
                    }
                  ]}
                >
                  <View
                    style={{
                      width: value === '9:16' || value === '2:3' ? 11 : 16,
                      height: value === '16:9' || value === '3:2' ? 11 : 16,
                      borderRadius: 2,
                      borderWidth: 1,
                      borderColor: chosenRatio === value ? theme.tintColor : theme.mutedForegroundColor
                    }}
                  />
                  <AppText style={{ fontSize: 11 }}>{value}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.controlGroup}>
            <AppText muted style={styles.controlLabel}>
              FEEL
            </AppText>
            <View style={styles.row}>
              {looks.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setLook(value)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityState={{ selected: look === value }}
                  style={[
                    styles.look,
                    {
                      backgroundColor: look === value ? theme.surfaceColor : 'transparent',
                      borderColor: look === value ? theme.borderColor : 'transparent'
                    }
                  ]}
                >
                  <AppText muted={look !== value} style={{ fontSize: 12 }}>
                    {value}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.editorFooter}>
          <View style={styles.row}>
            <Button
              variant="ghost"
              icon="image-outline"
              disabled={loading || references.length >= 4 || picking}
              loading={picking}
              onPress={() => void attach()}
            >
              {references.length
                ? `${references.length} reference${references.length === 1 ? '' : 's'}`
                : 'Add reference'}
            </Button>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose image model"
              disabled={loading}
              onPress={() => handlePresentModalPress('image')}
              style={styles.model}
            >
              <ModelIcon size={16} theme={theme} />
              <AppText style={{ fontSize: 12 }}>{model?.name || 'Choose model'}</AppText>
              <Ionicons name="chevron-down" size={13} color={theme.mutedForegroundColor} />
            </Pressable>
          </View>
          <Button
            onPress={loading ? cancel : () => void generate()}
            icon={loading ? 'stop-outline' : 'arrow-forward'}
            disabled={!loading && (!input.trim() || picking || !hydrated)}
          >
            {loading ? 'Stop' : references.length ? 'Create edit' : 'Create image'}
          </Button>
        </View>
      </View>
      {!!error && <Notice>{error}</Notice>}
      {loading && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.progress, { backgroundColor: theme.accentSoft }]}
        >
          <ActivityIndicator color={theme.tintColor} />
          <View style={{ gap: 3 }}>
            <AppText style={{ fontFamily: theme.mediumFont }}>Your idea is taking shape.</AppText>
            <AppText muted style={{ fontSize: 12 }}>
              You can explore the app while the model works.
            </AppText>
          </View>
        </View>
      )}
      {(connection !== 'connected' || model?.available === false) && (
        <Notice action="Settings" onAction={onSettings}>
          {connection === 'connected'
            ? 'This image provider needs an API key on your server.'
            : 'Connect your server to create images with Google or OpenAI.'}
        </Notice>
      )}
      {!creations.length && (
        <View style={{ gap: 18 }}>
          <View style={styles.galleryHeading}>
            <AppText style={{ fontFamily: theme.mediumFont, fontSize: 16 }}>A few places to start</AppText>
            <AppText muted style={{ fontSize: 11 }}>
              Illustrated prompt ideas
            </AppText>
          </View>
          <View style={[styles.ideas, compact && { flexDirection: 'column' }]}>
            {ideas.map((idea, index) => (
              <Pressable
                key={idea.title}
                accessibilityRole="button"
                accessibilityLabel={`Use prompt: ${idea.title}`}
                disabled={loading}
                onPress={() => {
                  setInput(idea.prompt)
                  inputRef.current?.focus()
                }}
                style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                  styles.idea,
                  { borderColor: hovered ? theme.tintColor : theme.borderColor }
                ]}
              >
                <View style={{ height: compact ? 160 : 160, overflow: 'hidden' }}>
                  <PromptArt variant={index} />
                </View>
                <View style={{ padding: 14, gap: 6 }}>
                  <AppText style={{ fontSize: 12, fontFamily: theme.mediumFont }}>{idea.title}</AppText>
                  <AppText muted style={{ fontSize: 11 }}>
                    Use this idea ↗
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {!!creations.length && (
        <View style={styles.galleryHeading}>
          <AppText style={{ fontSize: 20, fontFamily: theme.mediumFont }}>Your collection</AppText>
          <AppText muted style={{ fontSize: 12 }}>
            {creations.length} image{creations.length === 1 ? '' : 's'} · Saved on this device
          </AppText>
        </View>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={creations}
        numColumns={compact ? 1 : 2}
        key={compact ? 'single' : 'double'}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        contentContainerStyle={[styles.page, compact && { padding: 20 }]}
        ListHeaderComponent={header}
        ListFooterComponent={
          <AppText muted style={{ fontSize: 11, textAlign: 'center', paddingTop: 30 }}>
            Created by AI. Directed by you. Always review before you share.
          </AppText>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View image: ${item.prompt}`}
            onPress={() => setSelected(item)}
            style={[
              styles.creation,
              {
                borderColor: theme.borderColor,
                backgroundColor: theme.elevatedColor,
                maxWidth: compact ? '100%' : '49%'
              }
            ]}
          >
            <MediaImage image={item.image} style={{ width: '100%', aspectRatio: 1, borderRadius: 14 }} />
            <View style={{ padding: 14, gap: 7 }}>
              <AppText numberOfLines={2} style={{ fontSize: 13 }}>
                {item.prompt}
              </AppText>
              <View style={styles.galleryHeading}>
                <AppText muted style={{ fontSize: 11 }}>
                  {item.modelName}
                </AppText>
                <Tag>{item.aspectRatio}</Tag>
              </View>
            </View>
          </Pressable>
        )}
      />
      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title="Made from your imagination."
        subtitle={
          selected
            ? `${selected.modelName} · ${selected.aspectRatio} · ${new Date(selected.createdAt).toLocaleDateString()}`
            : ''
        }
        wide
      >
        {selected && (
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 18 }}>
            <MediaImage
              image={selected.image}
              contain
              style={{ width: '100%', height: compact ? 300 : 470, borderRadius: 14 }}
            />
            <AppText selectable style={{ fontSize: 13 }}>
              {selected.prompt}
            </AppText>
            <View style={styles.viewerActions}>
              <Button
                variant="secondary"
                icon="download-outline"
                loading={saving}
                onPress={() => void exportImage()}
              >
                Save image
              </Button>
              <Button
                variant="secondary"
                icon="share-outline"
                disabled={saving}
                onPress={() => void exportImage(true)}
              >
                Share
              </Button>
              <Button icon="create-outline" disabled={loading} onPress={() => editCreation(selected)}>
                Edit image
              </Button>
              <IconButton
                icon="trash-outline"
                label="Delete image"
                disabled={loading || saving}
                onPress={() => {
                  setDeleteId(selected.id)
                  setSelected(null)
                }}
              />
            </View>
          </ScrollView>
        )}
      </Sheet>
      <Sheet
        visible={!!deleteId}
        title="Remove this image?"
        subtitle="This removes the image from your collection. Export a copy first if you want to keep it."
        onClose={() => setDeleteId(null)}
      >
        <View style={{ padding: 24, paddingTop: 0, gap: 12 }}>
          <Button
            variant="danger"
            onPress={() => {
              setCreations((current) => current.filter((c) => c.id !== deleteId))
              setDeleteId(null)
            }}
          >
            Remove from collection
          </Button>
          <Button variant="secondary" onPress={() => setDeleteId(null)}>
            Keep image
          </Button>
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 36, paddingTop: 48, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  editor: { borderWidth: 1, borderRadius: 20, padding: 18 },
  prompt: {
    fontSize: 16,
    lineHeight: 26,
    padding: 4,
    minHeight: 90,
    maxHeight: 220,
    textAlignVertical: 'top'
  },
  references: { gap: 14, paddingTop: 12, paddingBottom: 18, paddingRight: 10 },
  controls: { gap: 16, borderTopWidth: 1, paddingTop: 18, paddingBottom: 12 },
  controlGroup: { gap: 8 },
  controlLabel: { fontSize: 9, letterSpacing: 1.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  ratio: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 8,
    borderWidth: 1,
    borderRadius: 9
  },
  look: { minHeight: 40, borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, justifyContent: 'center' },
  editorFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8
  },
  model: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8 },
  progress: { flexDirection: 'row', gap: 16, alignItems: 'center', padding: 20, borderRadius: 16 },
  galleryHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  ideas: { flexDirection: 'row', gap: 14 },
  idea: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  creation: { flex: 1, marginTop: 20, marginRight: 12, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  viewerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }
})
