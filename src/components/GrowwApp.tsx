import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronDown, Sprout, BookOpen, CalendarClock, Coins, LineChart, Layers, ShieldCheck } from "lucide-react";
import {
  type PathId, type Screen, type State, QUESTIONS, PATHS, PRODUCTS, findProduct,
  personalizedPaths, whyShown, parseAmount, inr, restore, initialState,
} from "@/lib/flow";

const KEY = "groww-demo-state-v1";
const ICONS: Record<PathId, typeof Sprout> = { regular: CalendarClock, onetime: Coins, stocks: LineChart, etfs: Layers, learn: BookOpen };
const qScreens: Screen[] = ["q1", "q2", "q3", "q4", "q5", "q6"];

export default function GrowwApp() {
  const [s, setS] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setS(restore(JSON.parse(localStorage.getItem(KEY) || "null"))); } catch { setS(initialState); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready]);
  useEffect(() => { window.scrollTo(0, 0); }, [s.screen]);

  const up = (p: Partial<State>) => setS((o) => ({ ...o, ...p }));
  const go = (screen: Screen, p: Partial<State> = {}) => up({ ...p, screen });

  if (!ready) return <Shell><div className="h-screen" /></Shell>;

  const qi = qScreens.indexOf(s.screen);
  let body: ReactNode;
  if (qi >= 0) body = <Question key={s.screen} s={s} i={qi} up={up} go={go} />;
  else switch (s.screen) {
    case "entry": body = <Entry go={go} />; break;
    case "results": body = <Results s={s} go={go} />; break;
    case "compare": body = <Compare s={s} go={go} />; break;
    case "browse": body = <Browse s={s} go={go} />; break;
    case "learn": body = <Learn s={s} go={go} />; break;
    case "select": body = <Select s={s} go={go} />; break;
    case "amount": body = <Amount s={s} up={up} go={go} />; break;
    case "review": body = <Review s={s} go={go} />; break;
    case "confirm": body = <Confirm s={s} setS={setS} />; break;
    case "processing": body = <Processing />; break;
    case "success": body = <Success s={s} go={go} />; break;
    case "mine": body = <Mine s={s} go={go} />; break;
  }
  return <Shell><div key={s.screen} className="animate-in fade-in slide-in-from-right-2 duration-300">{body}</div></Shell>;
}

/* ---------- layout bits ---------- */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md bg-background sm:border-x sm:border-border">
        <header className="flex items-center gap-2 px-5 pt-5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Sprout className="h-4 w-4" /></span>
          <span className="font-bold tracking-tight text-foreground">Groww</span>
          <span className="ml-auto rounded-full bg-mint/20 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">Case study prototype</span>
        </header>
        {children}
      </div>
    </div>
  );
}
function Back({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Back" className="-ml-2 mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-card"><ArrowLeft className="h-5 w-5" /></button>;
}
function Page({ children, cta }: { children: ReactNode; cta?: ReactNode }) {
  return (<>
    <main className="px-5 pb-40 pt-4">{children}</main>
    {cta && <div className="fixed inset-x-0 bottom-0 z-10"><div className="mx-auto max-w-md space-y-2 border-t border-border bg-card p-4">{cta}</div></div>}
  </>);
}
function H({ title, sub }: { title: string; sub?: string | undefined }) {
  return <div className="mb-6"><h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">{title}</h1>{sub && <p className="mt-2 text-muted-foreground">{sub}</p>}</div>;
}
function Btn({ children, variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const v = variant === "primary" ? "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
    : variant === "outline" ? "border border-border bg-card text-foreground hover:border-primary"
    : "text-primary hover:bg-primary/5";
  return <button {...p} className={`h-13 w-full rounded-xl px-4 py-3.5 text-[15px] font-semibold transition ${v} ${p.className ?? ""}`}>{children}</button>;
}
function Demo({ children = "DEMO INVESTMENT" }: { children?: ReactNode }) {
  return <span className="inline-block rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-foreground">{children}</span>;
}
function Notice({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm font-medium text-foreground"><ShieldCheck className="h-5 w-5 shrink-0 text-warning" /><div>{children}</div></div>;
}
function Rows({ rows }: { rows: [string, string][] }) {
  return <dl className="divide-y divide-border rounded-2xl border border-border bg-card">{rows.map(([k, v]) => (
    <div key={k} className="flex justify-between gap-4 px-4 py-3.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold text-foreground">{v}</dd></div>))}</dl>;
}
function Err({ msg }: { msg?: string | undefined }) { return msg ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{msg}</p> : null; }

type Go = (s: Screen, p?: Partial<State>) => void;

/* ---------- screens ---------- */
function Entry({ go }: { go: Go }) {
  return (
    <Page cta={<><Btn onClick={() => go("q1", { mode: "personal" })}>Get started</Btn><Btn variant="ghost" onClick={() => go("browse", { mode: "browse" })}>I’ll explore on my own</Btn></>}>
      <div className="mt-10 mb-8 grid h-40 place-items-center rounded-3xl bg-mint/15">
        <div className="flex items-end gap-2">{[40, 64, 52, 88, 110].map((h, i) => <div key={i} style={{ height: h }} className={`w-6 rounded-t-lg ${i === 4 ? "bg-primary" : "bg-mint"}`} />)}</div>
      </div>
      <H title="Not sure where to start investing?" sub="Tell us a little about yourself and we’ll help you understand where you could start." />
      <ul className="space-y-2 text-sm text-muted-foreground">
        {["6 quick questions, about a minute", "Plain-language options, no jargon", "Everything here is demo — no real money"].map((t) => (
          <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{t}</li>))}
      </ul>
    </Page>
  );
}

function Question({ s, i, up, go }: { s: State; i: number; up: (p: Partial<State>) => void; go: Go }) {
  const q = QUESTIONS[i]!;
  const val = s.answers[q.key as keyof typeof s.answers];
  const [err, setErr] = useState<string>();
  const [why, setWhy] = useState(false);
  const last = i === 5;
  const next = () => { if (!val) return setErr("Please select an option to continue."); go(last ? "results" : qScreens[i + 1]!); };
  return (
    <Page cta={<Btn onClick={next}>{last ? "See my options" : "Continue"}</Btn>}>
      <Back onClick={() => go(i === 0 ? "entry" : qScreens[i - 1]!)} />
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Step {i + 1} of 6</p>
        <div className="flex gap-1.5">{qScreens.map((_, j) => <div key={j} className={`h-1.5 flex-1 rounded-full ${j <= i ? "bg-mint" : "bg-border"}`} />)}</div>
      </div>
      <H title={q.title} sub={q.key === "dip" ? undefined : q.sub} />
      <div role="radiogroup" className="space-y-3">
        {q.options.map((o) => {
          const on = val === o;
          return (
            <button key={o} role="radio" aria-checked={on} onClick={() => { setErr(undefined); up({ answers: { ...s.answers, [q.key]: o } }); }}
              className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left text-[15px] font-medium text-foreground transition ${on ? "border-primary bg-mint/15" : "border-border bg-card hover:border-primary/40"}`}>
              {o}
              <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
            </button>);
        })}
      </div>
      <Err msg={err} />
      {q.key === "dip" && (
        <div className="mt-5">
          <button onClick={() => setWhy(!why)} className="text-sm font-semibold text-primary">Why are you asking this?</button>
          {why && <p className="mt-2 rounded-xl bg-card p-3 text-sm text-muted-foreground">We ask this to understand how comfortable you may be with short-term ups and downs.</p>}
        </div>)}
    </Page>
  );
}

function PathCard({ id, onPick, why }: { id: PathId; onPick: () => void; why?: string }) {
  const p = PATHS[id]; const Icon = ICONS[id]; const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint/20 text-foreground"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0"><h3 className="font-semibold text-foreground">{p.title}</h3><p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p></div>
      </div>
      {why && <>
        <button onClick={() => setOpen(!open)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Why am I seeing this? <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} /></button>
        {open && <p className="mt-2 text-sm text-muted-foreground">{why}</p>}
      </>}
      <Btn variant="outline" className="mt-4 !py-2.5" onClick={onPick}>{p.cta}</Btn>
    </div>
  );
}

function pick(go: Go, id: PathId, origin: "results" | "compare" | "browse") {
  if (id === "learn") go("learn", { learnOrigin: origin === "browse" ? "browse" : "results" });
  else go("select", { path: id, pathOrigin: origin });
}

function Results({ s, go }: { s: State; go: Go }) {
  const list = personalizedPaths(s.answers);
  return (
    <Page cta={<><Btn onClick={() => go("compare")}>Compare options</Btn><Btn variant="ghost" onClick={() => go("browse")}>Browse all options</Btn></>}>
      <Back onClick={() => go("q6")} />
      <H title="Here’s a starting point for you" sub="Based on what you told us, here are a few ways you could start." />
      <div className="space-y-3">{list.map((id) => <PathCard key={id} id={id} why={whyShown(id, s.answers)} onPick={() => pick(go, id, "results")} />)}</div>
      <p className="mt-5 text-xs text-muted-foreground">These are illustrative demo options for this prototype, not financial advice.</p>
    </Page>
  );
}

function Compare({ s, go }: { s: State; go: Go }) {
  const list = personalizedPaths(s.answers);
  return (
    <Page cta={<Btn variant="ghost" onClick={() => go("browse")}>Browse all options</Btn>}>
      <Back onClick={() => go("results")} />
      <H title="Compare your options" sub="How each way of starting works, side by side." />
      <div className="space-y-3">{list.map((id) => { const p = PATHS[id]; return (
        <div key={id} className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">{p.title}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">How it works</dt><dd className="text-foreground">{p.how}</dd></div>
            <div><dt className="text-muted-foreground">Regular or one-time</dt><dd className="font-medium text-foreground">{p.cadence}</dd></div>
          </dl>
          <Btn className="mt-4 !py-2.5" onClick={() => pick(go, id, "compare")}>Choose this</Btn>
        </div>); })}</div>
      <p className="mt-5 text-sm text-muted-foreground">Note: a SIP is a way to invest regularly; a mutual fund is the investment product.</p>
    </Page>
  );
}

function Browse({ s, go }: { s: State; go: Go }) {
  return (
    <Page>
      <Back onClick={() => go(s.mode === "personal" ? "results" : "entry")} />
      <H title="Explore investing your way" sub="Here are a few options to help you understand how you could start." />
      <div className="space-y-3">{(Object.keys(PATHS) as PathId[]).map((id) => <PathCard key={id} id={id} onPick={() => pick(go, id, "browse")} />)}</div>
      <div className="mt-5 rounded-2xl bg-mint/15 p-4 text-sm text-foreground">A SIP is a way to invest regularly. A mutual fund is an investment product. You can use a SIP to invest in a mutual fund.</div>
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground">Want a more personalized starting point?</h3>
        <Btn className="mt-3" onClick={() => go("q1", { mode: "personal" })}>Help me find my starting point</Btn>
      </div>
    </Page>
  );
}

const LESSONS = [
  ["What is a stock?", "A stock is a small piece of ownership in one company. Its price can rise or fall based on how the company and market are doing."],
  ["What is a mutual fund?", "A mutual fund pools money from many people and a professional manager invests it across many stocks or bonds."],
  ["What is an ETF?", "An ETF (exchange-traded fund) is a basket of investments you can buy and sell on the stock exchange, much like a single stock."],
  ["What is a SIP?", "A SIP (Systematic Investment Plan) is a way to invest a fixed amount into a mutual fund on a set date, usually monthly. It’s a method, not a product."],
  ["Risk and return", "Investments that can grow more over time usually also move up and down more along the way. No return is guaranteed."],
  ["Diversification", "Spreading money across many investments so that one going down doesn’t affect everything you own as much."],
];
function Learn({ s, go }: { s: State; go: Go }) {
  const back = () => go(s.learnOrigin === "browse" || s.mode === "browse" ? "browse" : s.learnOrigin === "mine" ? "mine" : "results");
  return (
    <Page cta={<><p className="text-center text-sm font-semibold text-foreground">Ready to explore?</p><Btn onClick={() => go(s.mode === "browse" || s.learnOrigin === "browse" ? "browse" : "results")}>Back to options</Btn></>}>
      <Back onClick={back} />
      <H title="Learn the basics" sub="Short, plain-language explainers for first-time investors." />
      <div className="space-y-3">{LESSONS.map(([t, d]) => (
        <details key={t} className="group rounded-2xl border border-border bg-card p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground">{t}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
          <p className="mt-2 text-sm text-muted-foreground">{d}</p>
        </details>))}</div>
      <p className="mt-5 text-xs text-muted-foreground">This content is educational only and is not financial advice.</p>
    </Page>
  );
}

function Select({ s, go }: { s: State; go: Go }) {
  const path = s.path as Exclude<PathId, "learn">;
  return (
    <Page>
      <Back onClick={() => go(s.pathOrigin ?? (s.mode === "browse" ? "browse" : "results"))} />
      <H title={PATHS[path].title} sub={path === "regular" ? "A SIP is the way you invest regularly. The mutual fund below is the product you’d invest in." : path === "onetime" ? "Pick a mutual fund for a single investment. Nothing repeats." : "Pick an illustrative option to continue."} />
      <div className="space-y-3">{PRODUCTS[path].map((p) => (
        <div key={p.id} className={`rounded-2xl border-2 bg-card p-4 ${s.productId === p.id ? "border-primary" : "border-border"}`}>
          <Demo /><h3 className="mt-2 font-semibold text-foreground">{p.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
          <p className="mt-1 text-xs text-muted-foreground">Example for this prototype.</p>
          <Btn className="mt-4 !py-2.5" onClick={() => go("amount", { productId: p.id })}>Select</Btn>
        </div>))}</div>
    </Page>
  );
}

function Amount({ s, up, go }: { s: State; up: (p: Partial<State>) => void; go: Go }) {
  const [err, setErr] = useState<string>();
  const regular = s.path === "regular";
  const next = () => { if (!parseAmount(s.amount)) return setErr("Enter a valid amount."); go("review"); };
  return (
    <Page cta={<Btn onClick={next}>Review investment</Btn>}>
      <Back onClick={() => go("select")} />
      <Demo>DEMO ONLY</Demo>
      <div className="mt-3" />
      <H title="How much would you like to invest?" sub={`${findProduct(s.productId)?.name} · ${regular ? "per month" : "one-time"}`} />
      <label htmlFor="amt" className="text-sm font-medium text-muted-foreground">{regular ? "Amount per month" : "Amount"}</label>
      <div className={`mt-2 flex items-center rounded-2xl border-2 bg-card px-4 ${err ? "border-destructive" : "border-border focus-within:border-primary"}`}>
        <span className="text-2xl font-bold text-foreground">₹</span>
        <input id="amt" inputMode="numeric" value={s.amount ?? ""} aria-invalid={!!err} placeholder="0"
          onChange={(e) => { setErr(undefined); up({ amount: e.target.value }); }}
          className="w-full bg-transparent px-2 py-4 text-2xl font-bold text-foreground outline-none" />
      </div>
      <Err msg={err} />
      <div className="mt-3 flex flex-wrap gap-2">{[500, 1000, 2500, 5000].map((n) => (
        <button key={n} onClick={() => { setErr(undefined); up({ amount: String(n) }); }}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${parseAmount(s.amount) === n ? "border-primary bg-mint/15 text-foreground" : "border-border bg-card text-foreground"}`}>{inr(n)}</button>))}</div>
      {regular && <>
        <div className="mt-6"><p className="text-sm font-medium text-muted-foreground">Frequency</p><p className="mt-1 font-semibold text-foreground">Monthly</p></div>
        <p className="mt-6 text-sm font-medium text-muted-foreground">Investment date</p>
        <div className="mt-2 grid grid-cols-4 gap-2">{["5th", "10th", "15th", "20th"].map((d) => (
          <button key={d} onClick={() => up({ date: d })} className={`rounded-xl border-2 py-3 text-sm font-semibold text-foreground ${s.date === d ? "border-primary bg-mint/15" : "border-border bg-card"}`}>{d}</button>))}</div>
      </>}
    </Page>
  );
}

function summary(s: State): [string, string][] {
  const amt = parseAmount(s.amount) ?? 0; const regular = s.path === "regular";
  const rows: [string, string][] = [["Investment", findProduct(s.productId)?.name ?? ""], ["Path", PATHS[s.path!].title], ["Amount", regular ? `${inr(amt)} / month` : inr(amt)]];
  if (regular) rows.push(["Frequency", "Monthly"], ["Investment date", `${s.date} of every month`]);
  else rows.push(["Type", "Demo investment"]);
  return rows;
}

function Review({ s, go }: { s: State; go: Go }) {
  const [open, setOpen] = useState(false);
  return (
    <Page cta={<><Btn onClick={() => go("confirm")}>Continue to confirmation</Btn><Btn variant="ghost" onClick={() => go("amount")}>Edit</Btn></>}>
      <Back onClick={() => go("amount")} />
      <H title="Review your investment" />
      <Rows rows={summary(s)} />
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Why this path was shown</h3>
        <p className="mt-1 text-sm text-muted-foreground">{s.mode === "personal" && s.pathOrigin !== "browse" ? whyShown(s.path!, s.answers) : "You chose to explore this illustrative demo option."}</p>
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">What should I know? <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} /></button>
      {open && <p className="mt-2 text-sm text-muted-foreground">Investments can go up and down. Past performance does not guarantee future results.</p>}
      <div className="mt-4"><Notice>DEMO ONLY — This prototype does not use real money and no real investment will be created.</Notice></div>
    </Page>
  );
}

function Confirm({ s, setS }: { s: State; setS: React.Dispatch<React.SetStateAction<State>> }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const confirm = () => {
    if (lock.current) return; lock.current = true; setBusy(true);
    setS((o) => ({ ...o, screen: "processing" }));
    setTimeout(() => setS((o) => o.screen !== "processing" ? o : ({ ...o, screen: "success",
      txn: { productId: o.productId!, path: o.path!, amount: parseAmount(o.amount)!, date: o.path === "regular" ? o.date : undefined } })), 1800);
  };
  return (
    <Page cta={<><Btn disabled={busy} onClick={confirm}>Confirm demo investment</Btn><Btn variant="ghost" disabled={busy} onClick={() => setS((o) => ({ ...o, screen: "review" }))}>Go back</Btn></>}>
      <Back onClick={() => !busy && setS((o) => ({ ...o, screen: "review" }))} />
      <H title="Ready to continue?" sub="Demo transaction · No real money will be invested." />
      <Rows rows={summary(s).filter(([k]) => k !== "Path")} />
      <div className="mt-4"><Notice>Demo transaction. No real money will be invested and nothing will be created outside this prototype.</Notice></div>
    </Page>
  );
}

function Processing() {
  return (
    <main className="grid min-h-[80vh] place-items-center px-5 text-center" aria-live="polite">
      <div><div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-border border-t-primary" />
        <h1 className="mt-6 text-xl font-bold text-foreground">Setting up your demo investment…</h1>
        <p className="mt-1 text-muted-foreground">Please wait…</p></div>
    </main>
  );
}

function txnRows(s: State): [string, string][] {
  const t = s.txn!; const rows: [string, string][] = [["Investment", findProduct(t.productId)?.name ?? ""], ["Amount", t.path === "regular" ? `${inr(t.amount)} / month` : inr(t.amount)]];
  if (t.date) rows.push(["Frequency", "Monthly (simulated)"], ["Investment date", `${t.date} of every month (demo)`]);
  rows.push(["Status", "Completed — Demo"]);
  return rows;
}

function Success({ s, go }: { s: State; go: Go }) {
  const t = s.txn!;
  return (
    <Page cta={<Btn onClick={() => go("mine")}>View my investment</Btn>}>
      <div className="mt-8 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-mint/25"><div className="grid h-16 w-16 place-items-center rounded-full bg-mint text-foreground"><Check className="h-9 w-9" strokeWidth={3} /></div></div>
        <h1 className="mt-6 text-[26px] font-bold text-foreground">Investment completed!</h1>
        <p className="mt-2 text-muted-foreground">{t.path === "regular" ? "Your simulated monthly demo record is set up. This is not a real mandate or holding." : `${inr(t.amount)} demo investment recorded.`}</p>
      </div>
      <div className="mt-6"><Rows rows={txnRows(s)} /></div>
      <div className="mt-4"><Notice>Demo transaction — no real money was invested.</Notice></div>
    </Page>
  );
}

function Mine({ s, go }: { s: State; go: Go }) {
  return (
    <Page cta={<><Btn onClick={() => go("browse", { mode: "browse" })}>Explore more ways to invest</Btn>
      <div className="grid grid-cols-2 gap-2"><Btn variant="outline" onClick={() => go("learn", { learnOrigin: "mine" })}>Learn about investing</Btn><Btn variant="outline" onClick={() => go("entry")}>Back to Groww</Btn></div></>}>
      <div className="flex items-center justify-between"><h1 className="text-[26px] font-bold text-foreground">My Investment</h1><Demo>DEMO DATA</Demo></div>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">{s.txn!.path === "regular" ? "Simulated monthly demo" : "One-time demo"}</p>
        <p className="mt-1 text-lg font-bold text-foreground">{findProduct(s.txn!.productId)?.name}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"><Check className="h-3.5 w-3.5" />Completed — Demo</span>
      </div>
      <div className="mt-4"><Rows rows={txnRows(s)} /></div>
      {s.txn!.date && <p className="mt-3 text-sm text-muted-foreground">The monthly amount and date are demo details only. There is no real mandate and no upcoming charge.</p>}
      <div className="mt-4"><Notice>No real money was invested.</Notice></div>
    </Page>
  );
}
