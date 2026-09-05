import { useId } from 'react'
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

export function PromptArt({ variant }: { variant: number }) {
  const id = useId().replace(/:/g, '')
  if (variant === 0)
    return (
      <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EEE7DA" />
            <Stop offset="1" stopColor="#C2B9A3" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="280" fill={`url(#${id})`} />
        <Ellipse cx="205" cy="238" rx="95" ry="12" fill="#A89D83" opacity=".35" />
        <Path
          d="M161 107 Q143 129 144 194 Q145 235 202 235 Q259 235 260 195 Q261 129 243 107 L239 85 L165 85Z"
          fill="#F5F0E5"
        />
        <Ellipse cx="202" cy="86" rx="38" ry="9" fill="#D0C6B1" />
        <Ellipse cx="202" cy="84" rx="31" ry="5" fill="#AAA089" />
        <Path
          d="M201 85 Q189 33 244 6M202 75 Q231 44 267 52M203 60 Q171 40 159 12"
          stroke="#64704D"
          strokeWidth="4"
          fill="none"
        />
        <Ellipse cx="250" cy="34" rx="28" ry="9" transform="rotate(-27 250 34)" fill="#7C8D60" />
        <Ellipse cx="175" cy="26" rx="23" ry="9" transform="rotate(32 175 26)" fill="#849466" />
      </Svg>
    )
  if (variant === 1)
    return (
      <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D2DEDB" />
            <Stop offset="1" stopColor="#ECEDE1" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="280" fill={`url(#${id})`} />
        <Circle cx="284" cy="72" r="31" fill="#F2DDB1" />
        <Path d="M0 169L81 92L154 180L241 113L400 185V280H0Z" fill="#A8B9AA" />
        <Path d="M0 217L145 141L265 215L400 162V280H0Z" fill="#6F8A76" />
        <Path d="M0 260Q136 188 400 243V280H0Z" fill="#486B59" />
        <Path d="M197 209Q250 230 195 280H237Q280 225 211 209Z" fill="#D8D7B8" />
      </Svg>
    )
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
      <Rect width="400" height="280" fill="#E7D7C9" />
      <Rect x="64" y="42" width="274" height="230" rx="137" fill="#C29177" />
      <Rect x="100" y="76" width="202" height="208" rx="101" fill="#EDDCC9" />
      <Rect x="134" y="110" width="134" height="174" rx="67" fill="#BA7D65" />
      <Rect x="161" y="140" width="80" height="143" rx="40" fill="#4E6A60" />
      <Path d="M0 244L400 215V280H0Z" fill="#D9BEA5" />
      <Ellipse cx="297" cy="241" rx="29" ry="8" fill="#C09C84" />
      <Circle cx="295" cy="216" r="24" fill="#E9E1C7" />
    </Svg>
  )
}
