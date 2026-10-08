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
  regular: { title: "Invest regularly", desc: "Put a fixed amount into a mutual fund every month using a SIP.", how: "A SIP is a way to invest a set amount on a chosen date each month into a mutual fund.", cadence: "Regular (monthly)", cta: "Explore" },
  onetime: { title: "Make a one-time investment", desc: "Invest a single amount into a mutual fund whenever you have money.", how: "You invest one lump sum into a mutual fund. Nothing repeats.", cadence: "One-time", cta: "Explore" },
  stocks: { title: "Explore stocks", desc: "Own a small part of a single company.", how: "A stock is a share in one company. Its value can move a lot day to day.", cadence: "One-time", cta: "Explore" },
  etfs: { title: "Explore ETFs", desc: "A basket of many stocks you can buy in one go.", how: "An ETF holds many investments and trades on the stock exchange like a stock.", cadence: "One-time", cta: "Explore" },
  learn: { title: "Learn before investing", desc: "Understand the basics first, at your own pace.", how: "Short, plain-language explainers. No money involved.", cadence: "No investment", cta: "Learn" },
};

export const PRODUCTS: Record<Exclude<PathId, "learn">, { id: string; name: string; desc: string }[]> = {
  regular: [
    { id: "nifty-sip", name: "Demo Nifty 50 Index Fund", desc: "Illustrative index mutual fund for monthly investing in this prototype." },
    { id: "lmc-sip", name: "Demo Large & Mid Cap Fund", desc: "Illustrative mutual fund for monthly investing in this prototype." },
  ],
  onetime: [
    { id: "nifty-ot", name: "Demo Nifty 50 Index Fund", desc: "Illustrative index mutual fund for a single investment." },
    { id: "flexi-ot", name: "Demo Flexi Cap Fund", desc: "Illustrative mutual fund for a single investment." },
  ],
  stocks: [
    { id: "stock-a", name: "Demo Stock A", desc: "Illustrative stock for this prototype." },
    { id: "stock-b", name: "Demo Stock B", desc: "Illustrative stock for this prototype." },
  ],
  etfs: [
    { id: "etf-a", name: "Demo ETF A", desc: "Illustrative ETF for this prototype." },
    { id: "etf-b", name: "Demo ETF B", desc: "Illustrative ETF for this prototype." },
  ],
};

export function findProduct(id?: string) {
  for (const list of Object.values(PRODUCTS)) {
    const p = list.find((x) => x.id === id);
    if (p) return p;
  }
  return undefined;
}

/** Pick 2–3 starting paths from the onboarding answers. */
export function personalizedPaths(a: Answers): PathId[] {
  const cautious = a.horizon === "Within 1 year" || a.dip === "I’d probably sell" || a.dip === "I’m not sure";
  let list: PathId[];
  if (cautious) list = ["learn", "onetime", "regular"];
  else if (a.style === "A little every month") list = ["regular", "etfs", "learn"];
  else if (a.style === "Occasionally when I have money") list = ["onetime", "etfs", "stocks"];
  else list = ["regular", "onetime", "learn"];
  if ((a.goal === "I just want to start" || a.experience === "Never") && !list.includes("learn")) list = [...list.slice(0, 2), "learn"];
  return list;
}

export function whyShown(path: PathId, a: Answers): string {
  const bits: string[] = [];
  if (path === "regular" && a.style) bits.push(`you said you’d like to invest “${a.style.toLowerCase()}”`);
  if (path === "onetime" && a.style) bits.push(`you said “${a.style.toLowerCase()}”`);
  if (path === "learn" && (a.dip || a.horizon)) bits.push(`you mentioned “${(a.dip ?? a.horizon)!.toLowerCase()}”, so understanding ups and downs first may help`);
  if ((path === "etfs" || path === "stocks") && a.horizon) bits.push(`your time horizon is “${a.horizon.toLowerCase()}”`);
  if (a.goal) bits.push(`your goal is to “${a.goal.toLowerCase()}”`);
  return `Based on what you told us, ${bits.join(" and ") || "this is one way you may want to explore"}. This is an illustrative demo option, not advice.`;
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
  if (st.screen === "processing") st.screen = "confirm";
  if ((st.screen === "success" || st.screen === "mine") && !st.txn) return initialState;
  if (["amount", "review", "confirm"].includes(st.screen) && !findProduct(st.productId)) return initialState;
  if (st.screen === "select" && (!st.path || st.path === "learn")) return initialState;
  return st;
}
