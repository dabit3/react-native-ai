import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useState, useContext } from 'react'
import { ThemeContext } from '../../context'
import { AuroraChat } from './AuroraChat'
import { MonoChat } from './MonoChat'

const { width } = Dimensions.get('window')

type DesignDirection = 'select' | 'aurora' | 'mono'

export function DesignLab() {
  const [activeDesign, setActiveDesign] = useState<DesignDirection>('select')
  const { theme } = useContext(ThemeContext)

  if (activeDesign === 'aurora') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveDesign('select')}
        >
          <Text style={styles.backButtonText}>{'<'} Back to Lab</Text>
        </TouchableOpacity>
        <AuroraChat />
      </View>
    )
  }

  if (activeDesign === 'mono') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={[styles.backButton, styles.backButtonLight]}
          onPress={() => setActiveDesign('select')}
        >
          <Text style={[styles.backButtonText, styles.backButtonTextLight]}>{'<'} Back to Lab</Text>
        </TouchableOpacity>
        <MonoChat />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Design Lab</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForegroundColor }]}>
          Explore new design directions for the app
        </Text>

        {/* Aurora Card */}
        <TouchableOpacity
          style={styles.designCard}
          onPress={() => setActiveDesign('aurora')}
          activeOpacity={0.85}
        >
          <View style={styles.auroraCardBg}>
            <View style={styles.auroraGlow1} />
            <View style={styles.auroraGlow2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardBadge}>Direction 1</Text>
            <Text style={styles.cardTitle}>Aurora</Text>
            <Text style={styles.cardDescription}>
              Glassmorphic UI with gradient backgrounds, translucent panels, and ambient glow effects. Immersive and spatial.
            </Text>
            <View style={styles.cardTags}>
              <View style={styles.tag}><Text style={styles.tagText}>Glassmorphism</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>Gradients</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>Dark</Text></View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Mono Card */}
        <TouchableOpacity
          style={styles.designCard}
          onPress={() => setActiveDesign('mono')}
          activeOpacity={0.85}
        >
          <View style={styles.monoCardBg} />
          <View style={styles.cardContent}>
            <Text style={[styles.cardBadge, styles.cardBadgeDark]}>Direction 2</Text>
            <Text style={[styles.cardTitle, styles.cardTitleDark]}>Mono</Text>
            <Text style={[styles.cardDescription, styles.cardDescriptionDark]}>
              Ultra-minimal editorial layout with bold typography, generous whitespace, and content-first hierarchy. Clean and focused.
            </Text>
            <View style={styles.cardTags}>
              <View style={[styles.tag, styles.tagDark]}><Text style={[styles.tagText, styles.tagTextDark]}>Minimal</Text></View>
              <View style={[styles.tag, styles.tagDark]}><Text style={[styles.tagText, styles.tagTextDark]}>Editorial</Text></View>
              <View style={[styles.tag, styles.tagDark]}><Text style={[styles.tagText, styles.tagTextDark]}>Light</Text></View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontFamily: 'Geist-Bold',
    fontSize: 28,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 15,
    marginBottom: 32,
  },
  designCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    height: 200,
  },
  auroraCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0c29',
  },
  auroraGlow1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7c3aed',
    opacity: 0.3,
  },
  auroraGlow2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#06b6d4',
    opacity: 0.2,
  },
  monoCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  cardBadge: {
    fontFamily: 'Geist-Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardBadgeDark: {
    color: '#a3a3a3',
  },
  cardTitle: {
    fontFamily: 'Geist-Bold',
    fontSize: 24,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardTitleDark: {
    color: '#0a0a0a',
  },
  cardDescription: {
    fontFamily: 'Geist-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardDescriptionDark: {
    color: '#525252',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tagDark: {
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontFamily: 'Geist-Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  tagTextDark: {
    color: '#525252',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 200,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  backButtonText: {
    fontFamily: 'Geist-Medium',
    fontSize: 13,
    color: '#fff',
  },
  backButtonTextLight: {
    color: '#0a0a0a',
  },
})
