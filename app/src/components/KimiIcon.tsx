import Svg, { Path } from 'react-native-svg';

interface IKimiIcon {
  size: number
  theme: any
  selected: boolean
}

export function KimiIcon({
  size,
  theme,
  selected,
  ...props
}: IKimiIcon) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.85 0 3.55.63 4.9 1.69L7.69 16.9A7.95 7.95 0 0 1 4 12c0-4.41 3.59-8 8-8zm0 16c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.95 7.95 0 0 1 20 12c0 4.41-3.59 8-8 8z"
      fill={fill} />
    </Svg>
  )
}
