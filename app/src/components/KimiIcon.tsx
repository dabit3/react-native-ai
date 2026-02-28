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
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.69 5.06 1.83L12 10.17V4zm-1.5.24v6.52L5.15 6.05A7.958 7.958 0 0 1 10.5 4.24zM4 12c0-1.63.5-3.14 1.35-4.39L10.5 12l-5.15 4.39A7.958 7.958 0 0 1 4 12zm6.5 7.76v-6.52l5.35 4.71A7.958 7.958 0 0 1 10.5 19.76zM12 20c-1.93 0-3.68-.69-5.06-1.83L12 13.83V20zm1.5-.24v-6.52l5.35 4.71A7.958 7.958 0 0 1 13.5 19.76zM20 12c0 1.63-.5 3.14-1.35 4.39L13.5 12l5.15-4.39A7.958 7.958 0 0 1 20 12z"
        fill={fill}
      />
    </Svg>
  )
}
