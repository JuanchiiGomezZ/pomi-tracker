import { useState, useCallback, useRef, useEffect } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { StyleSheet as UnistylesStyleSheet } from "react-native-unistyles";
import { Text } from "./Text";
import type { ViewStyle } from "react-native";

interface Segment {
  id: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SegmentedControl({
  segments,
  selectedId,
  onSelect,
  disabled = false,
  style,
}: SegmentedControlProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const animatedPosition = useRef(new Animated.Value(0)).current;

  const segmentWidth = layoutWidth > 0 ? layoutWidth / segments.length : 0;

  // Find selected index for initial position
  const selectedIndex = segments.findIndex((s) => s.id === selectedId);
  const initialPosition = selectedIndex * segmentWidth;

  useEffect(() => {
    // Animate to selected position on mount and when selection changes
    Animated.spring(animatedPosition, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      tension: 200,
      friction: 25,
    }).start();
  }, [selectedIndex, segmentWidth, animatedPosition]);

  const handlePress = useCallback(
    (index: number) => {
      if (disabled) return;
      const segment = segments[index];
      if (segment.id !== selectedId) {
        onSelect(segment.id);

        // Animate selection indicator
        Animated.spring(animatedPosition, {
          toValue: index * segmentWidth,
          useNativeDriver: true,
          tension: 200,
          friction: 25,
        }).start();
      }
    },
    [segments, selectedId, onSelect, disabled, segmentWidth, animatedPosition]
  );

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
    >
      {/* Selection Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: segmentWidth,
            transform: [{ translateX: animatedPosition }],
          },
        ]}
      />

      {/* Segments */}
      {segments.map((segment, index) => {
        const isSelected = segment.id === selectedId;

        return (
          <Pressable
            key={segment.id}
            style={styles.segment}
            onPress={() => handlePress(index)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={segment.label}
          >
            {segment.icon && (
              <Text
                style={[
                  styles.icon,
                  {
                    opacity: isSelected ? 1 : 0.5,
                    fontSize: 16,
                    marginRight: 6,
                  },
                ]}
              >
                {segment.icon}
              </Text>
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isSelected
                    ? theme.colors.text.primary
                    : theme.colors.text.tertiary,
                  fontFamily: isSelected
                    ? theme.fontFamily.semibold
                    : theme.fontFamily.regular,
                },
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = UnistylesStyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.grayscale[100],
    borderRadius: 12,
    padding: 4,
    position: "relative",
    minHeight: 44,
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 36,
    zIndex: 1,
  },
  icon: {
    textAlignVertical: "center",
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
  },
}));
