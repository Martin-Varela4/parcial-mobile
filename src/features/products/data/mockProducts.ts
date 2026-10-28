import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 1,
    nombre: "Remera Oversize Verde",
    precio: 25000,
    categoria: "Indumentaria",
    imagen: require('@/assets/products/remera.jpg'), 
    descripcion: "Confeccionada en algodón 100% peinado de alto gramaje. Diseñada con un calce oversize urbano, cuello redondo con rib grueso y costuras reforzadas para garantizar una máxima durabilidad y un confort diario excepcional."
  },
  {
    id: 2,
    nombre: "Zapatillas Urbanas Blancas",
    precio: 65000,
    categoria: "Calzado",
    imagen: require('@/assets/products/zapatilla.jpg'),
    descripcion: "Zapatillas de diseño vanguardista con capellada de malla respirable y refuerzos en cuero sintético. Cuentan con una entresuela de EVA ligera que amortigua cada pisada y una suela de goma antideslizante ideal para el asfalto."
  },
  {
    id: 3,
    nombre: "Gorra Snapback Navy",
    precio: 15000,
    categoria: "Accesorios",
    imagen: require('@/assets/products/gorra.jpg'),
    descripcion: "Gorra con visera plana estructurada de 6 paneles. Incluye ojales bordados para una ventilación óptima y un cierre plástico regulable en la parte trasera que se adapta cómodamente a cualquier medida."
  },
];
