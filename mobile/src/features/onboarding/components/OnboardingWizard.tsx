import { StyleSheet } from "react-native-unistyles";
import { View, Pressable } from "react-native";
import { Text } from "@/shared/components/ui/Text";
import { Button } from "@/shared/components/ui/Button";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "../stores/onboarding.store";
import { useCompleteOnboarding } from "../hooks/useOnboarding";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingNameStep } from "./OnboardingNameStep";
import { OnboardingBlocksStep } from "./OnboardingBlocksStep";
import { OnboardingLoopsStep } from "./OnboardingLoopsStep";
import { OnboardingRemindersStep } from "./OnboardingRemindersStep";
import { STORAGE_KEYS } from "@/constants";
import { storage } from "@/shared/utils/storage";
import { ScreenWrapper } from "@/shared/components/ui";

export function OnboardingWizard() {
  const { t } = useTranslation("onboarding");
  const {
    currentStep,
    totalSteps,
    firstName,
    blocks,
    dayCloseEnabled,
    dayCloseHour,
    blockRemindersEnabled,
    prevStep,
    getProgress,
    reset,
  } = useOnboardingStore();

  const completeOnboarding = useCompleteOnboarding();
  const progress = getProgress();
  const isLastStep = currentStep === totalSteps - 1;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <OnboardingNameStep />;
      case 1:
        return <OnboardingBlocksStep />;
      case 2:
        return <OnboardingLoopsStep />;
      case 3:
        return <OnboardingRemindersStep />;
      default:
        return null;
    }
  };

  const handleComplete = async () => {
    try {
      const onboardingData = {
        firstName,
        settings: {
          dayCutoffHour: 3,
          // dayCloseReminderEnabled: dayCloseEnabled,
          dayCloseReminderHour: dayCloseHour,
        },
        defaultBlocks: blocks.map((b) => ({
          name: b.name,
          description: b.description,
          icon: b.icon,
          color: b.color,
          activeDays: b.activeDays,
          reminderEnabled: blockRemindersEnabled,
          reminderHour: blockRemindersEnabled ? 9 : undefined,
        })),
        selectedLoops: [],
        // targetBlockName: "Morning",
      };
      await completeOnboarding.mutateAsync(onboardingData);

      storage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
      reset();
      router.replace("/(tool)/home");
    } catch {
      // Error handled by toast in hook
    }
  };

  return (
    <ScreenWrapper edges={["bottom", "top"]}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} style={styles.progressBar} />
        </View>

        {currentStep > 0 && (
          <Pressable style={styles.backButton} onPress={prevStep}>
            <Ionicons name="chevron-back" size={24} color="#111111" />
            <Text>{t("back")}</Text>
          </Pressable>
        )}
      </View>

      {renderStep()}

      {isLastStep && currentStep === 3 && (
        <View style={styles.footer}>
          <Button onPress={handleComplete} loading={completeOnboarding.isPending} variant="primary">
            {t("steps.reminders.complete")}
          </Button>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    // paddingHorizontal: theme.spacing(6),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(2),
  },
  progressContainer: {
    marginBottom: theme.spacing(4),
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    // paddingHorizontal: theme.spacing(6),
  },
  footer: {
    // paddingHorizontal: theme.spacing(6),
    paddingBottom: theme.spacing(8),
  },
}));
