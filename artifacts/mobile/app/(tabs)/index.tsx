import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useNutrition } from "@/context/NutritionContext";
import { FoodEntryCard } from "@/components/FoodEntryCard";
import { MacroRing } from "@/components/MacroRing";
import { GoalSetupModal } from "@/components/GoalSetupModal";
import { useColors } from "@/hooks/useColors";

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function buildDateRange(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0] ?? "");
  }
  return dates;
}

export default function DiaryScreen() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const { dailyLogs, goals, streak, isLoaded, getDayTotals, removeEntry, updateGoals, getDateString } = useNutrition();

  const today = getDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const dateRange = useMemo(() => buildDateRange(), []);
  const totals = getDayTotals(selectedDate);
  const entries = dailyLogs[selectedDate] ?? [];

  const calPct = goals.calories > 0 ? Math.min(totals.calories / goals.calories, 1) : 0;
  const remaining = Math.max(0, goals.calories - totals.calories);

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopPad + 8,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
              {formatDateLabel(selectedDate)}
            </Text>
            <Text style={[styles.headerSub, { color: themeColors.mutedForeground }]}>
              {remaining > 0
                ? `${Math.round(remaining)} kcal remaining`
                : "Goal reached!"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: themeColors.muted }]}>
                <Ionicons name="flame" size={14} color={colors.protein} />
                <Text style={[styles.streakText, { color: colors.protein }]}>
                  {streak}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setGoalModalVisible(true)}
              style={[styles.goalBtn, { backgroundColor: themeColors.muted }]}
            >
              <Ionicons name="settings-outline" size={18} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBotPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calorie Hero */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <LinearGradient
            colors={["#0f1e12", "#0a0f18"]}
            style={[styles.heroCard, { borderColor: themeColors.border }]}
          >
            <View style={styles.calRow}>
              <Text style={[styles.calValue, { color: colors.calories }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={[styles.calGoal, { color: themeColors.mutedForeground }]}>
                / {goals.calories} kcal
              </Text>
            </View>
            {/* Calorie progress bar */}
            <View style={[styles.calBarTrack, { backgroundColor: themeColors.muted }]}>
              <Animated.View
                style={[
                  styles.calBarFill,
                  {
                    backgroundColor: colors.calories,
                    width: `${Math.round(calPct * 100)}%`,
                  },
                ]}
              />
            </View>
            {/* Macro rings */}
            <View style={styles.ringsRow}>
              <MacroRing
                value={totals.protein}
                goal={goals.protein}
                color={colors.protein}
                label="Protein"
              />
              <MacroRing
                value={totals.carbs}
                goal={goals.carbs}
                color={colors.carbs}
                label="Carbs"
              />
              <MacroRing
                value={totals.fat}
                goal={goals.fat}
                color={colors.fat}
                label="Fat"
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Date selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
          contentContainerStyle={styles.dateScrollContent}
        >
          {dateRange.map((d) => {
            const isSelected = d === selectedDate;
            const dayLabel = new Date(d + "T00:00:00").toLocaleDateString(
              undefined,
              { weekday: "short" }
            );
            const dayNum = new Date(d + "T00:00:00").getDate();
            const hasMeals = (dailyLogs[d]?.length ?? 0) > 0;

            return (
              <TouchableOpacity
                key={d}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(d);
                }}
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isSelected
                      ? themeColors.primary
                      : themeColors.muted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.datePillDay,
                    {
                      color: isSelected
                        ? themeColors.primaryForeground
                        : themeColors.mutedForeground,
                    },
                  ]}
                >
                  {d === today ? "Today" : dayLabel}
                </Text>
                <Text
                  style={[
                    styles.datePillNum,
                    {
                      color: isSelected
                        ? themeColors.primaryForeground
                        : themeColors.foreground,
                    },
                  ]}
                >
                  {dayNum}
                </Text>
                {hasMeals && (
                  <View
                    style={[
                      styles.dateDot,
                      {
                        backgroundColor: isSelected
                          ? themeColors.primaryForeground
                          : themeColors.primary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Food log */}
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.foreground }]}>
              Food Log
            </Text>
            <Text style={[styles.entryCount, { color: themeColors.mutedForeground }]}>
              {entries.length} {entries.length === 1 ? "item" : "items"}
            </Text>
          </View>

          {entries.length === 0 ? (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={[styles.emptyState, { borderColor: themeColors.border }]}
            >
              <Ionicons
                name="restaurant-outline"
                size={36}
                color={themeColors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: themeColors.foreground }]}>
                No meals logged
              </Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.mutedForeground }]}>
                Tap the scan tab to photograph your food
              </Text>
            </Animated.View>
          ) : (
            entries.map((entry, idx) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.duration(300).delay(idx * 60)}
              >
                <FoodEntryCard
                  entry={entry}
                  onDelete={() => removeEntry(selectedDate, entry.id)}
                />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/camera");
        }}
      >
        <Ionicons name="camera" size={26} color={themeColors.primaryForeground} />
      </TouchableOpacity>

      <GoalSetupModal
        visible={goalModalVisible}
        currentGoals={goals}
        onSave={updateGoals}
        onClose={() => setGoalModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  goalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  calRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  calValue: { fontSize: 42, fontFamily: "Inter_700Bold" },
  calGoal: { fontSize: 16, fontFamily: "Inter_400Regular" },
  calBarTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  calBarFill: { height: 5, borderRadius: 3 },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 4,
  },
  dateScroll: { marginHorizontal: -16 },
  dateScrollContent: { paddingHorizontal: 16, gap: 8 },
  datePill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 60,
    gap: 2,
  },
  datePillDay: { fontSize: 10, fontFamily: "Inter_500Medium" },
  datePillNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  dateDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  logSection: { gap: 10 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  entryCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
