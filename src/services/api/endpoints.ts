export const ENDPOINTS = {
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
} as const;
