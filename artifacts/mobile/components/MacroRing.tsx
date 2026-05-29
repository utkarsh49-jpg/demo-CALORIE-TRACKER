import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroRingProps {
  value: number;
  goal: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  unit?: string;
}

export function MacroRing({
  value,
  goal,
  color,
  size = 88,
  strokeWidth = 7,
  label,
  unit = "g",
}: MacroRingProps) {
  const colors = useColors();
  const progress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
    progress.value = withTiming(pct, { duration: 1000 });
  }, [value, goal, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress — rotated so 0% starts at 12 o'clock */}
        <G transform={`rotate(-90, ${cx}, ${cy})`}>
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Center labels */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {Math.round(value)}
        </Text>
        <Text style={[styles.goal, { color: colors.mutedForeground }]}>
          /{Math.round(goal)}
          {unit}
        </Text>
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  goal: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
