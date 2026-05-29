import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useNutrition } from "@/context/NutritionContext";
import { WeeklyChart } from "@/components/WeeklyChart";
import { useColors } from "@/hooks/useColors";

function StatCard({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
}) {
  const themeColors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color: themeColors.foreground }]}>
        {Math.round(value)}{unit}
      </Text>
      <Text style={[styles.statLabel, { color: themeColors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const themeColors = useColors();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.macroBarRow}>
      <Text style={[styles.macroBarLabel, { color: themeColors.mutedForeground }]}>
        {label}
      </Text>
      <View style={[styles.macroBarTrack, { backgroundColor: themeColors.muted }]}>
        <View
          style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={[styles.macroBarVal, { color: themeColors.foreground }]}>
        {Math.round(value)}g
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const { getWeekData, goals, getDayTotals, streak, dailyLogs } = useNutrition();

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const weekData = getWeekData();

  const weekStats = useMemo(() => {
    const days = weekData.map((d) => getDayTotals(d.date));
    const activeDays = days.filter((d) => d.calories > 0);
    const avgCal =
      activeDays.length > 0
        ? activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length
        : 0;
    const totalPro = days.reduce((s, d) => s + d.protein, 0);
    const totalCarbs = days.reduce((s, d) => s + d.carbs, 0);
    const totalFat = days.reduce((s, d) => s + d.fat, 0);
    return { avgCal, activeDays: activeDays.length, totalPro, totalCarbs, totalFat };
  }, [weekData, getDayTotals]);

  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const todayTotals = getDayTotals(todayStr);

  const totalLoggedDays = Object.keys(dailyLogs).filter(
    (d) => (dailyLogs[d]?.length ?? 0) > 0
  ).length;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopPad + 8,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
          History
        </Text>
        <View style={[styles.streakBadge, { backgroundColor: themeColors.muted }]}>
          <Ionicons name="flame" size={16} color={colors.protein} />
          <Text style={[styles.streakText, { color: colors.protein }]}>
            {streak} day streak
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBotPad + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
                Weekly Calories
              </Text>
              <Text style={[styles.cardSub, { color: themeColors.mutedForeground }]}>
                Goal: {goals.calories} kcal
              </Text>
            </View>
            <WeeklyChart
              data={weekData}
              goalCalories={goals.calories}
              width={320}
            />
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.statsRow}>
            <StatCard
              label="Avg/day"
              value={weekStats.avgCal}
              unit=""
              color={colors.calories}
              icon="flame-outline"
            />
            <StatCard
              label="Active days"
              value={weekStats.activeDays}
              unit="/7"
              color={colors.carbs}
              icon="calendar-outline"
            />
            <StatCard
              label="Total logged"
              value={totalLoggedDays}
              unit=" days"
              color={colors.protein}
              icon="checkmark-circle-outline"
            />
          </View>
        </Animated.View>

        {/* Today's macros */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
              Today's Macros
            </Text>
            <View style={styles.macroBars}>
              <MacroBar
                label="Protein"
                value={todayTotals.protein}
                goal={goals.protein}
                color={colors.protein}
              />
              <MacroBar
                label="Carbs"
                value={todayTotals.carbs}
                goal={goals.carbs}
                color={colors.carbs}
              />
              <MacroBar
                label="Fat"
                value={todayTotals.fat}
                goal={goals.fat}
                color={colors.fat}
              />
            </View>
          </View>
        </Animated.View>

        {/* Weekly totals */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
              7-Day Macro Totals
            </Text>
            <View style={styles.totalsGrid}>
              {[
                { label: "Protein", value: weekStats.totalPro, color: colors.protein },
                { label: "Carbs", value: weekStats.totalCarbs, color: colors.carbs },
                { label: "Fat", value: weekStats.totalFat, color: colors.fat },
              ].map((item) => (
                <View key={item.label} style={styles.totalItem}>
                  <Text style={[styles.totalValue, { color: item.color }]}>
                    {Math.round(item.value)}g
                  </Text>
                  <Text style={[styles.totalLabel, { color: themeColors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Streak card */}
        {streak > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <View
              style={[
                styles.streakCard,
                { borderColor: colors.protein },
              ]}
            >
              <Ionicons name="flame" size={32} color={colors.protein} />
              <View style={styles.streakInfo}>
                <Text style={[styles.streakBig, { color: themeColors.foreground }]}>
                  {streak} Day Streak
                </Text>
                <Text style={[styles.streakDesc, { color: themeColors.mutedForeground }]}>
                  {streak >= 7
                    ? "Incredible consistency!"
                    : streak >= 3
                    ? "You're building a habit!"
                    : "Keep it going!"}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  macroBars: { gap: 14 },
  macroBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  macroBarLabel: { width: 52, fontSize: 13, fontFamily: "Inter_500Medium" },
  macroBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  macroBarFill: { height: 8, borderRadius: 4 },
  macroBarVal: {
    width: 44,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  totalsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  totalItem: { alignItems: "center", gap: 4 },
  totalValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  totalLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    backgroundColor: "rgba(245,158,11,0.08)",
  },
  streakInfo: { flex: 1, gap: 4 },
  streakBig: { fontSize: 20, fontFamily: "Inter_700Bold" },
  streakDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
