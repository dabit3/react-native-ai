import Svg, { Path } from 'react-native-svg';

interface IAnthropicIcon {
  size: number
  theme: any
  selected: boolean
}

export function AnthropicIcon({
  size,
  theme,
  selected,
  ...props
}: IAnthropicIcon) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 46 32"
    >
      <Path
      d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z"
      fill={fill} />
    </Svg>
  )
}