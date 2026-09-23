import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Gem,
  Landmark,
  WalletCards,
} from "lucide-react";
import { SupportButton } from "@/components/SupportButton";
import { RequestsButton } from "@/components/RequestsButton";
import { clearStoredUser, getStoredUser, type StoredUser } from "@/lib/auth";
import { createStocks, fmt, tick, toPath, type Stock } from "@/lib/market";
import { getBalance } from "@/lib/store";
import {
  currentProfit,
  formatRemaining,
  getSubscription,
  progressOf,
  remainingMs,
  settleSubscription,
  type Subscription,
} from "@/lib/subscription";

export const Route = createFileRoute("/market")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "السوق والمحفظة | Easy Money" },
      {
        name: "description",
        content:
          "تابع حركة الأسهم وأرباح المستثمرين لحظة بلحظة، وأدِر الإيداع والسحب من أعلى الصفحة.",
      },
      { property: "og:title", content: "السوق والمحفظة | Easy Money" },
      {
        property: "og:description",
        content: "أسعار متحركة، أرباح محفظتك، وإيداع وسحب في خطوة واحدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [stocks, setStocks] = useState<Stock[]>(() => createStocks());
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (u.isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    setUser(u);
    settleSubscription(u.identifier);
    setBalance(getBalance(u.identifier));
    setSub(getSubscription(u.identifier));
  }, [navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setStocks((s) => tick(s)), 1200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // إضافة أرباح الباقة للمحفظة تلقائياً بعد انتهاء مدتها + تحديث الرصيد
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      const credited = settleSubscription(user.identifier);
      if (credited) {
        setNotice(`تم إضافة أرباحك ${fmt(credited)} ج.م لرصيد محفظتك تلقائياً 🎉`);
        window.setTimeout(() => setNotice(null), 8000);
      }
      setBalance(getBalance(user.identifier));
    }, 2000);
    return () => window.clearInterval(id);
  }, [user]);

  // الأرباح لا تتحرك إلا عند الاشتراك في باقة
  const profit = sub ? currentProfit(sub, now) : 0;
  const subDone = sub ? progressOf(sub, now) >= 1 : false;

  if (!user) return null;



  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">
                $
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Easy Money</p>
                <p className="text-xs text-muted-foreground">أهلاً {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RequestsButton />
              <button
                onClick={() => {
                  clearStoredUser();
                  navigate({ to: "/", replace: true });
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate({ to: "/deposit" })}
            className="rounded-2xl bg-primary px-4 py-3 text-right font-bold text-primary-foreground transition hover:opacity-90"
          >
            <span className="block text-xs font-medium opacity-80">إيداع</span>
            إضافة رصيد ↓
          </button>
          <button
            onClick={() => navigate({ to: "/withdraw" })}
            className="rounded-2xl border border-accent/60 bg-accent/10 px-4 py-3 text-right font-bold text-accent transition hover:bg-accent/20"
          >
            <span className="block text-xs font-medium opacity-80">سحب</span>
            تحويل للحساب ↑
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/packages/$group", params: { group: "small" } })}
            className="flex min-h-14 items-center gap-2 justify-center whitespace-normal rounded-lg bg-secondary px-4 py-3 text-center font-bold transition hover:opacity-90"
          >
            <WalletCards aria-hidden="true" />
            باقات الاستثمار الصغيرة
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/packages/$group", params: { group: "large" } })}
            className="flex min-h-14 items-center gap-2 justify-center whitespace-normal rounded-lg border border-border bg-transparent px-4 py-3 text-center font-bold transition hover:bg-accent"
          >
            <Landmark aria-hidden="true" />
            باقات الاستثمار الضخمة
          </button>
        </div>
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="رصيد المحفظة" value={`${fmt(balance)} ج.م`} />
          <Stat
            label="أرباح الاستثمار"
            value={`${!sub && profit >= 0 ? "+" : ""}${fmt(profit)} ج.م`}
            tone={profit >= 0 ? "up" : "down"}
          />
          <Stat label="عدد الأسهم المتابعة" value={`${stocks.length}`} />
        </section>

        {sub && (
          <section className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                باقة {fmt(sub.amount)} ج.م — الاستلام {fmt(sub.returnAmount)} ج.م
              </p>
              <p className="text-sm text-muted-foreground">
                {subDone ? "تم اكتمال الباقة" : `الوقت المتبقي ${formatRemaining(remainingMs(sub, now))}`}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(progressOf(sub, now) * 100)}%` }}
              />
            </div>
            {subDone && (
              <p className="mt-3 text-sm text-primary">
                {sub.credited
                  ? `تم إضافة ${fmt(sub.returnAmount)} ج.م لمحفظتك ✅ — متاحة للسحب بعد دفع ضريبة الباقة (${fmt(sub.tax)} ج.م).`
                  : `أرباح باقة ${fmt(sub.amount)} ج.م هتتضاف لمحفظتك تلقائياً، ومتاحة للسحب بعد دفع ضريبة الباقة (${fmt(sub.tax)} ج.م).`}
              </p>
            )}
          </section>
        )}


        <h2 className="mt-7 text-lg font-bold">حركة الأسهم المباشرة</h2>
        <p className="text-sm text-muted-foreground">
          أسعار تجريبية تتحدث تلقائياً كل ثانية تقريباً.
        </p>

        <section className="mt-3 space-y-2">
          {stocks.map((s) => (
            <StockRow key={s.symbol} stock={s} />
          ))}
        </section>

      </div>
      <SupportButton />
    </main>
  );
}


function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          tone === "up" ? "text-primary" : tone === "down" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StockRow({ stock }: { stock: Stock }) {
  const up = stock.change >= 0;
  const prev = useRef(stock.price);
  const flash = stock.price > prev.current ? "up" : stock.price < prev.current ? "down" : null;
  prev.current = stock.price;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-24 flex-1">
        <p className="font-bold">{stock.name}</p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {stock.symbol}
        </p>
      </div>
      <svg viewBox="0 0 120 36" className="h-9 w-28 shrink-0" preserveAspectRatio="none">
        <path
          d={toPath(stock.history, 120, 36)}
          fill="none"
          strokeWidth="2"
          className={up ? "stroke-primary" : "stroke-destructive"}
          strokeLinecap="round"
        />
      </svg>
      <div className="min-w-24 text-left">
        <p
          className={`font-bold tabular-nums transition-colors duration-300 ${
            flash === "up" ? "text-primary" : flash === "down" ? "text-destructive" : ""
          }`}
          dir="ltr"
        >
          {fmt(stock.price)}
        </p>
        <p
          className={`text-xs tabular-nums ${up ? "text-primary" : "text-destructive"}`}
          dir="ltr"
        >
          {up ? "▲" : "▼"} {fmt(Math.abs(stock.change))}%
        </p>
      </div>
    </div>
  );
}

