import Svg, { Path, G } from 'react-native-svg';

export function GeminiIcon({
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
      viewBox="0 0 73 73" 
    >
      <G>
        <Path
         fill={fill}
         d="M36.3745 72.7592C33.5275 53.9722 18.7819 39.2266 -0.00512695 36.3796C18.7819 33.5327 33.5275 18.787 36.3745 0C39.2214 18.787 53.9671 33.5327 72.7541 36.3796C53.9671 39.2266 39.2214 53.9722 36.3745 72.7592Z"
        />
      </G>
    </Svg>
  )
}