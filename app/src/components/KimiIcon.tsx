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
        d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
        fill={fill}
      />
    </Svg>
  )
}
