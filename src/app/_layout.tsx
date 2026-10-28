import { Stack } from 'expo-router';
import { FavoritesProvider } from '@/features/favorites/context/FavoritesContext';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FavoritesProvider>
  );
}