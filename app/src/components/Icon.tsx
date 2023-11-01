import Svg, { G, Path, Circle, Rect } from 'react-native-svg';

export function Icon({
  size = 100,
  fill = 'black',
  ...props
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1200 1200" {...props}>
      <G>
        <Path fill={fill} d="m498.46 410.29h421.25l-378.27 655.16h142.4l378.16-655.16 71.254-123.3h-706.03z"/>
        <Path fill={fill} d="m726.83 439.5-210.62 364.81-378.25-655.19-71.195 123.32 378.3 655.08 71.148 123.36 353.02-611.45z"/>
        <Path fill={fill} d="m587.34 622.67-210.62-364.81 756.53 0.011719-71.195-123.32-898.87 0.023437 353.02 611.45z"/>
      </G>
    </Svg>
  )
}