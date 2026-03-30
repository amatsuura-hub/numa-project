import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./getErrorMessage";

describe("getErrorMessage", () => {
  it("returns message from Error instance", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns message from API error response", () => {
    const err = {
      response: {
        data: {
          error: { message: "unauthorized" },
        },
      },
    };
    expect(getErrorMessage(err)).toBe("unauthorized");
  });

  it("returns message from flat data.message", () => {
    const err = {
      response: {
        data: { message: "not found" },
      },
    };
    expect(getErrorMessage(err)).toBe("not found");
  });

  it("returns message from top-level message property", () => {
    expect(getErrorMessage({ message: "something" })).toBe("something");
  });

  it("returns default for null", () => {
    expect(getErrorMessage(null)).toBe("予期しないエラーが発生しました");
  });

  it("returns default for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("予期しないエラーが発生しました");
  });

  it("returns default for number", () => {
    expect(getErrorMessage(42)).toBe("予期しないエラーが発生しました");
  });

  it("returns default for string", () => {
    expect(getErrorMessage("raw string")).toBe("予期しないエラーが発生しました");
  });
});
