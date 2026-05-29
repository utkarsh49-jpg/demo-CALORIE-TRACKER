import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useNutrition } from "@/context/NutritionContext";
import { useColors } from "@/hooks/useColors";
import { useGetCoachAdvice, useGetMealSuggestions } from "@workspace/api-client-react";

function CoachButton({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) {
  const themeColors = useColors();
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (isLoading) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [isLoading, pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={styles.coachBtnWrapper}
      >
        <LinearGradient
          colors={["#16a34a", "#15803d", "#166534"]}
          style={styles.coachBtn}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Ionicons name="mic" size={36} color="#fff" />
          )}
        </LinearGradient>
        <View style={[styles.coachBtnRing, { borderColor: themeColors.primary }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function SuggestionCard({ text }: { text: string }) {
  const themeColors = useColors();
  return (
    <View style={[styles.suggestionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Ionicons name="bulb-outline" size={18} color={colors.protein} />
      <Text style={[styles.suggestionText, { color: themeColors.foreground }]}>
        {text}
      </Text>
    </View>
  );
}

export default function CoachScreen() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const { getDayTotals, goals, streak, getDateString, dailyLogs } = useNutrition();

  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getCoachAdvice = useGetCoachAdvice();
  const getMealSuggestions = useGetMealSuggestions();

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const today = getDateString(new Date());
  const todayTotals = getDayTotals(today);
  const todayEntries = dailyLogs[today] ?? [];

  const handleCoach = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = await getCoachAdvice.mutateAsync({
        data: {
          totalCalories: todayTotals.calories,
          totalProtein: todayTotals.protein,
          totalCarbs: todayTotals.carbs,
          totalFat: todayTotals.fat,
          goalCalories: goals.calories,
          goalProtein: goals.protein,
          goalCarbs: goals.carbs,
          goalFat: goals.fat,
          streak,
          mealCount: todayEntries.length,
        },
      });
      const msg = (data as { message: string }).message;
      setCoachMessage(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Coach Unavailable",
        "Could not reach the AI coach. Please check your connection.",
        [{ text: "OK" }]
      );
    }
  }, [todayTotals, goals, streak, todayEntries.length, getCoachAdvice]);

  const handleSuggest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const remaining = {
        remainingCalories: Math.max(0, goals.calories - todayTotals.calories),
        remainingProtein: Math.max(0, goals.protein - todayTotals.protein),
        remainingCarbs: Math.max(0, goals.carbs - todayTotals.carbs),
        remainingFat: Math.max(0, goals.fat - todayTotals.fat),
        todayMeals: todayEntries.map((e) => e.name),
      };
      const data = await getMealSuggestions.mutateAsync({ data: remaining });
      setSuggestions((data as { suggestions: string[] }).suggestions ?? []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Suggestions Unavailable",
        "Could not load meal suggestions. Please check your connection.",
        [{ text: "OK" }]
      );
    }
  }, [goals, todayTotals, todayEntries, getMealSuggestions]);

  const remaining = {
    cal: Math.max(0, goals.calories - todayTotals.calories),
    pro: Math.max(0, goals.protein - todayTotals.protein),
    carbs: Math.max(0, goals.carbs - todayTotals.carbs),
    fat: Math.max(0, goals.fat - todayTotals.fat),
  };

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
          AI Coach
        </Text>
        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: themeColors.muted }]}>
            <Ionicons name="flame" size={14} color={colors.protein} />
            <Text style={[styles.streakText, { color: colors.protein }]}>
              {streak}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBotPad + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach section */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <View style={[styles.coachSection, { borderColor: themeColors.border }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.foreground }]}>
              Voice Coach
            </Text>
            <Text style={[styles.sectionSub, { color: themeColors.mutedForeground }]}>
              Get personalized advice based on today's nutrition
            </Text>
            <View style={styles.coachCenterRow}>
              <CoachButton
                onPress={handleCoach}
                isLoading={getCoachAdvice.isPending}
              />
            </View>
            {coachMessage && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View
                  style={[
                    styles.messageCard,
                    { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  ]}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={themeColors.primary} />
                  <Text style={[styles.messageText, { color: themeColors.foreground }]}>
                    {coachMessage}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Today's remaining macros */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
              Remaining Today
            </Text>
            <View style={styles.remainingGrid}>
              {[
                { label: "Calories", value: remaining.cal, unit: "kcal", color: colors.calories },
                { label: "Protein", value: remaining.pro, unit: "g", color: colors.protein },
                { label: "Carbs", value: remaining.carbs, unit: "g", color: colors.carbs },
                { label: "Fat", value: remaining.fat, unit: "g", color: colors.fat },
              ].map((item) => (
                <View key={item.label} style={styles.remainingItem}>
                  <Text style={[styles.remainingVal, { color: item.color }]}>
                    {Math.round(item.value)}
                  </Text>
                  <Text style={[styles.remainingUnit, { color: themeColors.mutedForeground }]}>
                    {item.unit}
                  </Text>
                  <Text style={[styles.remainingLabel, { color: themeColors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Meal suggestions */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.suggestHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: themeColors.foreground }]}>
                  Meal Suggestions
                </Text>
                <Text style={[styles.cardSub, { color: themeColors.mutedForeground }]}>
                  Based on your remaining macros
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.refreshBtn, { backgroundColor: themeColors.muted }]}
                onPress={handleSuggest}
                disabled={getMealSuggestions.isPending}
              >
                {getMealSuggestions.isPending ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : (
                  <Ionicons
                    name="refresh"
                    size={18}
                    color={themeColors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {suggestions.length === 0 ? (
              <TouchableOpacity
                style={[styles.getSuggestBtn, { backgroundColor: themeColors.muted }]}
                onPress={handleSuggest}
                disabled={getMealSuggestions.isPending}
              >
                {getMealSuggestions.isPending ? (
                  <ActivityIndicator color={themeColors.primary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={themeColors.primary} />
                    <Text style={[styles.getSuggestText, { color: themeColors.primary }]}>
                      Get AI Suggestions
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.suggestionsList}>
                {suggestions.map((s, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.duration(300).delay(i * 80)}
                  >
                    <SuggestionCard text={s} />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Privacy policy */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={[styles.privacyCard, { borderColor: themeColors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.mutedForeground} />
            <Text style={[styles.privacyText, { color: themeColors.mutedForeground }]}>
              All nutrition data stays on your device. AI analysis is processed securely and not stored.{" "}
              <Text style={{ color: themeColors.primary }}>Privacy Policy</Text>
            </Text>
          </View>
        </Animated.View>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  coachSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  coachCenterRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
  coachBtnWrapper: { alignItems: "center", justifyContent: "center" },
  coachBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  coachBtnRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    opacity: 0.3,
  },
  messageCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  remainingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  remainingItem: { alignItems: "center", gap: 2 },
  remainingVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  remainingUnit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  remainingLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  suggestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  getSuggestBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  getSuggestText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  suggestionsList: { gap: 8 },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
