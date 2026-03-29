import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock react-helmet-async globally since tests don't have HelmetProvider
vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => children,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));
