import { describe, it, expect } from "vitest";
import { calculateStock } from "@/services/product.service";

describe("ProductService - calculateStock", () => {
  it("should reduce stock correctly", () => {
    const result = calculateStock(10, 3);
    expect(result).toBe(7);
  });

  it("should throw if not enough stock", () => {
    expect(() => calculateStock(2, 5)).toThrow();
  });
});