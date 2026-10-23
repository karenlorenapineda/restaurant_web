import { detectMimeType } from "./file-signature";

describe("detectMimeType", () => {
  it("detects PNG, JPEG, GIF, WebP and PDF by content", () => {
    expect(
      detectMimeType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
      ),
    ).toBe("image/png");
    expect(detectMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(detectMimeType(Buffer.from("GIF89a...", "latin1"))).toBe(
      "image/gif",
    );
    expect(detectMimeType(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "latin1"))).toBe(
      "image/webp",
    );
    expect(detectMimeType(Buffer.from("%PDF-1.7\n", "latin1"))).toBe(
      "application/pdf",
    );
  });

  it("rejects content that is not an allowed type", () => {
    expect(detectMimeType(Buffer.from("#!/bin/sh\necho hi"))).toBeNull();
    expect(detectMimeType(Buffer.alloc(0))).toBeNull();
  });
});
