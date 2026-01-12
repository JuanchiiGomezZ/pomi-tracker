import { useState, useCallback } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { StyleSheet as UnistylesStyleSheet } from "react-native-unistyles";
import { Text } from "./Text";
import type { ViewStyle } from "react-native";
import { useTheme } from "@/shared/hooks";

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled = false,
  size = "md",
  style,
}: CheckboxProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const { theme } = useTheme();
  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return { boxSize: 20, iconSize: 12, fontSize: theme.fontSize.xs };
      case "md":
        return { boxSize: 24, iconSize: 14, fontSize: theme.fontSize.sm };
      case "lg":
        return { boxSize: 28, iconSize: 16, fontSize: theme.fontSize.base };
      default:
        return { boxSize: 24, iconSize: 14, fontSize: theme.fontSize.sm };
    }
  };

  const { boxSize, iconSize, fontSize } = getSizeConfig();

  const handlePress = useCallback(() => {
    if (disabled) return;
    const newValue = !value;
    onValueChange(newValue);

    // Bounce animation
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
    ]).start();
  }, [value, disabled, onValueChange, scale]);

  const borderColor = value
    ? "transparent"
    : disabled
      ? theme.colors.grayscale[300]
      : theme.colors.grayscale[300];

  const backgroundColor = value ? theme.colors.accent : "transparent";

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: 6,
            borderWidth: value ? 0 : 1.5,
            borderColor,
            backgroundColor,
            transform: [{ scale }],
          },
        ]}
      >
        {value && (
          <View style={styles.checkmarkContainer}>
            <View
              style={[
                styles.checkmarkPart,
                {
                  width: iconSize * 0.55,
                  height: 2,
                  backgroundColor: "#FFFFFF",
                  transform: [{ rotate: "45deg" }],
                  borderRadius: 1,
                },
              ]}
            />
            <View
              style={[
                styles.checkmarkPart,
                {
                  width: iconSize * 0.85,
                  height: 2,
                  backgroundColor: "#FFFFFF",
                  transform: [{ rotate: "135deg" }],
                  borderRadius: 1,
                  marginLeft: -iconSize * 0.15,
                },
              ]}
            />
          </View>
        )}
      </Animated.View>

      {label && (
        <Text
          style={[
            styles.label,
            {
              fontSize: fontSize,
              color: disabled ? theme.colors.text.tertiary : theme.colors.text.primary,
              marginLeft: 8,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = UnistylesStyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  checkbox: {
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkPart: {
    position: "absolute",
  },
  label: {
    fontFamily: theme.fontFamily.medium,
  },
}));
