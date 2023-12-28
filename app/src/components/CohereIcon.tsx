import Svg, { Path, G } from 'react-native-svg';

interface ICohereIcon {
  size: number
  theme: any
  selected: boolean
}

export function CohereIcon({
  size,
  theme,
  selected,
  ...props
}: ICohereIcon) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 260 260"
    >
      <G>
        <Path fill-rule="evenodd" clip-rule="evenodd" d="M70.7878 133.637C76.6687 133.637 88.367 133.305 104.537 126.48C123.38 118.525 160.869 104.085 187.913 89.2536C206.827 78.8799 215.117 65.1597 215.117 46.6833C215.118 21.0401 194.843 0.251953 169.833 0.251953H65.0456C29.1218 0.251953 0 30.111 0 66.9442C0 103.777 27.2666 133.637 70.7878 133.637Z" fill={fill} />
        <Path fill-rule="evenodd" clip-rule="evenodd" d="M88.5088 179.584C88.5088 161.529 99.1098 145.25 115.374 138.329L148.374 124.287C181.753 110.083 218.493 135.234 218.493 172.29C218.493 200.998 195.791 224.269 167.791 224.261L132.061 224.251C108.006 224.245 88.5088 204.249 88.5088 179.584Z" fill={fill} />
        <Path d="M37.4969 142.404H37.4962C16.7876 142.404 0 159.617 0 180.85V185.829C0 207.062 16.7876 224.275 37.4962 224.275H37.4969C58.2055 224.275 74.9932 207.062 74.9932 185.829V180.85C74.9932 159.617 58.2055 142.404 37.4969 142.404Z" fill={fill} />
      </G>
    </Svg>
  )
}