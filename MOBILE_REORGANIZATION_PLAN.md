# Plan de Reorganización Arquitectónica Mobile
**Proyecto:** `mi-ecommerce` (React Native / Expo / Expo Router)  
**Rol:** Senior Mobile Engineer  
**Fecha:** Octubre 2026  
**Objetivo:** Diseñar una arquitectura limpia, modular y escalable por funcionalidades (*feature-driven*), preparada para el crecimiento independiente de Products, Favorites y Profile, y lista para la integración futura de autenticación y servicios de API centralizados.

---

## 1. Diagnóstico Actual

Se realizó una inspección exhaustiva de la estructura de archivos, dependencias y código fuente del proyecto. A continuación se detallan los hallazgos técnicos reales:

### 1.1 Entorno y Dependencias (`package.json`, `app.json`, `tsconfig.json`)
- **Core:** Expo SDK (`~57.0.25`), React Native (`0.86.3`), React (`19.2.3`), Expo Router (`~57.0.23`).
- **Navegación & Animaciones:** `react-native-safe-area-context` (`~5.7.0`), `react-native-screens` (`~4.26.0`), `react-native-reanimated` (`4.5.1`), `react-native-gesture-handler` (`~2.32.0`).
- **Configuración de compilación (`app.json`):** Tiene activados experimentos clave:
  ```json
  "experiments": {
    "tsconfigPaths": true,
    "typedRoutes": true,
    "reactCompiler": true
  }
  ```
- **TypeScript y Alias (`tsconfig.json`):**
  - Tiene configurado el alias `@/*` apuntando a `./src/*` y `@/assets/*` a `./assets/*`.
  - Presenta `strict: true`. Sin embargo, casi la totalidad del proyecto está escrito en JavaScript / JSX (`.js`, `.jsx`), con la única excepción de `src/app/_layout.tsx`.

### 1.2 Estructura y Archivos Inspeccionados
- **`theme/colors.js` (en la raíz, fuera de `src/`):**
  - La paleta base (`bg`, `bgAlt`, `line`, `ink`, `muted`, `amber`, `teal`) se encuentra en `./theme/colors.js` en lugar de estar dentro de `src/theme/`.
  - **Efecto colateral crítico:** Al estar fuera de `src/`, las importaciones relativas (`../../../theme/colors` o `'mi-ecommerce/src/theme/colors.js'`) fallaron durante el desarrollo, lo que llevó a que el objeto `colors` fuera **copiado y pegado manualmente en 6 archivos distintos**.
- **`src/app/_layout.tsx`:**
  - Define el `FavoritesProvider` y un `Stack` con `headerShown: false`.
  - La importación del contexto es frágil: `import { FavoritesProvider } from '../../src/context/FavoritesContext';` (sale de la raíz y vuelve a entrar).
- **`src/app/(tabs)/_layout.jsx`:**
  - Configura el `Tabs` navigator flotante.
  - Declara solo las pestañas `index` ("Catálogo") y `favoritos` ("Favoritos").
  - **Omisión:** La pantalla `perfil.jsx` existe en el directorio pero no está registrada en el tab bar.
  - Duplica la definición de `colors` localmente.
- **`src/app/(tabs)/index.jsx`:**
  - Pantalla del catálogo. Consume el array `products` estático de manera directa desde `src/data/products`.
  - Contiene un `console.log` de depuración y duplica el objeto `colors`.
- **`src/app/(tabs)/favoritos.jsx`:**
  - Pantalla de favoritos. Mezcla presentación con lógica de negocio (filtra `products.filter(...)` en el cuerpo del componente).
  - Define su propia tarjeta de producto inline en lugar de reutilizar `ProductCard`.
  - **Bug de enrutamiento:** En la línea 27 ejecuta `router.push('/product/${item.id}')` (en inglés), mientras que la ruta real del proyecto es `/producto/[id]` (en español).
  - Duplica el objeto `colors`.
- **`src/app/(tabs)/perfil.jsx`:**
  - Pantalla estática y huérfana de la barra de pestañas.
  - Tiene un import comentado (`//import { colors } from '../../../theme/colors';`) y el objeto `colors` duplicado inline.
- **`src/app/producto/[id].jsx`:**
  - Pantalla de detalle de producto. Lee el parámetro `id`, busca sincrónicamente en el array estático (`products.find`), consume `useFavorites` directamente y maneja alertas de compra.
  - Duplica el objeto `colors`.
- **`src/components/ProductCard.js`:**
  - Componente de tarjeta para el catálogo.
  - Extensión `.js` (a pesar del encabezado `// components/ProductCard.jsx`).
  - Duplica el objeto `colors`.
- **`src/context/FavoritesContext.jsx`:**
  - Provee `favorites` (array de IDs numéricos), `toggleFavorite` e `isFavorite`.
  - Funciona correctamente pero es 100% en memoria (se reinicia al recargar la app) y no posee tipado.
- **`src/data/products.jsx`:**
  - **Archivo híbrido/impuro:** Contiene la exportación del array `products` y, al mismo tiempo, exporta por defecto una copia completa e idéntica del componente `ProductCard` con dependencias de UI (`Image`, `Pressable`, `StyleSheet`), imports no utilizados y el objeto `colors` duplicado.

---

## 2. Problemas y Oportunidades de Mejora

| Problema Identificado | Impacto en el Proyecto | Oportunidad de Mejora |
| :--- | :--- | :--- |
| **Duplicación masiva del Theme** | Si se cambia un color de marca, deben editarse 6 archivos manualmente. Riesgo alto de inconsistencias visuales. | Mover `theme/colors.js` a `src/theme/colors.ts` y consumirlo mediante `@/theme/colors`. |
| **Contaminación en `src/data/products.jsx`** | Un archivo de datos contiene componentes de UI y estilos duplicados, generando confusión y peso innecesario. | Separar datos mock puros (`mockProducts.ts`) de componentes de presentación. |
| **Falta de modularidad por Feature** | `components/`, `data/` y `context/` están organizados horizontalmente. Al crecer el catálogo, filtros, órdenes y perfil, se volverán inmanejables. | Adoptar arquitectura *Feature-Driven* (`features/products`, `features/favorites`, `features/profile`). |
| **Acoplamiento en rutas de Expo Router** | Las pantallas dentro de `src/app/` contienen lógica de negocio, filtrado, accesos directos a datos y maquetación pesada. | Convertir `src/app/` en una capa delegada delgada (*thin route handlers*) que solo componga pantallas provenientes de `features/*/screens`. |
| **Bugs de navegación e inconsistencias** | `favoritos.jsx` navega a `/product/[id]` en vez de `/producto/[id]`. La pestaña de perfil no está expuesta en `_layout.jsx`. | Corregir rutas tipadas aprovechando `typedRoutes: true` y registrar `perfil` en la barra de pestañas. |
| **Ausencia de capa de servicios (API)** | El código asume datos síncronos en memoria (`.find`, `.filter`). Conectar un backend rompería la UI. | Diseñar un cliente HTTP base (`apiClient`) y servicios por feature (`productsService`) con hooks reactivos (`useProducts`). |
| **Dispersión de extensiones y falta de TypeScript** | Mezcla de `.js`, `.jsx` y `.tsx`. `tsconfig.json` está presente pero subutilizado. | Migración progresiva y segura hacia TypeScript (`.ts` / `.tsx`) priorizando tipos compartidos y modelos de datos. |

---

## 3. Arquitectura Propuesta y Árbol de Directorios

Se propone una **Arquitectura Modular por Features (Feature-Driven Architecture)** combinada con un núcleo transversal compartido (*Shared Core*), especialmente optimizada para **Expo Router** y **React Native**.

### 3.1 Principios Arquitectónicos
1. **Separación de Responsabilidades (SoC):** La navegación (`app/`) no maneja lógica de negocio ni peticiones de red; delega en las features.
2. **Alta Cohesión, Bajo Acoplamiento:** Todo lo que pertenece a *Products* (componentes, hooks, servicios, tipos) vive dentro de `features/products`.
3. **Escalabilidad para Servicios y Auth:** Un directorio central `services/` provee la infraestructura HTTP y el manejo de tokens, mientras que cada feature implementa sus propios servicios de dominio.
4. **Thin Route Wrappers:** Los archivos dentro de `src/app/` tienen menos de 25 líneas: capturan parámetros de URL y renderizan la pantalla del feature correspondiente.

### 3.2 Árbol de Directorios Propuesto

```text
parcial-mobile/
├── assets/                             # Recursos estáticos (imágenes de productos, splash, iconos)
│   └── products/
├── src/
│   ├── app/                            # 🚀 CAPA DE NAVEGACIÓN (Expo Router - Thin Wrappers)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Tab Navigator (Catálogo, Favoritos, Perfil)
│   │   │   ├── index.tsx               # Ruta: / (Monta ProductsScreen)
│   │   │   ├── favoritos.tsx           # Ruta: /favoritos (Monta FavoritesScreen)
│   │   │   └── perfil.tsx              # Ruta: /perfil (Monta ProfileScreen)
│   │   ├── producto/
│   │   │   └── [id].tsx                # Ruta: /producto/[id] (Monta ProductDetailScreen)
│   │   └── _layout.tsx                 # Root Layout (Stack, ThemeProvider, Providers globales)
│   │
│   ├── features/                       # 🧩 CAPA DE DOMINIO Y MODULARIDAD POR FEATURES
│   │   ├── products/                   # Módulo de Productos
│   │   │   ├── components/             # Componentes visuales del módulo
│   │   │   │   ├── ProductCard.tsx     # Tarjeta de producto del catálogo
│   │   │   │   └── ProductActions.tsx  # Botones de acción (Favorito, Comprar)
│   │   │   ├── screens/                # Vistas principales del módulo
│   │   │   │   ├── ProductsScreen.tsx  # Vista de catálogo con FlatList
│   │   │   │   └── ProductDetailScreen.tsx # Vista de detalle del producto
│   │   │   ├── hooks/                  # Lógica y estado del catálogo
│   │   │   │   ├── useProducts.ts      # Hook para obtener lista y estados (loading, error)
│   │   │   │   └── useProductDetail.ts # Hook para obtener producto por ID
│   │   │   ├── services/               # Comunicación con API / Mock data
│   │   │   │   └── productsService.ts  # Métodos: getProducts(), getProductById(id)
│   │   │   ├── data/                   # Datos locales mockeados (mientras no haya API)
│   │   │   │   └── mockProducts.ts     # Array limpio de productos (sin componentes de UI)
│   │   │   └── types/                  # Tipado específico del módulo
│   │   │       └── index.ts            # Interfaces Product, Category, etc.
│   │   │
│   │   ├── favorites/                  # Módulo de Favoritos
│   │   │   ├── components/
│   │   │   │   ├── FavoriteCard.tsx    # Tarjeta horizontal de favorito
│   │   │   │   └── EmptyFavorites.tsx  # Estado vacío cuando no hay favoritos
│   │   │   ├── screens/
│   │   │   │   └── FavoritesScreen.tsx # Vista de lista de favoritos
│   │   │   ├── context/
│   │   │   │   └── FavoritesContext.tsx # Contexto y Provider de favoritos
│   │   │   ├── hooks/
│   │   │   │   └── useFavorites.ts     # Hook consumidor del contexto
│   │   │   └── types/
│   │   │       └── index.ts            # Tipos de favoritos y contexto
│   │   │
│   │   ├── profile/                    # Módulo de Perfil de Usuario
│   │   │   ├── components/
│   │   │   │   ├── ProfileHeader.tsx   # Avatar y datos del usuario
│   │   │   │   └── ProfileOptionItem.tsx # Opciones del menú de perfil
│   │   │   ├── screens/
│   │   │   │   └── ProfileScreen.tsx   # Vista de perfil de usuario
│   │   │   ├── hooks/
│   │   │   │   └── useProfile.ts       # Hook de datos del usuario
│   │   │   └── types/
│   │   │       └── index.ts            # Tipos de perfil
│   │   │
│   │   └── auth/                       # 🔒 MÓDULO DE AUTENTICACIÓN (Preparado para futuro)
│   │       ├── context/                # AuthContext (almacenará token y sesión de usuario)
│   │       ├── screens/                # LoginScreen, RegisterScreen (futuras)
│   │       ├── services/               # authService.ts (login, logout, refreshToken)
│   │       └── types/                  # AuthState, Credentials, AuthUser
│   │
│   ├── components/                     # 🎨 COMPONENTES UI COMPARTIDOS (Cross-Feature)
│   │   └── ui/
│   │       ├── LoadingSpinner.tsx      # Indicador de carga unificado
│   │       ├── ErrorView.tsx           # Vista genérica de error con reintento
│   │       ├── TagBadge.tsx            # Badge para categorías
│   │       └── Button.tsx              # Botón reutilizable con variantes (primary, outline)
│   │
│   ├── services/                       # 🌐 INFRAESTRUCTURA Y COMUNICACIÓN EXTERNA
│   │   ├── api/
│   │   │   ├── apiClient.ts            # Wrapper centralizado de fetch / axios
│   │   │   └── endpoints.ts            # Definición centralizada de URLs y endpoints
│   │   └── storage/
│   │       └── storageService.ts       # Abstracción de persistencia local (AsyncStorage/SecureStore)
│   │
│   ├── theme/                          # 🎭 TOKENS DE DISEÑO Y ESTILOS GLOBALES
│   │   ├── colors.ts                   # Paleta centralizada (movida desde ./theme/colors.js)
│   │   └── index.ts                    # Exportación general del tema
│   │
│   ├── types/                          # 📝 TIPOS GLOBALES Y COMPARTIDOS
│   │   ├── api.ts                      # Interfaces de respuestas estándar (ApiResponse<T>, ApiError)
│   │   └── navigation.ts               # Tipos complementarios de navegación
│   │
│   └── utils/                          # 🛠️ UTILIDADES PURAS Y FORMATEADORES
│       ├── formatters.ts               # Formateo de moneda ($ AR), strings, fechas
│       └── constants.ts                # Constantes de configuración general
│
├── app.json
├── package.json
└── tsconfig.json
```

---

## 4. Responsabilidades de Cada Carpeta

Para evitar que el código se desordene a medida que crezca el equipo o las funcionalidades, se establecen límites de responsabilidad estrictos:

```
┌──────────────────────────────────────────────────────────────┐
│                    src/app/ (Expo Router)                    │
│   Solo routing, layouts, lectura de params y montaje UI      │
└──────────────────────────────┬───────────────────────────────┘
                               │ importa
┌──────────────────────────────▼───────────────────────────────┐
│                    src/features/[feature]/                   │
│   Dominio completo: Screens, Components, Hooks, Data, Types  │
└──────────────┬───────────────────────────────┬───────────────┘
               │ usa                           │ consulta
┌──────────────▼───────────────┐ ┌─────────────▼───────────────┐
│        src/components/       │ │        src/services/        │
│   UI compartida agnóstica    │ │   Cliente HTTP, API, Storage│
└──────────────────────────────┘ └─────────────────────────────┘
```

### 4.1 `src/app/` (Capa de Navegación)
- **Qué contiene:** Únicamente archivos de rutas compatibles con Expo Router (`_layout.tsx`, `index.tsx`, `[id].tsx`).
- **Responsabilidad:** 
  - Declarar navegadores (`Stack`, `Tabs`).
  - Obtener parámetros de URL mediante `useLocalSearchParams()`.
  - Servir como punto de entrada montando la pantalla (`Screen`) correspondiente del feature.
- **Qué NO debe contener:**
  - Llamadas a APIs ni lógica de filtrado de datos.
  - Definición extensa de `StyleSheet` (solo estilos indispensables de layout/contenedor).
  - Estados locales de negocio o almacenamiento de datos.

### 4.2 `src/features/` (Capa de Módulos de Negocio)
Cada subcarpeta (`products`, `favorites`, `profile`, `auth`) es un módulo autónomo:
- **`screens/`:** Vistas completas de la funcionalidad (ej. `ProductsScreen.tsx`, `ProductDetailScreen.tsx`). No dependen directamente del sistema de archivos de Expo Router.
- **`components/`:** Componentes de presentación exclusivos del feature (ej. `ProductCard.tsx`, `FavoriteCard.tsx`).
- **`hooks/`:** Lógica de estado y consumo de servicios (ej. `useProducts.ts`, `useProductDetail.ts`).
- **`services/`:** Funciones de comunicación con la API correspondientes al dominio del feature.
- **`data/`:** Datos mock temporales mientras no se disponga de la API.
- **`types/`:** Interfaces y tipos TypeScript del modelo de datos de ese dominio.

### 4.3 `src/components/` (Componentes UI Reutilizables)
- **Responsabilidad:** Componentes visuales puros y atómicos que no conocen la lógica de negocio ni pertenecen a un dominio particular (ej. `Button`, `TagBadge`, `LoadingSpinner`, `ErrorView`).
- **Regla:** Un componente en `src/components/` nunca debe importar nada desde `src/features/`.

### 4.4 `src/services/` (Infraestructura de Red y Almacenamiento)
- **Responsabilidad:** 
  - Proporcionar la instancia base del cliente HTTP (`apiClient.ts`).
  - Gestionar encabezados comunes (`Content-Type`, `Authorization: Bearer ...`).
  - Unificar la captura y transformación de errores de red en objetos predecibles (`ApiError`).
  - Proveer abstracción para almacenamiento seguro o persistente (tokens, preferencias).

### 4.5 `src/theme/` (Sistema de Diseño)
- **Responsabilidad:** Única fuente de la verdad para tokens visuales (`colors.ts`). Cualquier componente de la app debe consumir colores desde `@/theme/colors`.

### 4.6 `src/utils/` (Utilidades Puras)
- **Responsabilidad:** Funciones utilitarias deterministas y sin efectos secundarios (ej. `formatCurrency(value)` para centralizar `$ 25.000` con `toLocaleString('es-AR')`, eliminando código repetido).

---

## 5. Mapeo de Archivos Actuales a su Ubicación Futura

A continuación se detalla la acción concreta para cada archivo existente inspeccionado:

| Archivo Actual | Acción | Ubicación Futura | Justificación Técnica |
| :--- | :---: | :--- | :--- |
| `theme/colors.js` | **Mover & Migrar** | `src/theme/colors.ts` | Centraliza el tema dentro del alias `@/*`. Permite exportar tipos (`ThemeColors`) y elimina la duplicación en 6 archivos. |
| `src/data/products.jsx` | **Dividir & Limpiar** | `src/features/products/data/mockProducts.ts` | Se elimina la copia residual del componente `ProductCard` y sus estilos. Queda únicamente el array de datos limpio y tipado. |
| `src/components/ProductCard.js` | **Mover & Migrar** | `src/features/products/components/ProductCard.tsx` | La tarjeta de producto pertenece exclusivamente al dominio de productos. Se migra a TypeScript y se conecta a `@/theme/colors`. |
| `src/context/FavoritesContext.jsx` | **Mover & Migrar** | `src/features/favorites/context/FavoritesContext.tsx` | El contexto es propio del feature de favoritos. Se ubica en su módulo y se tipa adecuadamente. |
| `src/app/_layout.tsx` | **Modificar** | `src/app/_layout.tsx` | Se conserva como Root Layout. Se corrige la ruta de importación de `FavoritesProvider` a `@/features/favorites/context/FavoritesContext`. |
| `src/app/(tabs)/_layout.jsx` | **Modificar & Migrar** | `src/app/(tabs)/_layout.tsx` | Se reemplazan los colores locales por `@/theme/colors`. Se incorpora la pestaña `perfil` faltante. |
| `src/app/(tabs)/index.jsx` | **Reemplazar por Thin Wrapper** | `src/app/(tabs)/index.tsx` | Queda como ruta limpia que delega la visualización a `src/features/products/screens/ProductsScreen.tsx`. |
| `src/app/(tabs)/favoritos.jsx` | **Dividir & Reemplazar por Thin Wrapper** | `src/app/(tabs)/favoritos.tsx` | La UI y la lógica de filtrado pasan a `src/features/favorites/screens/FavoritesScreen.tsx`. Se corrige el bug de navegación (`/product` -> `/producto`). |
| `src/app/(tabs)/perfil.jsx` | **Dividir & Reemplazar por Thin Wrapper** | `src/app/(tabs)/perfil.tsx` | La UI pasa a `src/features/profile/screens/ProfileScreen.tsx`. La ruta se integra al Tab Navigator. |
| `src/app/producto/[id].jsx` | **Dividir & Reemplazar por Thin Wrapper** | `src/app/producto/[id].tsx` | La ruta solo lee `id` de `useLocalSearchParams` y delega en `src/features/products/screens/ProductDetailScreen.tsx`. |

---

## 6. Estrategia para Preparar los Servicios de API

Actualmente la aplicación consume un array estático en memoria de forma sincrónica. Para que la transición a un backend real sea fluida y no obligue a reescribir componentes, se implementará el siguiente patrón de tres capas:

```
┌────────────────────────────────────────────────────────┐
│                   Componente / Screen                  │
│       Solo consume: const { products, loading, error } │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                    Custom Hook de Feature              │
│       Ej: useProducts() -> maneja estados async        │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                  Feature Service de Dominio            │
│       Ej: productsService.getProducts()                │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                 Infraestructura: apiClient             │
│       Cliente HTTP común, interceptores y auth header  │
└────────────────────────────────────────────────────────┘
```

### 6.1 Infraestructura Central (`src/services/api/apiClient.ts`)
- **Cliente unificado:** Implementación basada en `fetch` nativo (o `axios`), encapsulando:
  - `baseURL` configurable vía variables de entorno (`process.env.EXPO_PUBLIC_API_URL`).
  - Timeout por defecto.
  - Encabezados comunes (`Accept`, `Content-Type: application/json`).
  - **Interceptor de Autenticación (Hook para Auth futura):** Antes de cada petición, comprueba si existe un token en el almacenamiento seguro. Si existe, inyecta automáticamente `Authorization: Bearer <token>`.
  - **Manejo Centralizado de Errores:** Convierte códigos HTTP (400, 401, 403, 404, 500) o fallas de conexión en una clase estándar `ApiError` con mensaje amigable.

### 6.2 Servicios Específicos por Feature (`src/features/*/services/`)
- Cada feature define su propio servicio desacoplado:
  ```typescript
  // src/features/products/services/productsService.ts
  export const productsService = {
    async getProducts(): Promise<Product[]> {
      // En Fase Inicial: puede retornar mockProducts con delay simulado.
      // En Producción: return apiClient.get<Product[]>(ENDPOINTS.PRODUCTS);
    },
    async getProductById(id: number): Promise<Product | null> {
      // En Fase Inicial: busca en mockProducts.
      // En Producción: return apiClient.get<Product>(ENDPOINTS.PRODUCT_DETAIL(id));
    }
  };
  ```

### 6.3 Hooks Reactivos para Consumo de Datos (`src/features/*/hooks/`)
- Las pantallas no llaman a `apiClient` directamente. Utilizan hooks que administran el ciclo de vida:
  ```typescript
  // Retorno estandarizado de los hooks de datos:
  interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }
  ```
- **Ventaja inmediata:** Durante la etapa de desarrollo local, el hook consume el servicio que devuelve los datos mock. Cuando el backend esté listo, **solo se modifica el cuerpo del servicio**, sin tocar un solo componente visual ni alterar las pantallas.

### 6.4 Preparación para Autenticación Futura (Sin Implementar Código Ahora)
- **Estructura lista:** El directorio `src/features/auth/` queda reservado con su diseño arquitectónico:
  - `context/AuthContext.tsx`: Almacenará `{ user, token, isAuthenticated, login, logout }`.
  - `services/authService.ts`: Implementará `login(credentials)` y `logout()`.
- **Protección de rutas:** Expo Router permite agrupar rutas protegidas con grupos `(app)` y `(auth)` o mediante redirección en el layout raíz cuando `isAuthenticated` sea false. La arquitectura modular propuesta ya es 100% compatible con este patrón.

---

## 7. Evaluación de Lenguaje: JavaScript vs. TypeScript

### Estado Actual
- El proyecto ya posee instalado `typescript: ~6.0.3` y `@types/react: ~19.2.2`.
- Existe `tsconfig.json` con `strict: true` y `app.json` tiene activado `typedRoutes: true`.
- Sin embargo, casi todos los componentes están escritos en `.jsx` y `.js`, sin interfaces ni validación de props.

### Recomendación Técnica: Migración Progresiva a TypeScript
**No se recomienda mantener JavaScript.** La presencia de TypeScript junto con `typedRoutes` de Expo Router ofrece ventajas indispensables para una aplicación mobile que crecerá con API y autenticación:
1. **Rutas Tipadas:** Expo Router genera tipos automáticos para `router.push('/producto/[id]')`. Un error de tipado como el que existe actualmente (`/product/` en vez de `/producto/`) es detectado instantáneamente en tiempo de compilación.
2. **Contratos de API:** Al conectar endpoints, tipar las respuestas (`Product`, `UserProfile`) previene errores comunes en runtime (`undefined is not an object` al leer propiedades inexistentes).
3. **Refactorización Segura:** Al mover carpetas y archivos, el compilador de TypeScript (`npx tsc --noEmit`) alerta de inmediato sobre cualquier import roto.

### Estrategia de Migración: Progresiva y sin Bloqueos
- **Paso 1:** Tipar modelos de datos y tema (`colors.ts`, `Product.ts`).
- **Paso 2:** Migrar componentes atómicos (`ProductCard.tsx`, `FavoriteCard.tsx`).
- **Paso 3:** Migrar contextos y hooks (`FavoritesContext.tsx`, `useFavorites.ts`).
- **Paso 4:** Migrar rutas de navegación (`app/**/*.tsx`).
- Al permitir TypeScript la coexistencia de `.js`/`.jsx` y `.ts`/`.tsx`, la migración no requiere reescribir todo en un solo paso ni detiene el flujo de trabajo.

---

## 8. Plan de Migración por Etapas

La reorganización debe ejecutarse en fases incrementales para asegurar que la aplicación permanezca operativa en todo momento, facilitando el rollback si surge algún imprevisto.

```
┌────────────────────────────────────────────────────────┐
│  ETAPA 1: Higiene, Unificación de Theme y Mock Data    │
│  - Mover theme a src/theme/colors.ts                   │
│  - Limpiar src/data/products.jsx                       │
│  - Eliminar 'colors' duplicados                        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  ETAPA 2: Estructura de Features y Componentes         │
│  - Crear features/products, favorites, profile         │
│  - Mover ProductCard y FavoritesContext                │
│  - Desacoplar pantallas a features/*/screens           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  ETAPA 3: Normalización de Navegación y Rutas          │
│  - Convertir app/ en Thin Wrappers                     │
│  - Registrar 'perfil' en (tabs)/_layout                │
│  - Corregir link erróneo en Favoritos                  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  ETAPA 4: Capa de Servicios y Abstracción de Datos     │
│  - Crear apiClient y endpoints                         │
│  - Crear productsService y hooks (useProducts)         │
│  - Dejar listo el slot de Auth                         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  ETAPA 5: Tipado Estricto y Validación Final           │
│  - Chequeo con tsc --noEmit                            │
│  - Verificación en simulador / Expo Go                 │
└────────────────────────────────────────────────────────┘
```

### Etapa 1: Higiene, Unificación de Theme y Mock Data (Riesgo Bajo)
1. Crear la carpeta `src/theme/` y mover `theme/colors.js` hacia `src/theme/colors.ts`.
2. Reemplazar las 6 declaraciones locales duplicadas de `colors` por la importación unificada `import { colors } from '@/theme/colors';`.
3. Eliminar la carpeta huérfana `./theme` de la raíz.
4. Limpiar `src/data/products.jsx`:
   - Eliminar la copia de `ProductCard`, los estilos y los imports de React Native.
   - Dejar únicamente el array exportado de productos.
5. Comprobar que la app compila y no hay alteraciones visuales.

### Etapa 2: Estructura de Features y Componentes (Riesgo Medio)
1. Crear el árbol de carpetas en `src/features/products`, `src/features/favorites` y `src/features/profile`.
2. Mover `src/components/ProductCard.js` a `src/features/products/components/ProductCard.tsx`.
3. Mover `src/context/FavoritesContext.jsx` a `src/features/favorites/context/FavoritesContext.tsx`.
4. Mover los datos mock limpios a `src/features/products/data/mockProducts.ts`.
5. Extraer la presentación de las pantallas actuales hacia sus respectivos módulos:
   - `ProductsScreen.tsx` dentro de `features/products/screens/`.
   - `ProductDetailScreen.tsx` dentro de `features/products/screens/`.
   - `FavoritesScreen.tsx` dentro de `features/favorites/screens/`.
   - `ProfileScreen.tsx` dentro de `features/profile/screens/`.
6. Actualizar las referencias de importación en todos los archivos movidos utilizando el alias `@/`.

### Etapa 3: Normalización de Navegación y Rutas (Riesgo Medio)
1. Convertir los archivos en `src/app/` en *Thin Route Wrappers*:
   - `src/app/(tabs)/index.tsx`: solo renderiza `<ProductsScreen />`.
   - `src/app/(tabs)/favoritos.tsx`: solo renderiza `<FavoritesScreen />`.
   - `src/app/(tabs)/perfil.tsx`: solo renderiza `<ProfileScreen />`.
   - `src/app/producto/[id].tsx`: obtiene `id` de `useLocalSearchParams` y renderiza `<ProductDetailScreen id={id} />`.
2. Actualizar `src/app/(tabs)/_layout.tsx`:
   - Registrar la pestaña de `perfil` con su icono correspondiente (`person` / `person-outline`).
   - Utilizar `colors` centralizado para la barra de pestañas.
3. Corregir el bug en la navegación de favoritos: cambiar `/product/${item.id}` por `/producto/${item.id}`.

### Etapa 4: Capa de Servicios y Abstracción de Datos (Riesgo Bajo)
1. Crear `src/services/api/apiClient.ts` y `src/services/api/endpoints.ts`.
2. Implementar `src/features/products/services/productsService.ts` consumiendo los datos mock mediante promesas asíncronas para simular el comportamiento real de red.
3. Crear el hook `src/features/products/hooks/useProducts.ts` para que `ProductsScreen` consuma datos con manejo de carga y error.
4. Crear `src/utils/formatters.ts` con la función `formatCurrency` y aplicarla en las tarjetas y pantallas de detalle, eliminando el formato inline repetido.
5. Dejar preparada la estructura de carpetas de `src/features/auth/` sin código innecesario.

### Etapa 5: Tipado Estricto y Validación Final (Riesgo Bajo)
1. Declarar las interfaces completas en `src/features/products/types/index.ts` (`Product`, etc.).
2. Tipar las props de `ProductCard`, `FavoritesContext` y las pantallas.
3. Ejecutar diagnóstico de dependencias y tipos:
   - `npx tsc --noEmit`
   - `npx expo lint`
4. Probar manualmente todos los flujos de usuario en emulador o dispositivo físico.

---

## 9. Riesgos y Compatibilidad

| Riesgo Potencial | Causa | Medida Preventiva / Mitigación |
| :--- | :--- | :--- |
| **Rutas rotas en Expo Router** | Mover o renombrar archivos dentro de `src/app/` altera las rutas web y móviles del enrutador. | Mantener exactamente los mismos nombres de archivos en `src/app/` (`(tabs)/index`, `(tabs)/favoritos`, `(tabs)/perfil`, `producto/[id]`). No alterar la estructura de carpetas de `app/`. |
| **Fallas en resolución de alias `@/*`** | Metro Bundler o TypeScript podrían no resolver imports absolutos en Windows si no está bien configurado. | El proyecto ya tiene `"tsconfigPaths": true` en `app.json` y `paths: { "@/*": ["./src/*"] }` en `tsconfig.json`. Se validará con un build inicial de prueba. |
| **Incompatibilidades con React Compiler** | `app.json` tiene `"reactCompiler": true` activado con React 19. Funciones mutables o violación de reglas de hooks causan warnings o bugs. | Asegurar que todas las funciones de actualización de estado (como `toggleFavorite`) mantengan inmutabilidad estricta y dependencias correctas en hooks. |
| **Pérdida de estado de Favoritos** | `FavoritesContext` mantiene los IDs en memoria RAM del dispositivo. Al recargar con Fast Refresh o reiniciar, se vacía. | Mantener el estado actual en memoria durante la reorganización arquitectónica para no introducir librerías externas innecesarias, pero prever la interfaz para persistir con `AsyncStorage` en el futuro. |

---

## 10. Criterios de Aceptación y Verificación

Una vez ejecutada la reorganización en la etapa posterior, se considerará exitosa únicamente si se cumplen en su totalidad los siguientes criterios:

### 10.1 Verificación Técnica Automatizada
- [ ] **Compilación TypeScript limpia:** `npx tsc --noEmit` finaliza con `0` errores.
- [ ] **Linter sin alertas críticas:** `npx expo lint` finaliza con éxito.
- [ ] **Cero duplicación de Theme:** El objeto `colors` se importa exclusivamente desde `@/theme/colors`. No existe ninguna definición manual de colores en pantallas o componentes.
- [ ] **Limpieza de Data:** `src/features/products/data/mockProducts.ts` contiene solo datos y no importa ningún módulo de React Native (`Image`, `View`, `StyleSheet`).

### 10.2 Verificación Funcional y Visual (Regresión Cero)
- [ ] **Catálogo (`/`):**
  - Muestra la lista de productos con su alternancia de fondo (`alt={index % 2 === 1}`).
  - Las imágenes locales (`remera.jpg`, `zapatilla.jpg`, `gorra.jpg`) se cargan sin problemas.
  - Al presionar una tarjeta, navega con fluidez a `/producto/[id]`.
- [ ] **Detalle de Producto (`/producto/[id]`):**
  - Renderiza correctamente imagen, tag de categoría, título, descripción y precio formateado.
  - El botón "Volver" regresa al catálogo.
  - El botón "Añadir a Favoritos" actualiza el estado global (alterna entre "🤍 Añadir a Favoritos" y "❤️ En Favoritos").
  - El botón "Comprar Ahora" dispara la alerta correspondiente.
- [ ] **Favoritos (`/favoritos`):**
  - Si no hay favoritos, muestra la vista vacía ("Todavía no guardaste ningún producto").
  - Si hay favoritos, lista los productos guardados.
  - Al presionar un producto favorito, navega exitosamente a `/producto/[id]` (validando la corrección del bug anterior).
- [ ] **Perfil (`/perfil`):**
  - La pestaña "Perfil" es visible en la barra de navegación inferior.
  - Al seleccionarla, muestra la pantalla con título y subtítulo ("Iniciá sesión para ver tus datos.").
- [ ] **Diseño Visual:**
  - La barra de navegación inferior flotante preserva su elevación, sombra, fondo `bgAlt` e iconos activos en color `teal`.
  - La paleta visual y tipografías se mantienen 100% fieles al diseño original.
