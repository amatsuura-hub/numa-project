import { describe, it, expect } from "vitest";
import { NUMA_LEVELS, CATEGORIES, CATEGORY_ICONS } from "./index";

describe("NUMA_LEVELS", () => {
  it("has 6 levels (0-5)", () => {
    expect(NUMA_LEVELS).toHaveLength(6);
    NUMA_LEVELS.forEach((l, i) => {
      expect(l.level).toBe(i);
    });
  });

  it("has ascending minRate thresholds", () => {
    for (let i = 1; i < NUMA_LEVELS.length; i++) {
      expect(NUMA_LEVELS[i].minRate).toBeGreaterThan(NUMA_LEVELS[i - 1].minRate);
    }
  });

  it("level 0 starts at 0%", () => {
    expect(NUMA_LEVELS[0].minRate).toBe(0);
  });

  it("level 5 starts at 81%", () => {
    expect(NUMA_LEVELS[5].minRate).toBe(81);
  });

  it("each level has name and color", () => {
    NUMA_LEVELS.forEach((l) => {
      expect(l.name).toBeTruthy();
      expect(l.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe("CATEGORIES", () => {
  it("has 16 categories", () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(16);
  });

  it("every category has a corresponding icon", () => {
    for (const key of Object.keys(CATEGORIES)) {
      expect(CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]).toBeTruthy();
    }
  });
});
