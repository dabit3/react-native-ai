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
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.87 0 3.58.65 4.95 1.72L6.72 16.95A7.952 7.952 0 0 1 4 12c0-4.42 3.58-8 8-8zm0 16c-1.87 0-3.58-.65-4.95-1.72L17.28 7.05A7.952 7.952 0 0 1 20 12c0 4.42-3.58 8-8 8z"
        fill={fill}
      />
    </Svg>
  )
}
