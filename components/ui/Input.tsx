import { Text, TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-zinc-300">{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor="#71717a"
        className={`rounded-xl border bg-zinc-900 px-4 py-3.5 text-base text-white ${
          error ? 'border-red-500' : 'border-zinc-700'
        }`}
        {...props}
      />
      {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
    </View>
  );
}
