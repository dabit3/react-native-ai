import Svg, { Path } from 'react-native-svg';

interface IZhipuIcon {
  size: number
  theme: any
  selected: boolean
}

export function ZhipuIcon({
  size,
  theme,
  selected,
  ...props
}: IZhipuIcon) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Path
      d="M3 3h8v4H7v2h4v4H3V3zm0 14h8v4H3v-4zm10-14h8v4h-4v2h4v4h-8V3zm0 14h8v4h-8v-4z"
      fill={fill} />
    </Svg>
  )
}
