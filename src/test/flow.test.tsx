import { describe, it, expect } from "vitest";
import { parseAmount, personalizedPaths, restore, initialState } from "@/lib/flow";

describe("flow rules", () => {
  it("rejects zero, negative, empty and invalid amounts", () => {
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("1,000")).toBe(1000);
  });
  it("prioritises learning for short horizons", () => {
    expect(personalizedPaths({ horizon: "Within 1 year" })[0]).toBe("learn");
  });
  it("never restores into success without a confirmed transaction", () => {
    expect(restore({ ...initialState, screen: "success" })).toEqual(initialState);
  });
  it("refresh during processing returns to confirmation", () => {
    expect(restore({ ...initialState, screen: "processing", productId: "etf-a", path: "etfs", amount: "500" }).screen).toBe("confirm");
  });
});
