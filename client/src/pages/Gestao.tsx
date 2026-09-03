import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  FilePenLine,
  CircleAlert,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import officialLogo from "../assets/base-midia-logo.svg";
import type { Lead } from "@shared/leads";
import StrategicBriefingForm from "../components/StrategicBriefingForm";

interface AuthState {
  authenticated?: boolean;
  user?: { email: string } | null;
}

interface LeadsResponse {
  leads?: Lead[];
  error?: string;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatShortDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export default function Gestao() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [briefingLead, setBriefingLead] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadLeads() {
    setLoadingLeads(true);
    setError("");
    try {
      const response = await fetch("/api/leads", {
        credentials: "same-origin",
      });
      const body = (await response.json()) as LeadsResponse;
      if (response.status === 401) {
        navigate("/auth");
        return;
      }
      if (!response.ok) {
        setError(body.error ?? "Não foi possível carregar os briefings.");
        return;
      }
      setLeads(body.leads ?? []);
    } catch {
      setError("Não foi possível conectar à gestão agora. Tente novamente.");
    } finally {
      setLoadingLeads(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/auth", { credentials: "same-origin" })
      .then(async response => ({
        response,
        body: (await response.json()) as AuthState,
      }))
      .then(({ body }) => {
        if (!active) return;
        if (!body.authenticated) {
          navigate("/auth");
          return;
        }
        setUser(body.user ?? null);
        void loadLeads();
      })
      .catch(() => {
        if (active)
          setError("Não foi possível verificar a sessão administrativa.");
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedLead) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedLead(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLead]);

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter(lead =>
      [
        lead.name,
        lead.email,
        lead.whatsapp,
        lead.segment,
        lead.pain,
        lead.goal,
      ].some(field => field.toLowerCase().includes(normalized))
    );
  }, [leads, query]);

  const latestLead = leads[0];
  const recentCount = leads.filter(
    lead => lead.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const segmentCount = new Set(leads.map(lead => lead.segment)).size;

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" });
    navigate("/auth");
  }

  function handleBriefingSaved(updatedLead: Lead) {
    setLeads(current =>
      current.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setSelectedLead(updatedLead);
    setBriefingLead(null);
  }

  if (checkingSession) {
    return (
      <main className="admin-loading-page">
        <Loader2 className="spin" size={20} /> Verificando acesso à gestão...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-loading-page">
        <CircleAlert size={20} />{" "}
        {error || "Redirecionando para o acesso administrativo..."}
        <a href="/auth">Ir para o login</a>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <a href="/" aria-label="Voltar para a página inicial">
            <img src={officialLogo} alt="BASE MÍDIA" className="brand-logo" />
          </a>
          <span>OPERAÇÕES / 01</span>
        </div>
        <nav className="admin-nav" aria-label="Navegação da gestão">
          <a
            className="is-active"
            href="#resumo"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={17} /> Resumo <ChevronRight size={14} />
          </a>
          <a href="#briefings" onClick={() => setMobileMenuOpen(false)}>
            <FileText size={17} /> Briefings <span>{leads.length}</span>
          </a>
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-session">
            <div className="session-avatar">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>Admin</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-index">/ CENTRAL DE LEADS</span>
            <h1>Gestão de briefings</h1>
          </div>
          <div className="admin-top-actions">
            <span className="secure-status">
              <ShieldCheck size={15} /> Dados privados
            </span>
            <button
              className="admin-refresh"
              onClick={() => void loadLeads()}
              disabled={loadingLeads}
            >
              {loadingLeads ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}{" "}
              Atualizar
            </button>
            <button
              className="admin-mobile-toggle"
              aria-label="Abrir menu de gestão"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          <section id="resumo" className="admin-welcome">
            <div>
              <p className="admin-kicker">
                <span className="status-dot" /> FLUXO DE ENTRADA ATIVO
              </p>
              <h2>
                O cenário chega.
                <br />
                <em>A decisão começa aqui.</em>
              </h2>
            </div>
            <p>
              Leia cada briefing com contexto antes de transformar a conversa em
              proposta.
            </p>
          </section>

          <section className="admin-stats" aria-label="Indicadores dos leads">
            <article>
              <div className="stat-icon">
                <Users size={18} />
              </div>
              <span>TOTAL DE BRIEFINGS</span>
              <strong>{leads.length}</strong>
              <small>desde o primeiro envio</small>
            </article>
            <article>
              <div className="stat-icon">
                <CalendarDays size={18} />
              </div>
              <span>ÚLTIMOS 7 DIAS</span>
              <strong>{recentCount}</strong>
              <small>novos contextos recebidos</small>
            </article>
            <article>
              <div className="stat-icon">
                <LayoutDashboard size={18} />
              </div>
              <span>SEGMENTOS ATIVOS</span>
              <strong>{segmentCount}</strong>
              <small>
                {latestLead
                  ? `mais recente em ${formatShortDate(latestLead.createdAt)}`
                  : "aguardando primeiro briefing"}
              </small>
            </article>
          </section>

          <section id="briefings" className="admin-leads-section">
            <div className="admin-section-head">
              <div>
                <span className="section-index">/ 01 — INBOX DE CONTEXTO</span>
                <h2>Briefings recebidos</h2>
              </div>
              <div className="admin-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Buscar por nome, segmento ou palavra..."
                  aria-label="Buscar briefings"
                />
              </div>
            </div>
            {error && (
              <div className="admin-error">
                <CircleAlert size={17} /> <span>{error}</span>
                <button onClick={() => void loadLeads()}>
                  Tentar novamente
                </button>
              </div>
            )}
            {loadingLeads ? (
              <div className="admin-empty">
                <Loader2 className="spin" size={22} />
                <h3>Carregando briefings...</h3>
                <p>Buscando os últimos contextos no armazenamento privado.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="admin-empty">
                <div className="empty-mark">
                  <FileText size={20} />
                </div>
                <h3>
                  {query
                    ? "Nenhum briefing encontrado"
                    : "Ainda não há briefings"}
                </h3>
                <p>
                  {query
                    ? "Tente outra busca ou limpe o filtro para ver toda a caixa de entrada."
                    : "Quando alguém enviar o diagnóstico, o briefing aparecerá aqui para triagem."}
                </p>
                {query && (
                  <button
                    className="admin-secondary-button"
                    onClick={() => setQuery("")}
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className="leads-table-wrap">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Segmento</th>
                      <th>Anúncios</th>
                      <th>Briefing</th>
                      <th>Recebido em</th>
                      <th>
                        <span className="sr-only">Abrir</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                        <td>
                          <div className="lead-identity">
                            <div className="lead-avatar">
                              {lead.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <strong>{lead.name}</strong>
                              <span>{lead.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="lead-tag">{lead.segment}</span>
                        </td>
                        <td>
                          <span className="lead-ads">{lead.ads}</span>
                        </td>
                        <td>
                          <span
                            className={`briefing-status ${lead.briefing ? "is-ready" : ""}`}
                          >
                            <FilePenLine size={13} />{" "}
                            {lead.briefing ? "Preenchido" : "Pendente"}
                          </span>
                        </td>
                        <td>
                          <span className="lead-date">
                            {formatDate(lead.createdAt)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="open-lead-button"
                            aria-label={`Abrir briefing de ${lead.name}`}
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedLead(lead);
                            }}
                          >
                            <ArrowUpRight size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>

      {briefingLead && user && (
        <StrategicBriefingForm
          lead={briefingLead}
          adminEmail={user.email}
          onClose={() => setBriefingLead(null)}
          onSaved={handleBriefingSaved}
        />
      )}

      {selectedLead && (
        <div
          className="lead-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedLead(null)}
        >
          <article
            className="lead-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Fechar briefing"
              onClick={() => setSelectedLead(null)}
            >
              <X size={20} />
            </button>
            <div className="lead-modal-header">
              <div className="lead-modal-mark">
                <FileText size={20} />
              </div>
              <div>
                <span className="section-index">/ BRIEFING_RECEBIDO</span>
                <h2 id="lead-modal-title">{selectedLead.name}</h2>
                <p>Enviado em {formatDate(selectedLead.createdAt)}</p>
              </div>
            </div>
            <div className="lead-contact-row">
              <a href={`mailto:${selectedLead.email}`}>
                <Mail size={15} /> {selectedLead.email}
              </a>
              <a
                href={whatsappUrl(selectedLead.whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} /> {selectedLead.whatsapp}
              </a>
            </div>
            <div className="lead-answers">
              <div>
                <span>SEGMENTO</span>
                <strong>{selectedLead.segment}</strong>
              </div>
              <div>
                <span>VOCÊ JÁ ANUNCIA?</span>
                <strong>{selectedLead.ads}</strong>
              </div>
              <div className="answer-wide">
                <span>MAIOR PROBLEMA A RESOLVER</span>
                <p>{selectedLead.pain}</p>
              </div>
              <div className="answer-wide">
                <span>OBJETIVO PARA OS PRÓXIMOS 90 DIAS</span>
                <p>{selectedLead.goal}</p>
              </div>
            </div>
            <div className="lead-modal-footer">
              <a
                className="primary-cta"
                href={whatsappUrl(selectedLead.whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                Iniciar conversa no WhatsApp <MessageCircle size={17} />
              </a>
              <button
                className="admin-secondary-button"
                onClick={() => setBriefingLead(selectedLead)}
              >
                <FilePenLine size={15} /> Gerar briefing
              </button>
              <button
                className="admin-secondary-button"
                onClick={() => setSelectedLead(null)}
              >
                <ArrowLeft size={15} /> Voltar para a lista
              </button>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
