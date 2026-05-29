import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FoodEntry } from "@/context/NutritionContext";
import { useColors } from "@/hooks/useColors";
import colors from "@/constants/colors";

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: () => void;
}

export function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const themeColors = useColors();

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      {entry.imageUri ? (
        <Image source={{ uri: entry.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.muted }]}>
          <Ionicons
            name={entry.isBarcode ? "barcode-outline" : "restaurant-outline"}
            size={22}
            color={themeColors.mutedForeground}
          />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: themeColors.foreground }]}
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          {entry.isBarcode && (
            <View style={[styles.badge, { backgroundColor: themeColors.muted }]}>
              <Text style={[styles.badgeText, { color: themeColors.mutedForeground }]}>
                barcode
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.serving, { color: themeColors.mutedForeground }]}>
          {entry.servingSize ?? "1 serving"} · {time}
        </Text>

        <View style={styles.macros}>
          <Text style={[styles.calories, { color: colors.calories }]}>
            {Math.round(entry.calories)} kcal
          </Text>
          <View style={styles.macroRow}>
            <Text style={[styles.macro, { color: colors.protein }]}>
              P {Math.round(entry.protein)}g
            </Text>
            <Text style={[styles.macro, { color: colors.carbs }]}>
              C {Math.round(entry.carbs)}g
            </Text>
            <Text style={[styles.macro, { color: colors.fat }]}>
              F {Math.round(entry.fat)}g
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={themeColors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  serving: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  macros: { gap: 2 },
  calories: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  macroRow: { flexDirection: "row", gap: 10 },
  macro: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    padding: 4,
  },
});
