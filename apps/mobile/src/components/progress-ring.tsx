import { colors } from "@/theme";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type RingPart = { value: number; color: string };

export function ProgressRing({
  parts,
  total,
  size = 44,
  thickness = 5,
  label,
  children,
}: {
  parts: RingPart[];
  total: number;
  size?: number;
  thickness?: number;
  label: string;
  children?: ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let angle = -90;
  return (
    <View accessibilityLabel={label} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.line}
          strokeWidth={thickness}
          fill="none"
        />
        {parts.map((part, index) => {
          const length = total > 0 ? (part.value / total) * circumference : 0;
          const node = (
            <Circle
              key={`${part.color}-${index}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={part.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              rotation={angle}
              origin={`${center}, ${center}`}
            />
          );
          angle += total > 0 ? (part.value / total) * 360 : 0;
          return node;
        })}
      </Svg>
      <View
        style={[
          styles.hole,
          {
            top: thickness,
            right: thickness,
            bottom: thickness,
            left: thickness,
            borderRadius: size,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hole: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
});
