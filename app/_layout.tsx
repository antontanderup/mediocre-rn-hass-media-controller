import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
