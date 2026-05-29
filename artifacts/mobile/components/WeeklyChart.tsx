import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import colors from "@/constants/colors";

interface DayData {
  date: string;
  day: string;
  calories: number;
}

interface WeeklyChartProps {
  data: DayData[];
  goalCalories: number;
  width?: number;
}

export function WeeklyChart({
  data,
  goalCalories,
  width = 320,
}: WeeklyChartProps) {
  const themeColors = useColors();
  const chartHeight = 140;
  const bottomPad = 22;
  const topPad = 16;
  const barAreaHeight = chartHeight - bottomPad - topPad;
  const barCount = data.length;
  const totalGap = 8;
  const barWidth = (width - totalGap * (barCount + 1)) / barCount;
  const maxVal = Math.max(goalCalories * 1.2, ...data.map((d) => d.calories), 200);

  const todayDate = new Date().toISOString().split("T")[0];

  return (
    <View>
      <Svg width={width} height={chartHeight}>
        {data.map((item, i) => {
          const isToday = item.date === todayDate;
          const barH =
            item.calories > 0
              ? Math.max((item.calories / maxVal) * barAreaHeight, 4)
              : 0;
          const x = totalGap + i * (barWidth + totalGap);
          const y = topPad + barAreaHeight - barH;

          return (
            <React.Fragment key={item.date}>
              {/* Background bar */}
              <Rect
                x={x}
                y={topPad}
                width={barWidth}
                height={barAreaHeight}
                rx={6}
                fill={themeColors.muted}
                opacity={0.4}
              />
              {/* Value bar */}
              {item.calories > 0 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  fill={isToday ? colors.calories : themeColors.secondary}
                  opacity={isToday ? 1 : 0.8}
                />
              )}
              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 4}
                textAnchor="middle"
                fill={isToday ? colors.calories : themeColors.mutedForeground}
                fontSize={11}
                fontFamily="Inter_500Medium"
              >
                {item.day}
              </SvgText>
              {/* Calorie label */}
              {item.calories > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill={isToday ? colors.calories : themeColors.mutedForeground}
                  fontSize={9}
                  fontFamily="Inter_600SemiBold"
                >
                  {item.calories >= 1000
                    ? `${(item.calories / 1000).toFixed(1)}k`
                    : item.calories}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        {/* Goal line */}
        {goalCalories > 0 && (
          <Line
            x1={0}
            y1={topPad + barAreaHeight - (goalCalories / maxVal) * barAreaHeight}
            x2={width}
            y2={topPad + barAreaHeight - (goalCalories / maxVal) * barAreaHeight}
            stroke={colors.calories}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
