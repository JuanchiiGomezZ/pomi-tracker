import { useRef, useEffect, useCallback } from "react";
import { Pressable, Animated } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ViewStyle } from "react-native";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  sm: { trackWidth: 36, trackHeight: 20, thumbSize: 16, thumbMargin: 2 },
  md: { trackWidth: 51, trackHeight: 28, thumbSize: 24, thumbMargin: 2 },
  lg: { trackWidth: 67, trackHeight: 36, thumbSize: 32, thumbMargin: 2 },
} as const;

export function Switch({
  value,
  onValueChange,
  disabled = false,
  size = "md",
  style,
}: SwitchProps) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sync animation with external value changes
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 200,
      friction: 25,
    }).start();
  }, [value, animatedValue]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onValueChange(!value);
  }, [value, disabled, onValueChange]);

  const { trackWidth, trackHeight, thumbSize, thumbMargin } = SIZE_CONFIG[size];

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbMargin, trackWidth - thumbSize - thumbMargin],
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
            borderRadius: trackHeight / 2,
            backgroundColor: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [styles.track.offColor, styles.track.onColor],
            }),
          },
          disabled && styles.trackDisabled,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              transform: [{ translateX }],
            },
            disabled && styles.thumbDisabled,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    justifyContent: "center",
    offColor: theme.colors.grayscale[300],
    onColor: theme.colors.accent,
  },
  trackDisabled: {
    backgroundColor: theme.colors.grayscale[200],
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbDisabled: {
    backgroundColor: theme.colors.grayscale[400],
  },
}));
