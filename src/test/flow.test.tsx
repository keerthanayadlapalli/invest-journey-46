import { describe, it, expect } from "vitest";
import { parseAmount, personalizedPaths, restore, initialState, navigateState, questionnaireComplete, whyShown, type Answers } from "@/lib/flow";

describe("flow rules", () => {
  const base: Answers = { experience: "Never", goal: "Build long-term wealth", amount: "₹1,000", horizon: "5+ years", dip: "I’d stay invested", style: "A little every month" };
  it("matches PDF example 1", () => {
    expect(personalizedPaths(base)).toEqual(["regular", "etfs", "stocks"]);
  });
  it("matches PDF example 2 without surfacing stocks", () => {
    expect(personalizedPaths({ ...base, dip: "I’d probably sell" })).toEqual(["regular", "learn", "onetime"]);
  });
  it("matches PDF example 3 with learning alone", () => {
    expect(personalizedPaths({ ...base, goal: "Save for a future goal", horizon: "Within 1 year", dip: "I’m not sure" })).toEqual(["learn"]);
  });
  it("matches PDF example 4", () => {
    expect(personalizedPaths({ ...base, goal: "I just want to start", amount: "₹2,500" })).toEqual(["regular", "etfs", "stocks"]);
  });
  it("prioritises one-time investing for occasional contributions", () => {
    expect(personalizedPaths({ ...base, style: "Occasionally when I have money" })[0]).toBe("onetime");
  });
  it("does not increase risk based on a higher amount alone", () => {
    expect(personalizedPaths({ ...base, amount: "₹10,000+", dip: "I’d probably sell" })).toEqual(personalizedPaths({ ...base, dip: "I’d probably sell" }));
  });
  it("prioritises learning when amount, risk, style or horizon is unknown", () => {
    for (const patch of [{ amount: "Not sure yet" }, { dip: "I’m not sure" }, { style: "I’m not sure yet" }, { horizon: "I’m not sure" }]) {
      expect(personalizedPaths({ ...base, ...patch })[0]).toBe("learn");
    }
  });
  it("does not use experience as an unsupported recommendation input", () => {
    expect(personalizedPaths({ ...base, experience: "I invest sometimes" })).toEqual(personalizedPaths(base));
  });
  it("returns learning rather than inventing categories for missing inputs", () => {
    expect(personalizedPaths({})).toEqual(["learn"]);
  });
  it("resets all answers when restarting", () => {
    expect(navigateState({ ...initialState, answers: base, screen: "results" }, "q1").answers).toEqual({});
  });
  it("clears a revisited question and later answers", () => {
    expect(navigateState({ ...initialState, answers: base }, "q3").answers).toEqual({ experience: "Never", goal: "Build long-term wealth" });
  });
  it("requires all six valid answers before results or comparison", () => {
    expect(questionnaireComplete(base)).toBe(true);
    for (const key of Object.keys(base) as (keyof Answers)[]) {
      const answers = { ...base }; delete answers[key];
      expect(questionnaireComplete(answers)).toBe(false);
      expect(navigateState({ ...initialState, answers }, "results").screen).toBe("q1");
      expect(navigateState({ ...initialState, answers }, "compare").screen).toBe("q1");
    }
  });
  it("explanations track the actual reason rather than claiming a monthly preference for occasional investing", () => {
    const why = whyShown("onetime", { ...base, style: "Occasionally when I have money" });
    expect(why).toContain("occasionally when i have money");
    expect(why).not.toContain("fixed monthly SIP");
  });
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
