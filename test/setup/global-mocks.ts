import { vi } from "vitest";

export const mockS3Send = vi.fn();

vi.mock("@/lib/s3", () => ({
  s3: {
    send: mockS3Send,
  },
}));

vi.mock("@/services/email.service", () => ({
  sendNewOrderEmail: vi.fn(),
  sendCustomerOrderEmail: vi.fn(),
}));