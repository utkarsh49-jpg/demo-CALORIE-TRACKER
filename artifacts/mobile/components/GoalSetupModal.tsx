import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DailyGoals } from "@/context/NutritionContext";
import { useColors } from "@/hooks/useColors";
import colors from "@/constants/colors";

interface GoalSetupModalProps {
  visible: boolean;
  currentGoals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
  onClose: () => void;
}

const GOAL_FIELDS: {
  key: keyof DailyGoals;
  label: string;
  unit: string;
  color: string;
}[] = [
  { key: "calories", label: "Calories", unit: "kcal", color: colors.calories },
  { key: "protein", label: "Protein", unit: "g", color: colors.protein },
  { key: "carbs", label: "Carbs", unit: "g", color: colors.carbs },
  { key: "fat", label: "Fat", unit: "g", color: colors.fat },
];

export function GoalSetupModal({
  visible,
  currentGoals,
  onSave,
  onClose,
}: GoalSetupModalProps) {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Record<keyof DailyGoals, string>>({
    calories: currentGoals.calories.toString(),
    protein: currentGoals.protein.toString(),
    carbs: currentGoals.carbs.toString(),
    fat: currentGoals.fat.toString(),
  });

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      calories: parseInt(draft.calories) || 2000,
      protein: parseInt(draft.protein) || 150,
      carbs: parseInt(draft.carbs) || 200,
      fat: parseInt(draft.fat) || 65,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.card,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.foreground }]}>
              Daily Goals
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.fields}>
            {GOAL_FIELDS.map((field) => (
              <View
                key={field.key}
                style={[styles.field, { borderColor: themeColors.border }]}
              >
                <View style={styles.fieldLabel}>
                  <View
                    style={[styles.dot, { backgroundColor: field.color }]}
                  />
                  <Text style={[styles.label, { color: themeColors.foreground }]}>
                    {field.label}
                  </Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: themeColors.foreground,
                        backgroundColor: themeColors.muted,
                      },
                    ]}
                    value={draft[field.key]}
                    onChangeText={(t) =>
                      setDraft((d) => ({ ...d, [field.key]: t }))
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={[styles.unit, { color: themeColors.mutedForeground }]}>
                    {field.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: themeColors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { color: themeColors.primaryForeground }]}>
              Save Goals
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fields: { gap: 12 },
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 15, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: {
    width: 72,
    height: 38,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  unit: { fontSize: 13, fontFamily: "Inter_400Regular", width: 32 },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
