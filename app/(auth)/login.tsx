import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage, showAlert } from '@/lib/alert';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      showAlert('Missing fields', 'Enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      showAlert('Sign in failed', getErrorMessage(error, 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 gap-2">
            <Text className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
              AI Anime Studio
            </Text>
            <Text className="text-3xl font-bold text-white">Welcome back</Text>
            <Text className="text-base text-zinc-400">
              Sign in to continue creating anime with AI.
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              placeholder="••••••••"
            />
            <Button title="Sign in" loading={loading} onPress={handleSignIn} />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-zinc-400">New here?</Text>
            <Link href="/(auth)/signup">
              <Text className="font-semibold text-brand-400">Create an account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
