import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useNutrition } from "@/context/NutritionContext";
import { useColors } from "@/hooks/useColors";
import { useAnalyzeFood, useLookupBarcode } from "@workspace/api-client-react";

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  description: string;
}

function MacroResultCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const themeColors = useColors();
  return (
    <View style={[styles.macroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Text style={[styles.macroCardValue, { color }]}>
        {Math.round(value)}
      </Text>
      <Text style={[styles.macroCardUnit, { color: themeColors.mutedForeground }]}>
        {unit}
      </Text>
      <Text style={[styles.macroCardLabel, { color: themeColors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function PulsingRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.3, { duration: 900 }), -1, true);
    opacity.value = withRepeat(withTiming(0.1, { duration: 900 }), -1, true);
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        animStyle,
        { borderColor: color },
      ]}
    />
  );
}

export default function CameraScreen() {
  const themeColors = useColors();
  const insets = useSafeAreaInsets();
  const { addEntry, getDateString } = useNutrition();

  const [mode, setMode] = useState<"photo" | "barcode">("photo");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  const analyzeFood = useAnalyzeFood();
  const lookupBarcode = useLookupBarcode();

  const isLoading = analyzeFood.isPending || lookupBarcode.isPending;

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  const reset = () => {
    setCapturedImage(null);
    setCapturedImageBase64(null);
    setResult(null);
    setIsAdded(false);
    setBarcodeInput("");
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access",
        "Please enable camera access in Settings to photograph food.",
        [{ text: "OK" }]
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setCapturedImage(asset.uri);
      setCapturedImageBase64(asset.base64 ?? null);
      if (asset.base64) {
        analyzeImage(asset.base64, asset.uri);
      }
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Photo Access", "Please enable photo library access in Settings.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setCapturedImage(asset.uri);
      setCapturedImageBase64(asset.base64 ?? null);
      if (asset.base64) {
        analyzeImage(asset.base64, asset.uri);
      }
    }
  };

  const analyzeImage = async (base64: string, imageUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const data = await analyzeFood.mutateAsync({ imageBase64: base64 });
      setResult(data as AnalysisResult);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Analysis Failed",
        "Could not identify this food. Check your internet connection and try again.",
        [{ text: "Try Again", onPress: reset }, { text: "Cancel" }]
      );
    }
  };

  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const data = await lookupBarcode.mutateAsync({ barcode: barcode.trim() });
      setResult(data as AnalysisResult);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        "Product Not Found",
        "Could not find this product. Try photographing it instead.",
        [{ text: "OK" }]
      );
    }
  };

  const handleAddToDiary = () => {
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const today = getDateString(new Date());
    addEntry(today, {
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      servingSize: result.servingSize,
      description: result.description,
      imageUri: capturedImage ?? undefined,
      isBarcode: mode === "barcode",
    });
    setIsAdded(true);
    setTimeout(() => {
      reset();
      router.push("/(tabs)/");
    }, 1200);
  };

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
        <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
          Scan Food
        </Text>
        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: themeColors.muted }]}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === "photo" && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => { setMode("photo"); reset(); }}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color={mode === "photo" ? themeColors.primaryForeground : themeColors.mutedForeground}
            />
            <Text
              style={[
                styles.modeBtnText,
                {
                  color: mode === "photo"
                    ? themeColors.primaryForeground
                    : themeColors.mutedForeground,
                },
              ]}
            >
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === "barcode" && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => { setMode("barcode"); reset(); }}
          >
            <Ionicons
              name="barcode-outline"
              size={18}
              color={mode === "barcode" ? themeColors.primaryForeground : themeColors.mutedForeground}
            />
            <Text
              style={[
                styles.modeBtnText,
                {
                  color: mode === "barcode"
                    ? themeColors.primaryForeground
                    : themeColors.mutedForeground,
                },
              ]}
            >
              Barcode
            </Text>
          </TouchableOpacity>
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
        {mode === "photo" && (
          <>
            {/* Image area */}
            {!capturedImage ? (
              <View
                style={[
                  styles.cameraPlaceholder,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={themeColors.mutedForeground}
                />
                <Text style={[styles.placeholderText, { color: themeColors.mutedForeground }]}>
                  Photograph your meal
                </Text>
                <Text style={[styles.placeholderSub, { color: themeColors.mutedForeground }]}>
                  AI will identify it and calculate macros
                </Text>
              </View>
            ) : (
              <View style={styles.previewContainer}>
                <Image source={{ uri: capturedImage }} style={styles.preview} />
                {isLoading && (
                  <View style={styles.analysisOverlay}>
                    <PulsingRing color={colors.calories} />
                    <View style={styles.analysisCenter}>
                      <ActivityIndicator color={colors.calories} size="large" />
                      <Text style={styles.analyzingText}>Analyzing...</Text>
                    </View>
                  </View>
                )}
                {!isLoading && (
                  <TouchableOpacity
                    style={[styles.retakeBtn, { backgroundColor: themeColors.muted }]}
                    onPress={reset}
                  >
                    <Ionicons name="refresh" size={18} color={themeColors.foreground} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Photo action buttons */}
            {!capturedImage && (
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: themeColors.primary }]}
                  onPress={openCamera}
                >
                  <Ionicons name="camera" size={24} color={themeColors.primaryForeground} />
                  <Text style={[styles.photoBtnText, { color: themeColors.primaryForeground }]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.galleryBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  onPress={openGallery}
                >
                  <Ionicons name="images-outline" size={24} color={themeColors.foreground} />
                  <Text style={[styles.photoBtnText, { color: themeColors.foreground }]}>
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {mode === "barcode" && !result && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View
              style={[
                styles.barcodeContainer,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="barcode-scan"
                size={64}
                color={themeColors.mutedForeground}
              />
              <Text style={[styles.barcodeTitle, { color: themeColors.foreground }]}>
                Enter Barcode
              </Text>
              <Text style={[styles.barcodeSub, { color: themeColors.mutedForeground }]}>
                Type or scan the barcode number from packaged food
              </Text>
              <View style={[styles.barcodeInputRow, { backgroundColor: themeColors.muted }]}>
                <Ionicons name="barcode-outline" size={20} color={themeColors.mutedForeground} />
                <Text
                  style={[styles.barcodeInputText, { color: barcodeInput ? themeColors.foreground : themeColors.mutedForeground }]}
                >
                  {barcodeInput || "0 12345 67890 5"}
                </Text>
              </View>
              {/* Numeric keypad for barcode input */}
              <View style={styles.keypad}>
                {["1","2","3","4","5","6","7","8","9","⌫","0","→"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.keypadBtn, { backgroundColor: themeColors.muted }]}
                    onPress={() => {
                      if (k === "⌫") {
                        setBarcodeInput((p) => p.slice(0, -1));
                      } else if (k === "→") {
                        handleBarcodeSubmit(barcodeInput);
                      } else {
                        setBarcodeInput((p) => p + k);
                      }
                    }}
                  >
                    {k === "→" ? (
                      <Ionicons name="arrow-forward" size={18} color={colors.calories} />
                    ) : (
                      <Text style={[styles.keypadText, { color: themeColors.foreground }]}>
                        {k}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {isLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.calories} />
                  <Text style={[styles.loadingText, { color: themeColors.mutedForeground }]}>
                    Looking up product...
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Results */}
        {result && !isLoading && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.resultsContainer}>
            {/* Food name + description */}
            <View style={[styles.foodNameCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.foodNameRow}>
                <Text style={[styles.foodName, { color: themeColors.foreground }]}>
                  {result.name}
                </Text>
                {isAdded && (
                  <View style={[styles.addedBadge, { backgroundColor: colors.calories }]}>
                    <Ionicons name="checkmark" size={14} color="#000" />
                  </View>
                )}
              </View>
              <Text style={[styles.servingSize, { color: themeColors.mutedForeground }]}>
                {result.servingSize}
              </Text>
              {result.description ? (
                <Text style={[styles.description, { color: themeColors.mutedForeground }]}>
                  {result.description}
                </Text>
              ) : null}
            </View>

            {/* Macro cards */}
            <View style={styles.macroGrid}>
              <MacroResultCard
                label="Calories"
                value={result.calories}
                unit="kcal"
                color={colors.calories}
              />
              <MacroResultCard
                label="Protein"
                value={result.protein}
                unit="g"
                color={colors.protein}
              />
              <MacroResultCard
                label="Carbs"
                value={result.carbs}
                unit="g"
                color={colors.carbs}
              />
              <MacroResultCard
                label="Fat"
                value={result.fat}
                unit="g"
                color={colors.fat}
              />
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: isAdded ? colors.calories : themeColors.primary,
                  },
                ]}
                onPress={handleAddToDiary}
                disabled={isAdded}
              >
                <Ionicons
                  name={isAdded ? "checkmark-circle" : "add-circle-outline"}
                  size={22}
                  color={isAdded ? "#000" : themeColors.primaryForeground}
                />
                <Text
                  style={[
                    styles.addBtnText,
                    { color: isAdded ? "#000" : themeColors.primaryForeground },
                  ]}
                >
                  {isAdded ? "Added!" : "Add to Diary"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rescanBtn, { backgroundColor: themeColors.muted }]}
                onPress={reset}
              >
                <Ionicons name="refresh" size={20} color={themeColors.foreground} />
              </TouchableOpacity>
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
    gap: 12,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  cameraPlaceholder: {
    height: 240,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  placeholderSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  previewContainer: {
    borderRadius: 20,
    overflow: "hidden",
    height: 280,
  },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,13,24,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisCenter: { alignItems: "center", gap: 12 },
  analyzingText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  retakeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  photoActions: { flexDirection: "row", gap: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
  },
  galleryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
  },
  photoBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  barcodeContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  barcodeTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  barcodeSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  barcodeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
  },
  barcodeInputText: { fontSize: 18, fontFamily: "Inter_600SemiBold", flex: 1 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  keypadBtn: {
    width: 68,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resultsContainer: { gap: 14 },
  foodNameCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  foodNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  foodName: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  addedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  servingSize: { fontSize: 13, fontFamily: "Inter_400Regular" },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 18,
  },
  macroGrid: {
    flexDirection: "row",
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  macroCardValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  macroCardUnit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  macroCardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  resultActions: { flexDirection: "row", gap: 10 },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  addBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rescanBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
