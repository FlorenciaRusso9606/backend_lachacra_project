export const mockS3Send = vi.fn();

export const s3 = {
  send: mockS3Send,
};