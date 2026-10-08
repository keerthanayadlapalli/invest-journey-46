export type PathId = "regular" | "onetime" | "stocks" | "etfs" | "learn";
export type Screen =
  | "entry" | "q1" | "q2" | "q3" | "q4" | "q5" | "q6"
  | "results" | "compare" | "browse" | "learn"
  | "select" | "amount" | "review" | "confirm" | "processing" | "success" | "mine";

export type Answers = {
  experience?: string | undefined;
  goal?: string | undefined; amount?: string | undefined; horizon?: string | undefined; dip?: string | undefined; style?: string | undefined;
};

export type Txn = { productId: string; path: PathId; amount: number; date?: string | undefined };

export type State = {
  screen: Screen;
  mode: "personal" | "browse";
  answers: Answers;
  path?: PathId | undefined;
  pathOrigin?: "results" | "compare" | "browse" | undefined;
  learnOrigin?: "results" | "browse" | "mine" | undefined;
  productId?: string | undefined;
  amount?: string | undefined;
  date: string;
  txn?: Txn | undefined;
};

export const initialState: State = { screen: "entry", mode: "browse", answers: {}, date: "5th" };

export const QUESTIONS = [
  { key: "experience", title: "Have you invested before?", sub: "This helps us understand where you’re starting from.",
    options: ["Never", "I’ve tried once or twice", "I invest sometimes"] },
  { key: "goal", title: "What are you investing for?", sub: "Choose what matters most to you.",
    options: ["Build long-term wealth", "Save for a future goal", "Build financial security", "I just want to start"] },
  { key: "amount", title: "How much could you comfortably invest each month?", sub: "Choose an amount that feels realistic for you.",
    options: ["₹500", "₹1,000", "₹2,500", "₹5,000", "₹10,000+", "Not sure yet"] },
  { key: "horizon", title: "When do you think you’ll need this money?", sub: "Your time horizon can help you understand different ways to start.",
    options: ["Within 1 year", "1–3 years", "3–5 years", "5+ years", "I’m not sure"] },
  { key: "dip", title: "If your investment temporarily fell by 10%, what would you do?", sub: "",
    options: ["I’d probably sell", "I’d wait and see", "I’d stay invested", "I’m not sure"] },
  { key: "style", title: "How would you like to invest?", sub: "There’s no right answer. Choose what feels realistic for you.",
    options: ["A little every month", "Occasionally when I have money", "I’m not sure yet"] },
] as const;

export const PATHS: Record<PathId, { title: string; desc: string; how: string; cadence: string; cta: string }> = {
  regular: { title: "Mutual funds · Regular investing", desc: "Invest a fixed amount in a mutual fund regularly through a SIP.", how: "A SIP is a way to invest a set amount on a chosen date each month into a mutual fund.", cadence: "Regular (monthly)", cta: "Explore" },
  onetime: { title: "Mutual funds · One-time investment", desc: "Invest a single amount in a mutual fund when you have money available.", how: "You invest one lump sum into a mutual fund. Nothing repeats.", cadence: "One-time", cta: "Explore" },
  stocks: { title: "Stocks", desc: "Own a small part of an individual company.", how: "Buy and sell shares in individual companies.", cadence: "One-time", cta: "Explore" },
  etfs: { title: "ETFs", desc: "Explore investments that track an index or market.", how: "Buy and sell units of an exchange-traded fund.", cadence: "One-time", cta: "Explore" },
  learn: { title: "Learn before investing", desc: "Understand the basics first, at your own pace.", how: "Understand your goals, time horizon and comfort with risk before choosing an investment.", cadence: "Learn first", cta: "Explore" },
};

export const PRODUCTS: Record<Exclude<PathId, "learn">, { id: string; name: string; desc: string }[]> = {
  regular: [
    { id: "nifty-sip", name: "Nifty 50 Index Fund", desc: "Index mutual fund · Monthly SIP" },
    { id: "lmc-sip", name: "Large & Mid Cap Fund", desc: "Mutual fund · Monthly SIP" },
  ],
  onetime: [
    { id: "nifty-ot", name: "Nifty 50 Index Fund", desc: "Index mutual fund · One-time investment" },
    { id: "flexi-ot", name: "Flexi Cap Fund", desc: "Mutual fund · One-time investment" },
  ],
  stocks: [
    { id: "stock-a", name: "Company A", desc: "Individual company shares" },
    { id: "stock-b", name: "Company B", desc: "Individual company shares" },
  ],
  etfs: [
    { id: "etf-a", name: "Broad Market ETF", desc: "Exchange-traded fund · Broad market" },
    { id: "etf-b", name: "Index ETF", desc: "Exchange-traded fund · Index tracking" },
  ],
};

export function findProduct(id?: string) {
  for (const list of Object.values(PRODUCTS)) {
    const p = list.find((x) => x.id === id);
    if (p) return p;
  }
  return undefined;
}

export function questionnaireComplete(a: Answers): boolean {
  return QUESTIONS.every(q => q.options.some(option => option === a[q.key]));
}

/** PDF sections 4–9: explicit precedence, not an invented numerical risk score.
 * Keep the original six questions; experience is not a recommendation input.
 * A short/unknown horizon takes precedence; the PDF explicitly permits learning alone.
 */
export function personalizedPaths(a: Answers): PathId[] {
  if (!a.goal || !a.amount || !a.horizon || !a.dip || !a.style) return ["learn"];
  if (a.horizon === "Within 1 year" || a.horizon === "I’m not sure") return ["learn"];
  const monthly = a.style === "A little every month";
  const occasional = a.style === "Occasionally when I have money";
  const uncertain = a.amount === "Not sure yet" || a.dip === "I’m not sure" || (!monthly && !occasional);
  const simpler: PathId[] = occasional ? ["onetime", "regular"] : ["regular", "onetime"];
  if (uncertain || a.horizon === "1–3 years") return ["learn", ...simpler];
  if (a.dip === "I’d probably sell") {
    // Section 9 example 2 keeps the monthly preference first; diversified funds
    // are the third path rather than aggressively surfacing stocks or equity ETFs.
    return monthly ? ["regular", "learn", "onetime"] : ["learn", ...simpler];
  }
  const first: PathId = occasional ? "onetime" : "regular";
  // Sections 6–9 permit stocks for longer horizons and hands-on interest;
  // examples 1 and 4 also permit exploration when staying invested for 5+ years.
  const stocks = a.dip === "I’d stay invested" && a.horizon === "5+ years" && a.goal !== "Build financial security";
  return [first, "etfs", stocks ? "stocks" : (first === "regular" ? "onetime" : "regular")];
}

export function whyShown(path: PathId, a: Answers): string {
  const quote = (v: string) => `“${v}”`;
  const reasons: string[] = [];
  if (path === "learn") {
    if (a.horizon === "Within 1 year") reasons.push(`you may need this money ${quote(a.horizon.toLowerCase())}, so time horizon matters before choosing an investment`);
    else if (a.horizon === "1–3 years") reasons.push(`your ${quote(a.horizon)} horizon calls for understanding how investments can behave over shorter periods`);
    else if (a.horizon === "I’m not sure") reasons.push(`you answered ${quote(a.horizon)} about when you need the money`);
    if (a.dip === "I’m not sure" || a.dip === "I’d probably sell") reasons.push(`you answered ${quote(a.dip)} about a temporary 10% fall, so understanding risk first may help`);
    if (a.amount === "Not sure yet") reasons.push(`you answered ${quote(a.amount)} about your monthly amount, so you can learn before committing money`);
    if (a.style === "I’m not sure yet") reasons.push(`you answered ${quote(a.style)} about investing style, so there is no need to choose a recurring commitment yet`);
  } else {
    if (path === "regular" && a.style === "A little every month") reasons.push(`you prefer ${quote(a.style.toLowerCase())}, which matches a fixed monthly SIP`);
    if (path === "onetime" && a.style === "Occasionally when I have money") reasons.push(`you prefer ${quote(a.style.toLowerCase())}, which matches investing without a recurring commitment`);
    if (a.goal === "Build long-term wealth") reasons.push(`your goal is ${quote(a.goal.toLowerCase())}, making longer-term approaches worth exploring`);
    if (a.goal === "Save for a future goal") reasons.push(`you want to ${quote(a.goal.toLowerCase())} and your ${quote(a.horizon ?? "")} horizon matters before choosing an investment`);
    if (a.goal === "Build financial security") reasons.push(`you want to ${quote(a.goal.toLowerCase())}, so understanding what you can comfortably afford comes first`);
    if (a.goal === "I just want to start" && path === "regular") reasons.push(`you said ${quote(a.goal)}, so a simple regular investing habit may be worth exploring`);
    if (path === "etfs" || path === "stocks") {
      if (a.horizon) reasons.push(`your time horizon is ${quote(a.horizon)}`);
      if (a.dip) reasons.push(`you said ${quote(a.dip)} during a temporary 10% fall`);
      reasons.push(path === "etfs" ? "this makes a diversified market-tracking approach worth exploring, while its value can still move with the market" : "this allows you to explore individual companies, if you want a more hands-on approach; individual-stock risk still matters");
    }
    if ((path === "regular" || path === "onetime") && (a.amount === "₹500" || a.amount === "₹1,000")) reasons.push(`you selected ${quote(a.amount)} per month; starting small with a diversified fund can be an option, depending on the fund`);
    if (a.dip === "I’d probably sell") reasons.push(`you said ${quote(a.dip)} during a temporary fall, so understanding a fund’s diversification and ups and downs matters`);
    if (a.horizon === "1–3 years") reasons.push("over 1–3 years, equity-oriented investments require caution; this is an option to understand, not a conclusion that it fits your goal");
    if (a.dip === "I’m not sure") reasons.push("because you are unsure about risk, learn about ups and downs before deciding");
    if (a.amount === "Not sure yet") reasons.push("because your amount is undecided, explore without committing to an investment");
  }
  return reasons.length ? `Based on your answers, ${reasons.join("; ")}.` : "There isn’t enough information to surface an investment category confidently. Understanding the basics first may help.";
}

export const COMPARISON_ROWS = ["What is it?", "How you invest", "Involvement", "Diversification", "What to consider"] as const;
export const COMPARISONS: Record<PathId, string[]> = {
  regular: ["Mutual fund through regular investing", "A fixed amount regularly through a SIP", "Low", "Depends on the fund", "Regular commitment; invest only what you can comfortably afford"],
  onetime: ["Mutual fund through a one-time investment", "A single amount when money is available", "No recurring commitment", "Depends on the fund", "Your time horizon and comfort with risk before choosing a fund"],
  etfs: ["Tracks an index or market", "Buy and sell units", "Medium", "Often diversified", "Market movement"],
  stocks: ["Individual companies", "Buy and sell shares", "Higher; a hands-on approach", "Depends on stocks chosen", "Higher individual-stock risk"],
  learn: ["Understand investing before choosing", "Learning first, without an investment", "Learn at your own pace", "Learn what diversification means", "Clarify goals, time horizon, risk comfort and investing preference"],
};

/** Revisiting a question clears it and every later answer. */
export function navigateState(s: State, screen: Screen, patch: Partial<State> = {}): State {
  const next = { ...s, ...patch, screen };
  const index = ["q1", "q2", "q3", "q4", "q5", "q6"].indexOf(screen);
  if (index >= 0) {
    next.answers = { ...next.answers };
    QUESTIONS.slice(index).forEach(q => { delete next.answers[q.key]; });
  }
  if ((screen === "results" || screen === "compare") && !questionnaireComplete(next.answers)) return { ...next, screen: "q1", answers: {} };
  return next;
}

export function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** Sanitize persisted state: never restore into an unconfirmed transaction. */
export function restore(s: Partial<State> | null): State {
  if (!s || typeof s !== "object" || !s.screen) return initialState;
  const st = { ...initialState, ...s } as State;
  if (/^q[1-6]$/.test(st.screen)) return navigateState(st, "q1");
  if ((st.screen === "results" || st.screen === "compare") && !questionnaireComplete(st.answers)) return navigateState(st, "q1");
  if (st.screen === "processing") st.screen = "confirm";
  if ((st.screen === "success" || st.screen === "mine") && !st.txn) return initialState;
  if (["amount", "review", "confirm"].includes(st.screen) && !findProduct(st.productId)) return initialState;
  if (st.screen === "select" && (!st.path || st.path === "learn")) return initialState;
  return st;
}
