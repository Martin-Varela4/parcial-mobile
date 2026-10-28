/**
 * Formatea un número al formato monetario estándar de Argentina ($ XX.XXX)
 */
export function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-AR')}`;
}
