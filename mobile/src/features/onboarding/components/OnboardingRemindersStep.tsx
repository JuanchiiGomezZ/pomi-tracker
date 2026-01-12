import { StyleSheet } from "react-native-unistyles";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/shared/components/ui/Text";
import { Button } from "@/shared/components/ui/Button";
import { Switch } from "@/shared/components/ui/Switch";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "../stores/onboarding.store";
import { Ionicons } from "@expo/vector-icons";

function TimePicker({
  label,
  hour,
  onChange,
}: {
  label: string;
  hour: number;
  onChange: (hour: number) => void;
}) {
  const formatTime = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const decrementHour = () => {
    onChange(hour === 0 ? 23 : hour - 1);
  };

  const incrementHour = () => {
    onChange(hour === 23 ? 0 : hour + 1);
  };

  return (
    <View style={styles.timePicker}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <View style={styles.timePickerControls}>
        <Pressable style={styles.timeButton} onPress={decrementHour}>
          <Ionicons name="chevron-back" size={20} color="#111111" />
        </Pressable>
        <Text variant="h4" style={styles.timeValue}>
          {formatTime(hour)}
        </Text>
        <Pressable style={styles.timeButton} onPress={incrementHour}>
          <Ionicons name="chevron-forward" size={20} color="#111111" />
        </Pressable>
      </View>
    </View>
  );
}

export function OnboardingRemindersStep() {
  const { t } = useTranslation("onboarding");
  const {
    dayCloseEnabled,
    setDayCloseEnabled,
    dayCloseHour,
    setDayCloseHour,
    blockRemindersEnabled,
    setBlockRemindersEnabled,
  } = useOnboardingStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          {t("steps.reminders.title")}
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {t("steps.reminders.subtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text variant="body" weight="semibold">
                {t("steps.reminders.dayCloseTitle")}
              </Text>
              <Text variant="caption" color="secondary">
                {t("steps.reminders.dayCloseDescription")}
              </Text>
            </View>
            <Switch
              value={dayCloseEnabled}
              onValueChange={setDayCloseEnabled}
            />
          </View>

          {dayCloseEnabled && (
            <TimePicker
              label={t("steps.reminders.closeTime")}
              hour={dayCloseHour}
              onChange={setDayCloseHour}
            />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text variant="body" weight="semibold">
                {t("steps.reminders.blockRemindersTitle")}
              </Text>
              <Text variant="caption" color="secondary">
                {t("steps.reminders.blockRemindersDescription")}
              </Text>
            </View>
            <Switch
              value={blockRemindersEnabled}
              onValueChange={setBlockRemindersEnabled}
            />
          </View>
        </View>
      </ScrollView>
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
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing(5),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: theme.spacing(4),
  },
  timePicker: {
    marginTop: theme.spacing(5),
    paddingTop: theme.spacing(5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  timePickerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing(3),
  },
  timeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  timeValue: {
    width: 120,
    textAlign: "center",
  },
}));
