import { ImageSourcePropType } from 'react-native';

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: ImageSourcePropType | string;
  descripcion: string;
}

export interface ProductCardProps {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: ImageSourcePropType | string;
  alt?: boolean;
}

export interface FakeStoreRating {
  rate: number;
  count: number;
}

export interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: FakeStoreRating;
}
