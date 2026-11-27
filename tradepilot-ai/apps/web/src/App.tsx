import { useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Boxes, BrainCircuit,
  ChevronDown, CircleDollarSign, Command, Globe2, LayoutDashboard,
  PackageSearch, Search, Settings2, ShieldCheck, ShoppingBag, Sparkles,
  Truck, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type Provider = { name: string; model: string | null; configured: boolean };
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

function App() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apiState, setApiState] = useState("Connecting");
  const [active, setActive] = useState("Overview");

  useEffect(() => {
    fetch(`${API}/ai/providers`)
      .then((r) => r.json())
      .then((d) => { setProviders(d.providers || []); setApiState("Online"); })
      .catch(() => setApiState("API offline"));
  }, []);

  const configured = providers.filter((p) => p.configured).length;

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Command size={21} /></div>
        <div><div className="brand-name">tradepilot<span>AI</span></div><div className="brand-caption">AUTONOMOUS COMMERCE</div></div>
      </div>
      <div className="workspace"><div className="workspace-icon">G</div><div><b>Global workspace</b><small>All markets · Multi-currency</small></div><ChevronDown size={15} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={active === label ? "nav-item active" : "nav-item"}><Icon size={17}/><span>{label}</span>{label === "AI command center" && <i className="live-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><Sparkles size={17}/><b>Autopilot intelligence</b><p>Your commerce agents are ready to research opportunities.</p><button onClick={() => setActive("AI command center")}>Open command center <ArrowUpRight size={14}/></button></div>
        <button className="nav-item"><Settings2 size={17}/><span>Settings</span></button>
        <div className="profile"><div className="avatar">TP</div><div><b>Workspace owner</b><small>Administrator</small></div><ChevronDown size={15}/></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="crumb">Workspace <span>/</span> <b>{active}</b></div>
        <div className="top-actions"><div className="global-pill"><Globe2 size={15}/> Global markets <ChevronDown size={13}/></div><button className="icon-button"><Bell size={17}/><i/></button><div className="top-avatar">TP</div></div>
      </header>
      <div className="content">
        <section className="welcome-row">
          <div><div className="eyebrow"><span className="pulse"/> COMMERCE INTELLIGENCE PLATFORM</div><h1>{active === "Overview" ? "Your global commerce cockpit." : active}</h1><p>Discover opportunities. Calculate with precision. Operate with intelligence.</p></div>
          <button className="primary-button" onClick={() => setActive("Product discovery")}><Search size={16}/> Discover products</button>
        </section>

        <section className="hero-panel">
          <div className="hero-copy"><div className="hero-tag"><Zap size={13}/> TRADEPILOT AUTOPILOT</div><h2>Turn market signals<br/>into <em>profitable decisions.</em></h2><p>Your AI commerce team is standing by. Connect data sources to start discovering verified opportunities across global markets.</p><div className="hero-actions"><button className="hero-button" onClick={() => setActive("AI command center")}>Launch AI command center <ArrowUpRight size={15}/></button><span><span className="status-dot"/> Systems operational</span></div></div>
          <div className="orbit-wrap"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><BrainCircuit size={36}/><small>AI CORE</small></div><div className="orbit-node node-a"><PackageSearch size={17}/></div><div className="orbit-node node-b"><CircleDollarSign size={17}/></div><div className="orbit-node node-c"><Activity size={17}/></div><div className="orbit-node node-d"><Globe2 size={17}/></div></div>
          <div className="hero-foot"><span><i/> Multi-agent orchestration</span><span><i/> Provider failover enabled</span><span><i/> Global-ready architecture</span></div>
        </section>

        <div className="section-heading"><div><h3>Business snapshot</h3><p>Performance indicators will populate when commerce integrations are connected.</p></div><div className="period-select">Last 30 days <ChevronDown size={14}/></div></div>
        <section className="metric-grid">
          <Metric icon={<CircleDollarSign/>} label="Gross revenue" value="$0.00" change="Awaiting store connection" tone="mint"/>
          <Metric icon={<ArrowUpRight/>} label="Net profit" value="$0.00" change="Deterministic cost engine ready" tone="blue"/>
          <Metric icon={<PackageSearch/>} label="Opportunities" value="0" change="Connect discovery sources" tone="violet"/>
          <Metric icon={<ShoppingBag/>} label="Active orders" value="0" change="Order integration not connected" tone="amber"/>
        </section>

        <section className="lower-grid">
          <div className="panel agent-panel"><div className="panel-head"><div><h3>Agent workforce</h3><p>Specialized intelligence, one coordinated operation.</p></div><button className="text-button" onClick={() => setActive("AI command center")}>View agents <ArrowUpRight size={14}/></button></div>
            <div className="agent-list">
              <Agent icon={<PackageSearch/>} name="Product Hunter" dept="Commerce intelligence" state="Ready"/>
              <Agent icon={<CircleDollarSign/>} name="Arbitrage Analyst" dept="Sourcing & finance" state="Ready"/>
              <Agent icon={<ShieldCheck/>} name="Risk & Compliance" dept="Sourcing & finance" state="Planned"/>
              <Agent icon={<Sparkles/>} name="Listing Studio" dept="Store operations" state="Planned"/>
            </div>
          </div>
          <div className="panel provider-panel"><div className="panel-head"><div><h3>AI provider network</h3><p>Automatic fallback sequence</p></div><div className="provider-count">{configured}/3 active</div></div>
            <div className="provider-list">{["openai","gemini","groq"].map((name) => { const p = providers.find(x => x.name === name); return <div className="provider-row" key={name}><div className={`provider-logo ${name}`}>{name === "openai" ? "◎" : name === "gemini" ? "✦" : "G"}</div><div className="provider-info"><b>{name === "openai" ? "OpenAI" : name === "gemini" ? "Google Gemini" : "Groq"}</b><small>{p?.model || "Awaiting configuration"}</small></div><span className={p?.configured ? "provider-state on" : "provider-state"}><i/>{p?.configured ? "Configured" : "Not connected"}</span></div>})}</div>
            <div className="fallback-note"><Activity size={15}/><span>Failover order: <b>OpenAI → Gemini → Groq</b></span></div>
          </div>
        </section>
        <footer>TRADEPILOT AI <span>·</span> GLOBAL COMMERCE INTELLIGENCE <span className="footer-right">API: {apiState}</span></footer>
      </div>
    </main>
  </div>;
}

function Metric({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-change">{change}</div></div>;
}
function Agent({ icon, name, dept, state }: { icon: React.ReactNode; name: string; dept: string; state: string }) {
  return <div className="agent-row"><div className="agent-icon">{icon}</div><div className="agent-meta"><b>{name}</b><small>{dept}</small></div><span className={state === "Ready" ? "agent-state ready" : "agent-state"}>{state}</span></div>;
}
export default App;
