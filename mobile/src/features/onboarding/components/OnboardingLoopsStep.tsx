import { StyleSheet } from "react-native-unistyles";
import { View, Pressable, ScrollView } from "react-native";
import { Text } from "@/shared/components/ui/Text";
import { Button } from "@/shared/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "../stores/onboarding.store";
import { SUGGESTED_LOOPS, type SuggestedLoop } from "../types";
import { Ionicons } from "@expo/vector-icons";

function LoopCard({
  loop,
  isSelected,
  onToggle,
}: {
  loop: SuggestedLoop;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={[styles.loopCard, isSelected && styles.loopCardSelected]}
      onPress={onToggle}
    >
      <View style={[styles.loopIcon, { backgroundColor: `${loop.color}20` }]}>
        <Text style={styles.loopEmoji}>{loop.icon}</Text>
      </View>
      <View style={styles.loopInfo}>
        <Text variant="body" weight="semibold">
          {loop.name}
        </Text>
        <Text variant="caption" color="secondary">
          {loop.description}
        </Text>
      </View>
      <View style={styles.checkbox}>
        {isSelected ? (
          <View style={[styles.checkboxInner, { backgroundColor: "#111111" }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        ) : (
          <View style={styles.checkboxOuter} />
        )}
      </View>
    </Pressable>
  );
}

export function OnboardingLoopsStep() {
  const { t } = useTranslation("onboarding");
  const { selectedLoops, toggleLoop, nextStep } = useOnboardingStore();

  const buttonText =
    selectedLoops.length > 0
      ? t("steps.loops.continueWithLoops", { count: selectedLoops.length })
      : t("steps.loops.skip");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          {t("steps.loops.title")}
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {t("steps.loops.subtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="caption" color="secondary" style={styles.sectionLabel}>
          {t("steps.loops.suggested")}
        </Text>

        {SUGGESTED_LOOPS.map((loop) => (
          <LoopCard
            key={loop.id}
            loop={loop}
            isSelected={selectedLoops.some((l) => l.id === loop.id)}
            onToggle={() => toggleLoop(loop)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button onPress={nextStep} variant="primary">
          {buttonText}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing(6),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    marginBottom: theme.spacing(4),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing(4),
  },
  sectionLabel: {
    marginBottom: theme.spacing(4),
  },
  loopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing(4),
    marginBottom: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loopCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  loopIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing(4),
  },
  loopEmoji: {
    fontSize: 24,
  },
  loopInfo: {
    flex: 1,
  },
  checkbox: {
    marginLeft: theme.spacing(3),
  },
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingTop: theme.spacing(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));
