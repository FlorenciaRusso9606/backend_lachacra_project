export function calculateStock(current: number, quantity: number) {
  if (quantity > current) {
    throw new Error("Not enough stock");
  }
  return current - quantity;
}