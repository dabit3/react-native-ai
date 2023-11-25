import Svg, { Path, G } from 'react-native-svg';

export function Icon({
  size = 100,
  fill = 'black',
  ...props
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1200 1200" {...props}>
       <G>
        <Path fill={fill} d="m632.62 175.12 236.62 744h216.75z"/>
        <Path fill={fill} d="m609.38 163.88v755.25h240.38z"/>
        <Path fill={fill} d="m590.62 919.12v-755.25l-240.38 755.25z"/>
        <Path fill={fill} d="m114 919.12h216.75l236.62-744z"/>
        <Path fill={fill} d="m106.88 937.88h221.25v98.25h-221.25z"/>
        <Path fill={fill} d="m346.88 937.88h243.75v93.75h-243.75z"/>
        <Path fill={fill} d="m609.38 937.88h243.75v93.75h-243.75z"/>
        <Path fill={fill} d="m871.88 937.88h221.25v98.25h-221.25z"/>
      </G>
    </Svg>
  )
}