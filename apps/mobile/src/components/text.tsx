import { colors, fonts } from "@/theme";
import { Text, type TextProps, type TextStyle } from "react-native";

type Weight = "regular" | "medium" | "semibold" | "bold";

const SANS: Record<Weight, string> = {
  regular: fonts.sans,
  medium: fonts.sansMedium,
  semibold: fonts.sansSemibold,
  bold: fonts.sansBold,
};

const MONO: Record<Weight, string> = {
  regular: fonts.mono,
  medium: fonts.monoMedium,
  semibold: fonts.monoBold,
  bold: fonts.monoBold,
};

export function T({
  children,
  size = 15,
  color = colors.ink,
  weight = "regular",
  mono = false,
  style,
  ...rest
}: TextProps & {
  size?: number;
  color?: string;
  weight?: Weight;
  mono?: boolean;
}) {
  const font: TextStyle = {
    fontFamily: mono ? MONO[weight] : SANS[weight],
    fontSize: size,
    color,
  };
  return (
    <Text {...rest} style={[font, style]}>
      {children}
    </Text>
  );
}
