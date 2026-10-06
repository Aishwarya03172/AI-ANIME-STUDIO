import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const base = 'items-center justify-center rounded-xl px-4 py-3.5';
  const variants = {
    primary: 'bg-brand-600 active:bg-brand-700',
    secondary: 'bg-white/10 active:bg-white/15 border border-anime-border',
    ghost: 'bg-transparent active:bg-white/5',
  };
  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    ghost: 'text-brand-300',
  };

  return (
    <Pressable
      accessibilityRole="button"
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`text-base font-semibold ${textVariants[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
