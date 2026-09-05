import { useContext, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from './context'
import { useWorkspace } from './hooks/useWorkspace'
import { Chat } from './screens/chat'
import { Images } from './screens/images'
import { Settings } from './screens/settings'
import { AppText, Button, IconButton, IconName, Mark, Sheet } from './components/ui'
import { Screen } from '../types'

const tabs: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'Chat', label: 'Conversations', icon: 'chatbubble-outline' },
  { screen: 'Images', label: 'Image studio', icon: 'images-outline' },
  { screen: 'Settings', label: 'Settings', icon: 'options-outline' }
]

export function Main() {
  const { width } = useWindowDimensions()
  const wide = width >= 960
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const { connection, models, setChatType } = useContext(AppContext)
  const workspace = useWorkspace()
  const [screen, setScreen] = useState<Screen>('Chat')
  const [visited, setVisited] = useState<Set<Screen>>(new Set(['Chat']))
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function navigate(value: Screen) {
    setScreen(value)
    setVisited((current) => new Set([...current, value]))
    setDrawer(false)
    Keyboard.dismiss()
  }

  function newChat() {
    if (busy) return
    workspace.setActiveId(null)
    navigate('Chat')
  }

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web') return
    document.title =
      screen === 'Chat'
        ? 'Conversations · React Native AI'
        : `${screen === 'Images' ? 'Image studio' : 'Settings'} · React Native AI`
  }, [screen])

  const sidebar = (
    <View style={[styles.sidebarInner, { backgroundColor: theme.surfaceColor }]}>
      <View style={styles.brand}>
        <Mark size={28} />
        <View>
          <AppText style={{ fontFamily: theme.semiBoldFont, fontSize: 16, letterSpacing: -0.4 }}>
            react native ai
          </AppText>
          <AppText muted style={{ fontSize: 11 }}>
            A little space for big ideas.
          </AppText>
        </View>
      </View>
      <Button
        onPress={newChat}
        icon="add"
        disabled={busy}
        variant="secondary"
        style={{ backgroundColor: theme.elevatedColor }}
      >
        New conversation
      </Button>
      <View style={styles.nav}>
        {tabs.slice(0, 2).map((tab) => (
          <Pressable
            key={tab.screen}
            accessibilityRole="tab"
            accessibilityLabel={tab.screen === 'Chat' && !wide ? 'Chat' : tab.label}
            accessibilityState={{ selected: screen === tab.screen }}
            onPress={() => navigate(tab.screen)}
            style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => [
              styles.navItem,
              {
                backgroundColor:
                  screen === tab.screen
                    ? theme.accentSoft
                    : hovered || pressed
                      ? theme.elevatedColor
                      : 'transparent'
              }
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={19}
              color={screen === tab.screen ? theme.tintColor : theme.mutedForegroundColor}
            />
            <AppText
              style={{
                fontFamily: screen === tab.screen ? theme.mediumFont : theme.regularFont,
                color: screen === tab.screen ? theme.tintColor : theme.mutedForegroundColor
              }}
            >
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.historyHeading}>
        <AppText muted style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: theme.mediumFont }}>
          RECENT CONVERSATIONS
        </AppText>
        <AppText muted style={{ fontSize: 11 }}>
          {workspace.conversations.length || ''}
        </AppText>
      </View>
      {workspace.conversations.length > 4 && (
        <View style={[styles.search, { borderColor: theme.borderColor }]}>
          <Ionicons name="search-outline" size={15} color={theme.mutedForegroundColor} />
          <TextInput
            accessibilityLabel="Search conversations"
            placeholder="Search your conversations"
            placeholderTextColor={theme.placeholderTextColor}
            value={search}
            onChangeText={setSearch}
            style={{
              minHeight: 40,
              flex: 1,
              color: theme.textColor,
              fontFamily: theme.regularFont,
              fontSize: 12
            }}
          />
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 3, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {!workspace.conversations.length && (
          <AppText muted style={{ fontSize: 12, paddingHorizontal: 12, paddingTop: 12, lineHeight: 20 }}>
            Your next good idea starts here.{'\n'}Conversations stay on this device.
          </AppText>
        )}
        {workspace.conversations
          .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
          .map((c) => (
            <View
              key={c.id}
              style={[
                styles.historyRow,
                { backgroundColor: workspace.activeId === c.id ? theme.elevatedColor : 'transparent' }
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${c.title}`}
                disabled={busy}
                onPress={() => {
                  workspace.setActiveId(c.id)
                  const model = models.find((m) => m.label === c.model)
                  if (model) setChatType(model)
                  navigate('Chat')
                }}
                style={styles.historyText}
              >
                <AppText numberOfLines={1} style={{ fontSize: 12 }}>
                  {c.title}
                </AppText>
              </Pressable>
              <IconButton
                icon="ellipsis-horizontal"
                label={`Manage ${c.title}`}
                disabled={busy}
                onPress={() => {
                  setEditId(c.id)
                  setTitle(c.title)
                }}
                style={{ width: 36 }}
              />
            </View>
          ))}
        {!!search &&
          !workspace.conversations.some((c) => c.title.toLowerCase().includes(search.toLowerCase())) && (
            <AppText muted style={{ padding: 12, fontSize: 12 }}>
              No matching conversations.
            </AppText>
          )}
      </ScrollView>
      <View style={[styles.sidebarBottom, { borderColor: theme.borderColor }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => navigate('Settings')}
          style={styles.navItem}
        >
          <Ionicons name="options-outline" size={19} color={theme.mutedForegroundColor} />
          <AppText muted>Settings</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open connection settings"
          onPress={() => navigate('Settings')}
          style={styles.connection}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor: connection === 'connected' ? theme.successColor : theme.mutedForegroundColor
              }
            ]}
          />
          <AppText muted style={{ fontSize: 11 }}>
            {connection === 'connected'
              ? 'Server connected'
              : connection === 'checking'
                ? 'Checking connection'
                : connection === 'offline'
                  ? 'Server offline'
                  : 'Connect your server'}
          </AppText>
          <Ionicons name="arrow-forward" size={13} color={theme.mutedForegroundColor} />
        </Pressable>
      </View>
    </View>
  )

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.backgroundColor,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }
      ]}
    >
      {wide && (
        <View
          style={[
            styles.sidebar,
            {
              borderColor: theme.borderColor,
              paddingBottom: insets.bottom,
              backgroundColor: theme.surfaceColor
            }
          ]}
        >
          {sidebar}
        </View>
      )}
      <View style={[styles.main, wide && { paddingBottom: insets.bottom }]}>
        {!wide && (
          <View style={[styles.mobileHeader, { borderColor: theme.borderColor }]}>
            <IconButton icon="menu-outline" label="Open conversations" onPress={() => setDrawer(true)} />
            <View style={styles.mobileBrand}>
              <Mark size={21} />
              <AppText style={{ fontFamily: theme.mediumFont }}>react native ai</AppText>
            </View>
            <IconButton icon="add" label="New conversation" disabled={busy} onPress={newChat} />
          </View>
        )}
        {!workspace.hydrated ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.tintColor} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={[styles.screen, screen !== 'Chat' && styles.hidden]}>
              <Chat
                conversation={workspace.conversations.find((c) => c.id === workspace.activeId)}
                onSave={workspace.save}
                onActivate={workspace.setActiveId}
                onBusy={setBusy}
                onSettings={() => navigate('Settings')}
              />
            </View>
            {visited.has('Images') && (
              <View style={[styles.screen, screen !== 'Images' && styles.hidden]}>
                <Images onSettings={() => navigate('Settings')} />
              </View>
            )}
            {visited.has('Settings') && (
              <View style={[styles.screen, screen !== 'Settings' && styles.hidden]}>
                <Settings />
              </View>
            )}
          </View>
        )}
        {!wide && !keyboardVisible && (
          <View
            style={[
              styles.tabs,
              {
                borderColor: theme.borderColor,
                paddingBottom: Math.max(insets.bottom, 8),
                backgroundColor: theme.backgroundColor
              }
            ]}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.screen}
                onPress={() => navigate(tab.screen)}
                accessibilityRole="tab"
                accessibilityLabel={tab.screen === 'Chat' && !wide ? 'Chat' : tab.label}
                accessibilityState={{ selected: screen === tab.screen }}
                style={styles.tab}
              >
                <Ionicons
                  name={tab.icon}
                  size={21}
                  color={screen === tab.screen ? theme.tintColor : theme.mutedForegroundColor}
                />
                <AppText
                  style={{
                    fontSize: 10,
                    lineHeight: 16,
                    color: screen === tab.screen ? theme.tintColor : theme.mutedForegroundColor
                  }}
                >
                  {tab.screen === 'Chat' ? 'Chat' : tab.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Sheet visible={drawer && !wide} title="Your workspace" onClose={() => setDrawer(false)}>
        <View style={{ height: 520, maxHeight: '100%' }}>{sidebar}</View>
      </Sheet>
      <Sheet visible={!!editId} title="Conversation details" onClose={() => setEditId(null)}>
        <View style={{ padding: 24, paddingTop: 0, gap: 16 }}>
          <TextInput
            accessibilityLabel="Conversation title"
            value={title}
            onChangeText={setTitle}
            maxLength={72}
            style={[
              styles.rename,
              { borderColor: theme.borderColor, color: theme.textColor, fontFamily: theme.regularFont }
            ]}
          />
          <Button
            disabled={!title.trim()}
            onPress={() => {
              workspace.rename(editId!, title)
              setEditId(null)
            }}
          >
            Save title
          </Button>
          <Button
            variant="danger"
            icon="trash-outline"
            onPress={() => {
              setDeleteId(editId)
              setEditId(null)
            }}
          >
            Delete conversation
          </Button>
        </View>
      </Sheet>
      <Sheet
        visible={!!deleteId}
        title="Delete this conversation?"
        subtitle="This removes the conversation from this device. This action cannot be undone."
        onClose={() => setDeleteId(null)}
      >
        <View style={{ padding: 24, paddingTop: 0, gap: 10 }}>
          <Button
            variant="danger"
            onPress={() => {
              workspace.remove(deleteId!)
              setDeleteId(null)
            }}
          >
            Delete conversation
          </Button>
          <Button variant="secondary" onPress={() => setDeleteId(null)}>
            Keep conversation
          </Button>
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 260, borderRightWidth: 1 },
  sidebarInner: { flex: 1, paddingHorizontal: 16, paddingTop: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, marginBottom: 32 },
  nav: { gap: 4, marginTop: 22, marginBottom: 32 },
  navItem: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  historyHeading: {
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 9 },
  historyText: { flex: 1, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  sidebarBottom: { borderTopWidth: 1, paddingTop: 12, paddingBottom: 22, gap: 8 },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 36 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  main: { flex: 1, minWidth: 0 },
  screen: { flex: 1 },
  hidden: { display: 'none' },
  mobileHeader: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1
  },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabs: { flexDirection: 'row', paddingTop: 7, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', gap: 4, padding: 6, minHeight: 48 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rename: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 }
})
