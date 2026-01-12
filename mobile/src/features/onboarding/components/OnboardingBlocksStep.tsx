import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native-unistyles";
import { View, Pressable, ScrollView } from "react-native";
import { Text } from "@/shared/components/ui/Text";
import { Button } from "@/shared/components/ui/Button";
import { TextInput } from "@/shared/components/ui/TextInput";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "../stores/onboarding.store";
import { DEFAULT_BLOCKS, type Block, type CreateBlockDto } from "../types";
import { Icon } from "@/shared/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BlockCard({
  block,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation("onboarding");

  const toggleDay = (dayIndex: number) => {
    const currentDays = block.activeDays;
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d: number) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    onUpdate({ activeDays: newDays });
  };

  return (
    <View style={styles.blockCard}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockEmoji}>{block.icon || "📦"}</Text>
        <TextInput
          value={block.name}
          onChangeText={(text: string) => onUpdate({ name: text })}
          containerStyle={styles.blockNameInputContainer}
          inputStyle={styles.blockNameInput}
        />
        <Icon name="delete-outline" size="md" color="text" onPress={onRemove} />
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day, index) => {
          const isActive = block.activeDays.includes(index);
          return (
            <Pressable
              key={day}
              style={[styles.dayButton, isActive && styles.dayButtonActive]}
              onPress={() => toggleDay(index)}
            >
              <Text variant="caption" color={isActive ? "inverse" : "secondary"}>
                {day.charAt(0)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" color="secondary" style={styles.daysLabel}>
        {t("steps.blocks.activeDays")}
      </Text>
    </View>
  );
}

export function OnboardingBlocksStep() {
  const { t } = useTranslation("onboarding");
  const { blocks, updateBlock, addBlock, removeBlock, nextStep, canProceed } = useOnboardingStore();

  // Initialize with default blocks on mount
  useEffect(() => {
    if (blocks.length === 0) {
      DEFAULT_BLOCKS.forEach((defaultBlock: CreateBlockDto, index: number) => {
        const newBlock: Block = {
          id: `temp-${index}`,
          name: defaultBlock.name || "",
          description: defaultBlock.description,
          icon: defaultBlock.icon,
          color: defaultBlock.color,
          sortOrder: defaultBlock.sortOrder ?? index,
          activeDays: defaultBlock.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
          reminderEnabled: defaultBlock.reminderEnabled ?? false,
          reminderHour: defaultBlock.reminderHour,
          userId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addBlock(newBlock);
      });
    }
  }, [blocks.length, addBlock]);

  const handleAddBlock = () => {
    const newBlock: Block = {
      id: `temp-${Date.now()}`,
      name: t("steps.blocks.newBlock"),
      icon: "✨",
      color: "#6B7280",
      sortOrder: blocks.length,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      reminderEnabled: false,
      userId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addBlock(newBlock);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          {t("steps.blocks.title")}
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {t("steps.blocks.subtitle")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onRemove={() => removeBlock(block.id)}
          />
        ))}

        <Pressable style={styles.addButton} onPress={handleAddBlock}>
          <Icon name="plus" size="lg" color="muted" />
          <Text color="secondary" style={styles.addButtonText}>
            {t("steps.blocks.addBlock")}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Text variant="caption" color="secondary" style={styles.hint}>
          {t("steps.blocks.minimumHint")}
        </Text>
        <Button onPress={nextStep} variant="primary" disabled={!canProceed()}>
          {t("continue")}
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
  blockCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing(5),
    marginBottom: theme.spacing(4),
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing(4),
    gap: theme.spacing(2),
  },
  blockEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  blockNameInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  blockNameInput: {
    height: "auto",
    minHeight: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  daysLabel: {
    marginTop: theme.spacing(1),
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderStyle: "dashed",
  },
  addButtonText: {
    marginLeft: theme.spacing(2),
  },
  footer: {
    paddingTop: theme.spacing(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  hint: {
    marginBottom: theme.spacing(3),
    textAlign: "center",
  },
}));
