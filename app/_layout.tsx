import { Stack } from 'expo-router';
import { DatabaseProvider } from '../context/DatabaseContext';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DatabaseProvider>
  );
}