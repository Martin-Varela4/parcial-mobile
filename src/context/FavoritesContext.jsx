import React, { createContext, useContext, useState } from 'react';

// 1. Creamos el espacio de memoria global
const FavoritesContext = createContext();

// 2. Creamos el proveedor que envolverá a toda la aplicación
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  // Función para añadir o quitar un producto usando su ID
  const toggleFavorite = (id) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.includes(id)) {
        // Si ya existe, lo filtramos para eliminarlo
        return prevFavorites.filter((favId) => favId !== id);
      } else {
        // Si no existe, lo agregamos a la lista
        return [...prevFavorites, id];
      }
    });
  };

  // Función rápida para saber si un producto específico ya es favorito
  const isFavorite = (id) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
