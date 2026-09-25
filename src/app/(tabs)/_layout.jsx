import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  bgAlt: '#1B2140',   
  muted: '#8891B5',   
  teal: '#2EC4B6',    
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.bgAlt,
          borderTopWidth: 0,
          position: 'absolute', // 🚀 Fuerza al layout a flotar sobre la pantalla del celular
          bottom: 16,           // 🚀 Lo despega obligatoriamente 16 píxeles del fondo físico
          left: 0,
          right: 0,
          height: 64,           // Altura interna controlada
          elevation: 5,         // Sombra para Android
          shadowColor: '#000',  // Sombra para iOS
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 8,   // Centra los iconos de forma interna
        },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'grid' : 'grid-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
