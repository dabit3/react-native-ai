import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export function KimiIcon({
  size,
  theme,
  selected,
  ...props
}) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Circle
        cx="12"
        cy="12"
        r="10.5"
        stroke={fill}
        strokeWidth="1.5"
        fill="none"
      />
      <SvgText
        x="12"
        y="16"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fill={fill}
      >K</SvgText>
    </Svg>
  )
}
