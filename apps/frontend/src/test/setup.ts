import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Legacy screen tests explicitly exercise the isolated demo; integration tests
// override this with VITE_DATA_MODE=api to exercise the production default.
beforeEach(() => vi.stubEnv("VITE_DATA_MODE", "demo"));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
