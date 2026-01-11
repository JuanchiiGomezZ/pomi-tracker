import { useState, useCallback } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { StyleSheet as UnistylesStyleSheet } from "react-native-unistyles";
import type { ViewStyle } from "react-native";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  size = "md",
  style,
}: SwitchProps) {
  const [animatedValue] = useState(() => new Animated.Value(value ? 1 : 0));

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(animatedValue, {
        toValue,
        useNativeDriver: true,
        tension: 200,
        friction: 25,
      }).start();
    },
    [animatedValue]
  );

  const handlePress = useCallback(() => {
    if (disabled) return;
    const newValue = !value;
    onValueChange(newValue);
    animateTo(newValue ? 1 : 0);
  }, [value, disabled, onValueChange, animateTo]);

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return { trackWidth: 36, trackHeight: 20, thumbSize: 16, thumbMargin: 2 };
      case "md":
        return { trackWidth: 51, trackHeight: 28, thumbSize: 24, thumbMargin: 2 };
      case "lg":
        return { trackWidth: 67, trackHeight: 36, thumbSize: 32, thumbMargin: 2 };
      default:
        return { trackWidth: 51, trackHeight: 28, thumbSize: 24, thumbMargin: 2 };
    }
  };

  const { trackWidth, trackHeight, thumbSize, thumbMargin } = getSizeConfig();

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbMargin, trackWidth - thumbSize - thumbMargin],
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.colors.grayscale[300], // grayscale[300] for off state
      theme.colors.accent, // accent color for on state
    ],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#FFFFFF"],
  });

  return (
    <Pressable
      style={[styles.container, { width: trackWidth, height: trackHeight }, style]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={value ? "Enabled" : "Disabled"}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            backgroundColor: disabled
              ? theme.colors.grayscale[200]
              : trackColor,
            borderRadius: trackHeight / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: disabled
                ? theme.colors.grayscale[400]
                : thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = UnistylesStyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
}));
