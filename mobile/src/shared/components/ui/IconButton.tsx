import { StyleSheet } from 'react-native-unistyles';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';

type IconButtonSize = 'sm' | 'md' | 'lg';
type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

const sizeStyles: Record<IconButtonSize, { button: number; icon: number }> = {
  sm: { button: 32, icon: 18 },
  md: { button: 44, icon: 22 },
  lg: { button: 56, icon: 28 },
};

const variantStyles: Record<IconButtonVariant, string> = {
  primary: '#111111',
  secondary: '#F3F4F6',
  ghost: 'transparent',
  danger: '#EF4444',
};

export function IconButton({
  icon,
  size = 'md',
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  testID,
}: IconButtonProps) {
  const { button: buttonSize, icon: iconSize } = sizeStyles[size];
  const backgroundColor = variantStyles[variant];

  return (
    <Pressable
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      <Ionicons name={icon} size={iconSize} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
}));
