import Svg, { Path } from 'react-native-svg';

interface IGlmIcon {
  size: number
  theme: any
  selected: boolean
}

export function GlmIcon({
  size,
  theme,
  selected,
  ...props
}: IGlmIcon) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-1v-4H7v-1h3V8h1v4h3v1h-3v4zm5.5-4.5h-1v-1h1v1z"
        fill={fill}
      />
    </Svg>
  )
}
