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
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm-1 14.93c-2.83-.48-5.15-2.45-6.16-5.07C6.39 16.49 8.97 17.5 12 17.5s5.61-1.01 7.16-2.64c-1.01 2.62-3.33 4.59-6.16 5.07V19h-2v.93z"
        fill={fill}
      />
    </Svg>
  )
}
