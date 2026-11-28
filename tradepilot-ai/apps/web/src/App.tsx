import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, Boxes, BrainCircuit, CheckCircle2,
  ChevronDown, CircleDollarSign, Command, Globe2, LayoutDashboard,
  PackageSearch, Play, RefreshCw, Search, Settings2, ShieldAlert,
  ShieldCheck, ShoppingBag, Sparkles, Truck, XCircle, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type Provider = { name: string; model: string | null; configured: boolean };
type AgentItem = {
  key?: string;
  id?: string;
  name: string;
  department?: string;
  dept?: string;
  status?: string;
  state?: string;
  description?: string;
};
type AgentRunItem = {
  id: string;
  agentKey: string;
  status: string;
  provider?: string | null;
  error?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  output?: Record<string, any> | null;
};
type Opportunity = {
  id: string;
  title: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  targetCountry: string;
  currency: string;
  marketplace?: string | null;
  supplierPrice: string | number;
  shippingCost: string | number;
  platformFees: string | number;
  paymentFees: string | number;
  returnsReserve: string | number;
  taxAndDutyReserve: string | number;
  estimatedSalePrice: string | number;
  status: "DISCOVERED" | "RESEARCHING" | "APPROVED" | "REJECTED" | "LISTED" | "ARCHIVED";
  evidence?: Record<string, any> | null;
  createdAt: string;
};
type Supplier = {
  id: string;
  name: string;
  website?: string | null;
  countryCode: string;
  contactEmail?: string | null;
  sourceType: string;
  rating?: number | null;
  verified: boolean;
  shippingNotes?: string | null;
  returnPolicy?: string | null;
};
type AutopilotState = {
  config?: {
    enabled?: boolean;
    intervalMinutes?: number;
    minNetProfit?: number;
    minRoiPercent?: number;
    defaultShippingEstimate?: number;
    returnsReservePercent?: number;
    autoPromoteApproved?: boolean;
    seedKeywords?: string[];
  };
  running?: boolean;
  scheduled?: boolean;
  lastCycleAt?: string | null;
};
type MarketInfo = Record<string, any>;
type IntegrationInfo = Record<string, any>;

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Product discovery", icon: PackageSearch },
  { label: "Market intelligence", icon: Globe2 },
  { label: "Arbitrage engine", icon: CircleDollarSign },
  { label: "Suppliers", icon: Truck },
  { label: "Listings", icon: ShoppingBag },
  { label: "Orders", icon: Boxes },
  { label: "AI command center", icon: BrainCircuit },
  { label: "Risk & compliance", icon: ShieldCheck }
];

function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

function money(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function App() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [runs, setRuns] = useState<AgentRunItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [autopilot, setAutopilot] = useState<AutopilotState | null>(null);
  const [apiState, setApiState] = useState("Connecting");
  const [active, setActive] = useState("Overview");
  const [statusMessage, setStatusMessage] = useState("");

  // Discovery & Research state
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("US");
  const [currency, setCurrency] = useState("USD");
  const [marketplace, setMarketplace] = useState("EBAY");
  const [researchBusy, setResearchBusy] = useState(false);
  const [researchOutput, setResearchOutput] = useState<any>(null);
  const [researchError, setResearchError] = useState("");

  // Quick import state
  const [importTitle, setImportTitle] = useState("");
  const [importBuyPrice, setImportBuyPrice] = useState("");
  const [importSellPrice, setImportSellPrice] = useState("");
  const [importShipping, setImportShipping] = useState("0");
  const [importUrl, setImportUrl] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  // Market intelligence probes
  const [probeQuery, setProbeQuery] = useState("");
  const [cjResult, setCjResult] = useState<any>(null);
  const [trendsResult, setTrendsResult] = useState<any>(null);
  const [ebayResult, setEbayResult] = useState<any>(null);
  const [probeBusy, setProbeBusy] = useState(false);

  // Profit calculator state
  const [salePrice, setSalePrice] = useState("49.99");
  const [supplierCost, setSupplierCost] = useState("15.00");
  const [shipping, setShipping] = useState("5.00");
  const [platformFees, setPlatformFees] = useState("6.50");
  const [paymentFees, setPaymentFees] = useState("1.75");
  const [advertisingCost, setAdvertisingCost] = useState("3.00");
  const [returnsReserve, setReturnsReserve] = useState("2.00");
  const [taxAndDuty, setTaxAndDuty] = useState("0");
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcError, setCalcError] = useState("");

  // Supplier creation state
  const [supName, setSupName] = useState("");
  const [supWebsite, setSupWebsite] = useState("");
  const [supCountry, setSupCountry] = useState("CN");
  const [supEmail, setSupEmail] = useState("");
  const [supSourceType, setSupSourceType] = useState("manual");
  const [supShippingNotes, setSupShippingNotes] = useState("");
  const [supReturnPolicy, setSupReturnPolicy] = useState("");

  // Unified Command Center pipeline state
  const [pipelineKeywords, setPipelineKeywords] = useState("");
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [pipelineError, setPipelineError] = useState("");

  // AI Command Center chat state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSystem, setAiSystem] = useState("");
  const [aiTask, setAiTask] = useState("commerce-strategy");
  const [aiReply, setAiReply] = useState<any>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  async function refreshAll() {
    setApiState("Connecting");
    try {
      const [healthRes, provRes, agentsRes, runsRes, oppsRes, supRes, mktRes, intRes, autoRes] =
        await Promise.all([
          fetch(`${API}/health`),
          fetch(`${API}/ai/providers`),
          fetch(`${API}/agents`),
          fetch(`${API}/agents/runs?limit=25`),
          fetch(`${API}/opportunities?limit=100`),
          fetch(`${API}/suppliers`),
          fetch(`${API}/markets`),
          fetch(`${API}/integrations`),
          fetch(`${API}/autopilot`).catch(() => null)
        ]);

      if (!healthRes.ok) throw new Error("Health check failed");
      setApiState("Online");

      if (provRes.ok) {
        const d = await provRes.json();
        setProviders(Array.isArray(d.providers) ? d.providers : []);
      }
      if (agentsRes.ok) {
        const d = await agentsRes.json();
        setAgents(Array.isArray(d.agents) ? d.agents : Array.isArray(d) ? d : []);
      }
      if (runsRes.ok) {
        const d = await runsRes.json();
        setRuns(Array.isArray(d.items) ? d.items : []);
      }
      if (oppsRes.ok) {
        const d = await oppsRes.json();
        setOpportunities(Array.isArray(d.items) ? d.items : []);
      }
      if (supRes.ok) {
        const d = await supRes.json();
        setSuppliers(Array.isArray(d.items) ? d.items : []);
      }
      if (mktRes.ok) {
        const d = await mktRes.json();
        setMarkets(Array.isArray(d.markets) ? d.markets : Array.isArray(d) ? d : []);
      }
      if (intRes.ok) {
        const d = await intRes.json();
        setIntegrations(Array.isArray(d.integrations) ? d.integrations : Array.isArray(d) ? d : []);
      }
      if (autoRes && autoRes.ok) {
        setAutopilot(await autoRes.json());
      }
    } catch {
      setApiState("API offline");
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function runUnifiedPipeline(event: React.FormEvent) {
    event.preventDefault();
    setPipelineBusy(true);
    setPipelineError("");
    setPipelineResult(null);
    setStatusMessage("");

    const parsedKeywords = pipelineKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length >= 2);

    try {
      const res = await fetch(`${API}/autopilot/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedKeywords.length ? { keywords: parsedKeywords } : {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unified pipeline run failed");
      setPipelineResult(data);
      setStatusMessage(
        `Pipeline finished: ${data.opportunitiesCreated ?? 0} evaluated (${data.approvedCount ?? 0} approved, ${data.rejectedCount ?? 0} rejected).`
      );
      await refreshAll();
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : "Unified pipeline run failed");
    } finally {
      setPipelineBusy(false);
    }
  }

  async function toggleAutopilotSchedule(enabled: boolean) {
    setStatusMessage("");
    const res = await fetch(`${API}/autopilot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatusMessage(err.error || "Could not update autopilot schedule");
      return;
    }
    const updated = await res.json();
    setAutopilot(updated);
    setStatusMessage(`Background autopilot ${enabled ? "enabled" : "paused"}.`);
  }

  async function startResearch(event: React.FormEvent) {
    event.preventDefault();
    setResearchBusy(true);
    setResearchError("");
    setResearchOutput(null);
    try {
      const response = await fetch(`${API}/agents/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          targetCountry: country,
          currency,
          marketplace,
          soldMarketplace: country === "GB" ? "EBAY_GB" : "EBAY_US",
          maxProducts: 20
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research workflow failed");
      setResearchOutput(data);
      await refreshAll();
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Research workflow failed");
    } finally {
      setResearchBusy(false);
    }
  }

  async function handleImportCandidate(event: React.FormEvent) {
    event.preventDefault();
    setImportBusy(true);
    setStatusMessage("");
    try {
      const payload: Record<string, any> = {
        title: importTitle.trim(),
        supplierPrice: Number(importBuyPrice),
        estimatedSalePrice: Number(importSellPrice),
        shippingCost: Number(importShipping || 0),
        currency,
        targetCountry: country,
        marketplace,
        sourceName: "manual_import"
      };
      if (importUrl.trim()) payload.sourceUrl = importUrl.trim();

      const res = await fetch(`${API}/discovery/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: [payload] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportTitle("");
      setImportBuyPrice("");
      setImportSellPrice("");
      setImportShipping("0");
      setImportUrl("");
      setStatusMessage(`Imported ${data.imported ?? 1} opportunity into database.`);
      await refreshAll();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportBusy(false);
    }
  }

  async function setOpportunityStatus(id: string, status: Opportunity["status"]) {
    setStatusMessage("");
    const res = await fetch(`${API}/opportunities/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatusMessage(err.error || "Could not update opportunity status");
      return;
    }
    setStatusMessage(`Opportunity marked as ${status}.`);
    await refreshAll();
  }

  async function runMarketProbes(event: React.FormEvent) {
    event.preventDefault();
    if (probeQuery.trim().length < 2) return;
    setProbeBusy(true);
    setCjResult(null);
    setTrendsResult(null);
    setEbayResult(null);
    const q = encodeURIComponent(probeQuery.trim());
    const soldMp = country === "GB" ? "EBAY_GB" : "EBAY_US";

    const [cjRes, trRes, ebRes] = await Promise.allSettled([
      fetch(`${API}/research/cj/products?keyword=${q}&page=1&size=10`).then(async (r) => ({
        ok: r.ok,
        body: await r.json()
      })),
      fetch(`${API}/research/trends?query=${q}&geo=${encodeURIComponent(country)}`).then(async (r) => ({
        ok: r.ok,
        body: await r.json()
      })),
      fetch(`${API}/research/ebay/sold?query=${q}&marketplace=${soldMp}&limit=20`).then(async (r) => ({
        ok: r.ok,
        body: await r.json()
      }))
    ]);

    setCjResult(cjRes.status === "fulfilled" ? cjRes.value : { ok: false, body: { error: "Request failed" } });
    setTrendsResult(trRes.status === "fulfilled" ? trRes.value : { ok: false, body: { error: "Request failed" } });
    setEbayResult(ebRes.status === "fulfilled" ? ebRes.value : { ok: false, body: { error: "Request failed" } });
    setProbeBusy(false);
  }

  async function runProfitCalculation(event: React.FormEvent) {
    event.preventDefault();
    setCalcError("");
    setCalcResult(null);
    try {
      const res = await fetch(`${API}/profit/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salePrice: Number(salePrice),
          supplierCost: Number(supplierCost),
          shipping: Number(shipping),
          platformFees: Number(platformFees),
          paymentFees: Number(paymentFees),
          advertisingCost: Number(advertisingCost),
          returnsReserve: Number(returnsReserve),
          taxAndDuty: Number(taxAndDuty),
          currency
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profit calculation failed");
      setCalcResult(data);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Profit calculation failed");
    }
  }

  async function handleCreateSupplier(event: React.FormEvent) {
    event.preventDefault();
    setStatusMessage("");
    const payload: Record<string, any> = {
      name: supName.trim(),
      countryCode: supCountry.trim().toUpperCase(),
      sourceType: supSourceType.trim() || "manual"
    };
    if (supWebsite.trim()) payload.website = supWebsite.trim();
    if (supEmail.trim()) payload.contactEmail = supEmail.trim();
    if (supShippingNotes.trim()) payload.shippingNotes = supShippingNotes.trim();
    if (supReturnPolicy.trim()) payload.returnPolicy = supReturnPolicy.trim();

    const res = await fetch(`${API}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMessage(data.error || "Failed to create supplier");
      return;
    }
    setSupName("");
    setSupWebsite("");
    setSupEmail("");
    setSupShippingNotes("");
    setSupReturnPolicy("");
    setStatusMessage(`Supplier "${data.name}" saved.`);
    await refreshAll();
  }

  async function toggleSupplierVerification(id: string, verified: boolean) {
    const res = await fetch(`${API}/suppliers/${id}/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified })
    });
    if (res.ok) {
      setStatusMessage(`Supplier verification updated to ${verified ? "Verified" : "Unverified"}.`);
      await refreshAll();
    }
  }

  async function sendAiPrompt(event: React.FormEvent) {
    event.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setAiError("");
    setAiReply(null);
    try {
      const payload: Record<string, any> = { prompt: aiPrompt.trim(), task: aiTask.trim() || "general" };
      if (aiSystem.trim()) payload.system = aiSystem.trim();
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAiReply(data);
      await refreshAll();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setAiBusy(false);
    }
  }

  const metrics = useMemo(() => {
    const listedOrApproved = opportunities.filter((o) => o.status === "LISTED" || o.status === "APPROVED");
    const grossPipeline = listedOrApproved.reduce((acc, o) => acc + num(o.estimatedSalePrice), 0);
    const estimatedNet = listedOrApproved.reduce((acc, o) => {
      const costs =
        num(o.supplierPrice) +
        num(o.shippingCost) +
        num(o.platformFees) +
        num(o.paymentFees) +
        num(o.returnsReserve) +
        num(o.taxAndDutyReserve);
      return acc + (num(o.estimatedSalePrice) - costs);
    }, 0);
    const listedCount = opportunities.filter((o) => o.status === "LISTED").length;
    return {
      grossPipeline,
      estimatedNet,
      opportunitiesCount: opportunities.length,
      listedCount
    };
  }, [opportunities]);

  const configured = providers.filter((p) => p.configured).length;
  const listedItems = opportunities.filter((o) => o.status === "LISTED");
  const approvedItems = opportunities.filter((o) => o.status === "APPROVED");
  const reviewItems = opportunities.filter((o) => o.status === "DISCOVERED" || o.status === "RESEARCHING");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Command size={21} /></div>
          <div>
            <div className="brand-name">tradepilot<span>AI</span></div>
            <div className="brand-caption">AUTONOMOUS COMMERCE</div>
          </div>
        </div>
        <div className="workspace">
          <div className="workspace-icon">{country}</div>
          <div><b>{country} workspace</b><small>{marketplace} · {currency}</small></div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={active === label ? "nav-item active" : "nav-item"}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === "AI command center" && <i className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <Sparkles size={17} />
            <b>Autopilot intelligence</b>
            <p>{opportunities.length} opportunities · {runs.length} recorded runs</p>
            <button onClick={() => setActive("AI command center")}>
              Open command center <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className={active === "Settings" ? "nav-item active" : "nav-item"}
            onClick={() => setActive("Settings")}
          >
            <Settings2 size={17} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <div className="avatar">TP</div>
            <div><b>Workspace owner</b><small>Administrator</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">Workspace <span>/</span> <b>{active}</b></div>
          <div className="top-actions">
            <button className="icon-button" onClick={refreshAll} title="Refresh live state">
              <RefreshCw size={16} />
            </button>
            <div className="global-pill"><Globe2 size={15} /> {country} · {currency}</div>
            <button className="icon-button" onClick={() => setActive("Risk & compliance")}>
              <Bell size={17} /><i />
            </button>
            <div className="top-avatar">TP</div>
          </div>
        </header>

        <div className="content">
          {statusMessage && (
            <div className="research-result" style={{ marginBottom: 16 }}>
              <span>{statusMessage}</span>
            </div>
          )}

          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="pulse" /> COMMERCE INTELLIGENCE PLATFORM</div>
              <h1>{active === "Overview" ? "Your global commerce cockpit." : active}</h1>
              <p>Live database records, real connector telemetry, and deterministic cost calculations.</p>
            </div>
            <button className="primary-button" onClick={() => setActive("Product discovery")}>
              <Search size={16} /> Discover products
            </button>
          </section>

          {active === "Overview" && (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-tag"><Zap size={13} /> TRADEPILOT AUTOPILOT</div>
                  <h2>Turn market signals<br />into <em>profitable decisions.</em></h2>
                  <p>
                    API status: <b>{apiState}</b> · {configured}/{providers.length || 3} AI providers configured ·{" "}
                    {suppliers.length} suppliers in catalog.
                  </p>
                  <div className="hero-actions">
                    <button className="hero-button" onClick={() => setActive("AI command center")}>
                      Launch AI command center <ArrowUpRight size={15} />
                    </button>
                    <span><span className="status-dot" /> {apiState}</span>
                  </div>
                </div>
                <div className="orbit-wrap">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="orbit-core"><BrainCircuit size={36} /><small>AI CORE</small></div>
                  <div className="orbit-node node-a"><PackageSearch size={17} /></div>
                  <div className="orbit-node node-b"><CircleDollarSign size={17} /></div>
                  <div className="orbit-node node-c"><Activity size={17} /></div>
                  <div className="orbit-node node-d"><Globe2 size={17} /></div>
                </div>
                <div className="hero-foot">
                  <span><i /> {runs.length} agent runs logged</span>
                  <span><i /> {configured} LLM providers ready</span>
                  <span><i /> {opportunities.length} tracked opportunities</span>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <h3>Pipeline & opportunity snapshot</h3>
                  <p>Computed from persisted approved/listed and discovered opportunities in PostgreSQL.</p>
                </div>
                <div className="period-select">Live DB <ChevronDown size={14} /></div>
              </div>

              <section className="metric-grid">
                <Metric
                  icon={<CircleDollarSign />}
                  label="Approved & listed sale value"
                  value={money(metrics.grossPipeline, currency)}
                  change={`${approvedItems.length + listedItems.length} active items`}
                  tone="mint"
                />
                <Metric
                  icon={<ArrowUpRight />}
                  label="Estimated net margin"
                  value={money(metrics.estimatedNet, currency)}
                  change="Sale price minus recorded costs"
                  tone="blue"
                />
                <Metric
                  icon={<PackageSearch />}
                  label="Opportunities"
                  value={String(metrics.opportunitiesCount)}
                  change={`${reviewItems.length} awaiting review`}
                  tone="violet"
                />
                <Metric
                  icon={<ShoppingBag />}
                  label="Listed products"
                  value={String(metrics.listedCount)}
                  change={`${suppliers.length} suppliers registered`}
                  tone="amber"
                />
              </section>

              <section className="lower-grid">
                <div className="panel agent-panel">
                  <div className="panel-head">
                    <div><h3>Agent workforce</h3><p>Registered commerce agents</p></div>
                    <button className="text-button" onClick={() => setActive("AI command center")}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="agent-list">
                    {agents.length === 0 ? (
                      <p className="research-result">No agents returned from <code>/api/agents</code>.</p>
                    ) : (
                      agents.slice(0, 6).map((a, idx) => {
                        const stateLabel = a.status || a.state || "Active";
                        return (
                          <Agent
                            key={a.key || a.id || idx}
                            icon={<BrainCircuit />}
                            name={a.name}
                            dept={a.department || a.dept || "Commerce intelligence"}
                            state={stateLabel}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="panel provider-panel">
                  <div className="panel-head">
                    <div><h3>AI provider network</h3><p>Live configuration state</p></div>
                    <div className="provider-count">{configured}/{providers.length} active</div>
                  </div>
                  <div className="provider-list">
                    {providers.map((p) => (
                      <div className="provider-row" key={p.name}>
                        <div className={`provider-logo ${p.name}`}>◎</div>
                        <div className="provider-info">
                          <b>{p.name}</b>
                          <small>{p.model || "No model configured"}</small>
                        </div>
                        <span className={p.configured ? "provider-state on" : "provider-state"}>
                          <i />{p.configured ? "Configured" : "Not connected"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="fallback-note"><Activity size={15} /><span>API endpoint: <b>{API}</b></span></div>
                </div>
              </section>
            </>
          )}

          {active === "Product discovery" && (
            <>
              <section className="research-panel">
                <h3>Multi-agent product research</h3>
                <p>
                  Runs CJdropshipping search, Google Trends, and eBay sold comps, records a real{" "}
                  <code>AgentRun</code>, and persists matching <code>ProductOpportunity</code> rows when currency and
                  market match.
                </p>
                <form className="research-form" onSubmit={startResearch}>
                  <div className="research-field">
                    <label>Product keyword</label>
                    <input
                      required
                      minLength={2}
                      maxLength={120}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g. wireless earbuds"
                    />
                  </div>
                  <div className="research-field">
                    <label>Target country</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setCurrency(e.target.value === "GB" ? "GBP" : "USD");
                      }}
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="KE">Kenya</option>
                    </select>
                  </div>
                  <div className="research-field">
                    <label>Currency</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option>USD</option><option>GBP</option><option>CAD</option><option>AUD</option><option>KES</option>
                    </select>
                  </div>
                  <div className="research-field">
                    <label>Target marketplace</label>
                    <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
                      <option>EBAY</option><option>AMAZON</option><option>SHOPIFY</option><option>WALMART</option><option>JUMIA</option>
                    </select>
                  </div>
                  <button className="research-submit" disabled={researchBusy || keyword.trim().length < 2} type="submit">
                    {researchBusy ? "Researching…" : "Run research"} <Search size={15} />
                  </button>
                </form>

                {researchError && <div className="research-result"><span className="research-error">{researchError}</span></div>}
                {researchOutput && (
                  <div className="research-result">
                    <strong>Research run completed</strong> · {researchOutput.runId}
                    <div className="research-stats">
                      <span>CJ products <b>{researchOutput.connectors?.cj?.normalizedProducts ?? 0}</b></span>
                      <span>Sold comps <b>{researchOutput.connectors?.soldComps?.usablePrices ?? 0}</b></span>
                      <span>Opportunities saved <b>{researchOutput.opportunitiesCreated ?? 0}</b></span>
                      <span>Connector issues <b>{researchOutput.failures?.length ?? 0}</b></span>
                    </div>
                    {Array.isArray(researchOutput.limitations) && researchOutput.limitations.length > 0 && (
                      <ul>{researchOutput.limitations.map((lim: string, i: number) => <li key={i}>{lim}</li>)}</ul>
                    )}
                    {researchOutput.aiAssessment && (
                      <details>
                        <summary>AI evidence assessment</summary>
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{researchOutput.aiAssessment}</pre>
                      </details>
                    )}
                  </div>
                )}
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Import product candidate directly</h3>
                <form className="research-form" onSubmit={handleImportCandidate}>
                  <div className="research-field">
                    <label>Title</label>
                    <input
                      required
                      minLength={2}
                      value={importTitle}
                      onChange={(e) => setImportTitle(e.target.value)}
                      placeholder="Product title"
                    />
                  </div>
                  <div className="research-field">
                    <label>Supplier cost ({currency})</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={importBuyPrice}
                      onChange={(e) => setImportBuyPrice(e.target.value)}
                      placeholder="12.50"
                    />
                  </div>
                  <div className="research-field">
                    <label>Target sale price ({currency})</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={importSellPrice}
                      onChange={(e) => setImportSellPrice(e.target.value)}
                      placeholder="34.99"
                    />
                  </div>
                  <div className="research-field">
                    <label>Shipping ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importShipping}
                      onChange={(e) => setImportShipping(e.target.value)}
                    />
                  </div>
                  <div className="research-field">
                    <label>Source URL (optional)</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <button className="research-submit" disabled={importBusy} type="submit">
                    {importBusy ? "Saving…" : "Import candidate"}
                  </button>
                </form>
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Persisted opportunities ({opportunities.length})</h3>
                {opportunities.length === 0 ? (
                  <p>No opportunities in PostgreSQL yet. Run a research job or import a candidate above.</p>
                ) : (
                  <div className="agent-list">
                    {opportunities.map((opp) => (
                      <div className="agent-row" key={opp.id}>
                        <div className="agent-meta">
                          <b>{opp.title}</b>
                          <small>
                            {opp.status} · {opp.targetCountry} · {opp.marketplace || "N/A"} · Buy{" "}
                            {money(num(opp.supplierPrice), opp.currency)} → Est. Sell{" "}
                            {money(num(opp.estimatedSalePrice), opp.currency)}
                          </small>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="text-button" onClick={() => setOpportunityStatus(opp.id, "APPROVED")}>
                            Approve
                          </button>
                          <button className="text-button" onClick={() => setOpportunityStatus(opp.id, "LISTED")}>
                            List
                          </button>
                          <button className="text-button" onClick={() => setOpportunityStatus(opp.id, "REJECTED")}>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {active === "Market intelligence" && (
            <>
              <section className="research-panel">
                <h3>Connector & market probes</h3>
                <p>Query live CJdropshipping products, Google Trends, and eBay sold comparables directly.</p>
                <form className="research-form" onSubmit={runMarketProbes}>
                  <div className="research-field">
                    <label>Search query</label>
                    <input
                      required
                      minLength={2}
                      value={probeQuery}
                      onChange={(e) => setProbeQuery(e.target.value)}
                      placeholder="e.g. mechanical keyboard"
                    />
                  </div>
                  <button className="research-submit" disabled={probeBusy || probeQuery.trim().length < 2} type="submit">
                    {probeBusy ? "Querying…" : "Run connector probes"}
                  </button>
                </form>

                {cjResult && (
                  <details open className="research-result">
                    <summary>CJdropshipping ({cjResult.ok ? "OK" : "Error"})</summary>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(cjResult.body, null, 2)}</pre>
                  </details>
                )}
                {trendsResult && (
                  <details open className="research-result">
                    <summary>Google Trends ({trendsResult.ok ? "OK" : "Error"})</summary>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(trendsResult.body, null, 2)}</pre>
                  </details>
                )}
                {ebayResult && (
                  <details open className="research-result">
                    <summary>eBay Sold Comps ({ebayResult.ok ? "OK" : "Error"})</summary>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(ebayResult.body, null, 2)}</pre>
                  </details>
                )}
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Configured markets ({markets.length}) & connectors ({integrations.length})</h3>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {JSON.stringify({ markets, integrations }, null, 2)}
                </pre>
              </section>
            </>
          )}

          {active === "Arbitrage engine" && (
            <section className="research-panel">
              <h3>Deterministic profit & fee calculator</h3>
              <p>Calls <code>POST /api/profit/calculate</code> with explicit unit costs, fees, and reserves.</p>
              <form className="research-form" onSubmit={runProfitCalculation}>
                <div className="research-field"><label>Sale price ({currency})</label><input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></div>
                <div className="research-field"><label>Supplier cost ({currency})</label><input type="number" step="0.01" min="0" value={supplierCost} onChange={(e) => setSupplierCost(e.target.value)} /></div>
                <div className="research-field"><label>Shipping ({currency})</label><input type="number" step="0.01" min="0" value={shipping} onChange={(e) => setShipping(e.target.value)} /></div>
                <div className="research-field"><label>Platform fees ({currency})</label><input type="number" step="0.01" min="0" value={platformFees} onChange={(e) => setPlatformFees(e.target.value)} /></div>
                <div className="research-field"><label>Payment fees ({currency})</label><input type="number" step="0.01" min="0" value={paymentFees} onChange={(e) => setPaymentFees(e.target.value)} /></div>
                <div className="research-field"><label>Ads ({currency})</label><input type="number" step="0.01" min="0" value={advertisingCost} onChange={(e) => setAdvertisingCost(e.target.value)} /></div>
                <div className="research-field"><label>Returns reserve ({currency})</label><input type="number" step="0.01" min="0" value={returnsReserve} onChange={(e) => setReturnsReserve(e.target.value)} /></div>
                <div className="research-field"><label>Tax & duty ({currency})</label><input type="number" step="0.01" min="0" value={taxAndDuty} onChange={(e) => setTaxAndDuty(e.target.value)} /></div>
                <button className="research-submit" type="submit">Calculate profit</button>
              </form>
              {calcError && <div className="research-result"><span className="research-error">{calcError}</span></div>}
              {calcResult && (
                <div className="research-result">
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(calcResult, null, 2)}</pre>
                </div>
              )}
            </section>
          )}

          {active === "Suppliers" && (
            <>
              <section className="research-panel">
                <h3>Add supplier</h3>
                <form className="research-form" onSubmit={handleCreateSupplier}>
                  <div className="research-field"><label>Name</label><input required minLength={2} value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Supplier name" /></div>
                  <div className="research-field"><label>Country code (2-letter)</label><input required minLength={2} maxLength={2} value={supCountry} onChange={(e) => setSupCountry(e.target.value)} placeholder="CN" /></div>
                  <div className="research-field"><label>Website</label><input type="url" value={supWebsite} onChange={(e) => setSupWebsite(e.target.value)} placeholder="https://example.com" /></div>
                  <div className="research-field"><label>Contact email</label><input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="ops@supplier.com" /></div>
                  <div className="research-field"><label>Source type</label><input value={supSourceType} onChange={(e) => setSupSourceType(e.target.value)} placeholder="manual" /></div>
                  <div className="research-field"><label>Shipping notes</label><input value={supShippingNotes} onChange={(e) => setSupShippingNotes(e.target.value)} placeholder="Lead times & lanes" /></div>
                  <div className="research-field"><label>Return policy</label><input value={supReturnPolicy} onChange={(e) => setSupReturnPolicy(e.target.value)} placeholder="RMA / defect terms" /></div>
                  <button className="research-submit" type="submit">Save supplier</button>
                </form>
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Supplier directory ({suppliers.length})</h3>
                {suppliers.length === 0 ? (
                  <p>No suppliers saved yet.</p>
                ) : (
                  <div className="agent-list">
                    {suppliers.map((s) => (
                      <div className="agent-row" key={s.id}>
                        <div className="agent-meta">
                          <b>{s.name}</b>
                          <small>
                            {s.countryCode} · {s.sourceType} · {s.verified ? "Verified" : "Unverified"}
                            {s.website ? ` · ${s.website}` : ""}
                          </small>
                        </div>
                        <button className="text-button" onClick={() => toggleSupplierVerification(s.id, !s.verified)}>
                          {s.verified ? <><XCircle size={14} /> Unverify</> : <><CheckCircle2 size={14} /> Verify</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {active === "Listings" && (
            <section className="research-panel">
              <h3>Approved & listed opportunities</h3>
              <p>Manage items promoted to <code>APPROVED</code> or <code>LISTED</code> in PostgreSQL.</p>
              {[...listedItems, ...approvedItems].length === 0 ? (
                <p>No approved or listed opportunities yet. Run the command center pipeline or approve items first.</p>
              ) : (
                <div className="agent-list">
                  {[...listedItems, ...approvedItems].map((item) => (
                    <div className="agent-row" key={item.id}>
                      <div className="agent-meta">
                        <b>{item.title}</b>
                        <small>
                          Status: {item.status} · Marketplace: {item.marketplace || "Unset"} · Est. Sale:{" "}
                          {money(num(item.estimatedSalePrice), item.currency)}
                        </small>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {item.status !== "LISTED" && (
                          <button className="text-button" onClick={() => setOpportunityStatus(item.id, "LISTED")}>
                            Mark LISTED
                          </button>
                        )}
                        <button className="text-button" onClick={() => setOpportunityStatus(item.id, "ARCHIVED")}>
                          Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === "Orders" && (
            <section className="research-panel">
              <h3>Active listings & order sync readiness</h3>
              <p>
                No store order webhook or Order table is connected yet; below are items currently marked{" "}
                <code>LISTED</code> and your registered integrations.
              </p>
              <div className="agent-list">
                {listedItems.length === 0 ? (
                  <p>0 listed products ready for order fulfillment.</p>
                ) : (
                  listedItems.map((item) => (
                    <div className="agent-row" key={item.id}>
                      <div className="agent-meta">
                        <b>{item.title}</b>
                        <small>
                          {item.marketplace || "Marketplace"} · {item.targetCountry} ·{" "}
                          {money(num(item.estimatedSalePrice), item.currency)}
                        </small>
                      </div>
                      <span className="agent-state">LISTED</span>
                    </div>
                  ))
                )}
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 16 }}>
                {JSON.stringify({ integrations }, null, 2)}
              </pre>
            </section>
          )}

          {active === "AI command center" && (
            <>
              <section className="research-panel">
                <h3>Unified agent pipeline (Discovery → Profit → Approval → Listing → Order)</h3>
                <p>
                  Connects discovery, comps, deterministic profit gating, and AI listing drafts into one run via{" "}
                  <code>POST /api/autopilot/run</code>. Live marketplace publishing and order webhooks require connected
                  store credentials/webhooks and will not fabricate listings or orders when unconfigured.
                </p>

                <div className="research-stats" style={{ marginBottom: 14 }}>
                  <span>Schedule: <b>{autopilot?.scheduled || autopilot?.config?.enabled ? "Active" : "Manual / Off"}</b></span>
                  <span>Approved ready: <b>{approvedItems.length}</b></span>
                  <span>Listed: <b>{listedItems.length}</b></span>
                  <span>Order sync: <b>Not connected</b></span>
                </div>

                <form className="research-form" onSubmit={runUnifiedPipeline}>
                  <div className="research-field" style={{ flex: 2 }}>
                    <label>Seed keywords (comma-separated, optional if ProductSource exists)</label>
                    <input
                      value={pipelineKeywords}
                      onChange={(e) => setPipelineKeywords(e.target.value)}
                      placeholder="e.g. magnetic phone mount, desk lamp"
                    />
                  </div>
                  <button className="research-submit" disabled={pipelineBusy} type="submit">
                    <Play size={15} /> {pipelineBusy ? "Running pipeline…" : "Run end-to-end pipeline"}
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => toggleAutopilotSchedule(!(autopilot?.config?.enabled ?? false))}
                  >
                    {autopilot?.config?.enabled ? "Pause background loop" : "Enable background loop"}
                  </button>
                </form>

                {pipelineError && (
                  <div className="research-result"><span className="research-error">{pipelineError}</span></div>
                )}
                {pipelineResult && (
                  <div className="research-result">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                      {JSON.stringify(pipelineResult, null, 2)}
                    </pre>
                  </div>
                )}
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Direct AI gateway chat (<code>POST /api/ai/chat</code>)</h3>
                <form className="research-form" onSubmit={sendAiPrompt}>
                  <div className="research-field">
                    <label>Task label</label>
                    <input value={aiTask} onChange={(e) => setAiTask(e.target.value)} />
                  </div>
                  <div className="research-field">
                    <label>System instruction (optional)</label>
                    <input
                      value={aiSystem}
                      onChange={(e) => setAiSystem(e.target.value)}
                      placeholder="Optional system prompt"
                    />
                  </div>
                  <div className="research-field" style={{ flex: 2 }}>
                    <label>Prompt</label>
                    <input
                      required
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask your commerce analyst..."
                    />
                  </div>
                  <button className="research-submit" disabled={aiBusy} type="submit">
                    {aiBusy ? "Sending…" : "Send prompt"}
                  </button>
                </form>
                {aiError && <div className="research-result"><span className="research-error">{aiError}</span></div>}
                {aiReply && (
                  <div className="research-result">
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(aiReply, null, 2)}</pre>
                  </div>
                )}
              </section>

              <section className="research-panel" style={{ marginTop: 20 }}>
                <h3>Recent agent runs ({runs.length})</h3>
                {runs.length === 0 ? (
                  <p>No agent runs recorded yet.</p>
                ) : (
                  <div className="agent-list">
                    {runs.map((r) => (
                      <div className="agent-row" key={r.id}>
                        <div className="agent-meta">
                          <b>{r.agentKey}</b>
                          <small>
                            {r.status} · Started {new Date(r.startedAt).toLocaleString()}
                            {r.provider ? ` · ${r.provider}` : ""}
                            {r.error ? ` · ${r.error}` : ""}
                          </small>
                        </div>
                        <span className="agent-state">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {active === "Risk & compliance" && (
            <section className="research-panel">
              <h3>Opportunity triage & supplier verification</h3>
              <p>Review discovered/researching items and verify suppliers before approving listings.</p>
              {reviewItems.length === 0 ? (
                <p>No opportunities currently in <code>DISCOVERED</code> or <code>RESEARCHING</code> status.</p>
              ) : (
                <div className="agent-list">
                  {reviewItems.map((item) => (
                    <div className="agent-row" key={item.id}>
                      <div className="agent-meta">
                        <b>
                          <ShieldAlert size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                          {item.title}
                        </b>
                        <small>
                          {item.status} · {item.targetCountry} · Buy {money(num(item.supplierPrice), item.currency)} ·
                          Est. Sell {money(num(item.estimatedSalePrice), item.currency)}
                        </small>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="text-button" onClick={() => setOpportunityStatus(item.id, "APPROVED")}>
                          Approve
                        </button>
                        <button className="text-button" onClick={() => setOpportunityStatus(item.id, "REJECTED")}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === "Settings" && (
            <section className="research-panel">
              <h3>Workspace & provider configuration</h3>
              <p>Active API base URL: <code>{API}</code></p>
              <div className="provider-list">
                {providers.map((p) => (
                  <div className="provider-row" key={p.name}>
                    <div className="provider-info">
                      <b>{p.name}</b>
                      <small>Model: {p.model || "Not set"}</small>
                    </div>
                    <span className={p.configured ? "provider-state on" : "provider-state"}>
                      <i />{p.configured ? "Configured" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer>
            TRADEPILOT AI <span>·</span> GLOBAL COMMERCE INTELLIGENCE{" "}
            <span className="footer-right">API: {apiState}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  change,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-change">{change}</div>
    </div>
  );
}

function Agent({
  icon,
  name,
  dept,
  state
}: {
  icon: React.ReactNode;
  name: string;
  dept: string;
  state: string;
}) {
  return (
    <div className="agent-row">
      <div className="agent-icon">{icon}</div>
      <div className="agent-meta"><b>{name}</b><small>{dept}</small></div>
      <span
        className={
          state.toLowerCase() === "ready" || state.toLowerCase() === "active"
            ? "agent-state ready"
            : "agent-state"
        }
      >
        {state}
      </span>
    </div>
  );
}

export default App;