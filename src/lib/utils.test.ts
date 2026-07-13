import { describe, it, expect } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts, last wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatDate", () => {
  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("formats an ISO date string", () => {
    const out = formatDate("2026-01-15T10:00:00Z");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toBe("Invalid Date");
  });
});
