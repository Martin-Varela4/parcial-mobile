import { ImageSourcePropType } from 'react-native';

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: ImageSourcePropType;
  descripcion: string;
}

export interface ProductCardProps {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: ImageSourcePropType;
  alt?: boolean;
}
