import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  FilePenLine,
  CircleAlert,
  FileText,
  KanbanSquare,
  FolderOpen,
  LayoutDashboard,
  Link,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  RefreshCw,
  Search,
  Trash2,
  ShieldCheck,
  Settings2,
  Users,
  X,
  Save,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import officialLogo from "../assets/logo_base.jpg";
import {
  leadStatuses,
  leadStatusLabels,
  type Lead,
  type LeadStatus,
} from "@shared/leads";
import StrategicBriefingForm from "../components/StrategicBriefingForm";
import StrategicAIAssistant from "../components/StrategicAIAssistant";
import {
  defaultOperationSettings,
  type OperationSettings,
  type StrategicAnalysis,
} from "@shared/operation";

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

function dateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function whatsappUrl(value: string, message?: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("55")
    ? digits
    : digits.length >= 10
      ? `55${digits}`
      : digits;
  if (!normalized) return "#";
  
  const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
  const textParam = message ? `text=${encodeURIComponent(message)}` : "";
  
  if (isMobile) {
    return `https://wa.me/${normalized}${message ? `?${textParam}` : ""}`;
  }
  return `https://web.whatsapp.com/send?phone=${normalized}${message ? `&${textParam}` : ""}`;
}

function whatsappGreeting(lead: Lead, settings: OperationSettings) {
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name;
  const company = lead.briefing?.companyClient || lead.name;
  const template =
    lead.status === "proposta"
      ? settings.messages.proposalSent
      : lead.briefing
        ? settings.messages.briefingReady
        : lead.status === "novo"
          ? settings.messages.newLead
          : settings.messages.followUp;
  return template
    .replaceAll("{{nome}}", firstName)
    .replaceAll("{{empresa}}", company)
    .replaceAll("{{objetivo}}", lead.goal);
}

export default function Gestao() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [query, setQuery] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<LeadStatus | "todos">(
    "todos"
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<LeadStatus>("novo");
  const [nextActionDraft, setNextActionDraft] = useState("");
  const [nextActionAtDraft, setNextActionAtDraft] = useState("");
  const [savingPipeline, setSavingPipeline] = useState(false);
  const [pipelineSaved, setPipelineSaved] = useState(false);
  const [briefingLead, setBriefingLead] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationSettings, setOperationSettings] = useState<OperationSettings>(
    defaultOperationSettings
  );
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings", {
        credentials: "same-origin",
      });
      const body = (await response.json()) as { settings?: OperationSettings };
      if (response.ok && body.settings) setOperationSettings(body.settings);
    } catch {
      // Os defaults locais mantêm o pipeline utilizável caso as configurações ainda não existam.
    }
  }

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
        void loadSettings();
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
    const currentStage = operationSettings.stages.find(
      stage => stage.id === selectedLead.status
    );
    setPipelineStatus(selectedLead.status);
    setNextActionDraft(
      selectedLead.nextAction || currentStage?.defaultNextAction || ""
    );
    setNextActionAtDraft(
      selectedLead.nextActionAt ||
        dateAfterDays(
          currentStage?.deadlineDays ?? operationSettings.defaultFollowUpDays
        )
    );
    setPipelineSaved(false);
    setDeleteConfirmationOpen(false);
    setAnalysisError("");
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
    if (!normalized) {
      return leads.filter(
        lead => pipelineFilter === "todos" || lead.status === pipelineFilter
      );
    }
    return leads.filter(
      lead =>
        (pipelineFilter === "todos" || lead.status === pipelineFilter) &&
        [
          lead.name,
          lead.email,
          lead.whatsapp,
          lead.segment,
          lead.pain,
          lead.goal,
        ].some(field => field.toLowerCase().includes(normalized))
    );
  }, [leads, query, pipelineFilter]);

  const latestLead = leads[0];
  const recentCount = leads.filter(
    lead => lead.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const segmentCount = new Set(leads.map(lead => lead.segment)).size;

  async function handleGenerateAnalysis() {
    if (!selectedLead?.briefing) return;
    setAnalyzingLeadId(selectedLead.id);
    setAnalysisError("");
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLead.id }),
      });
      const body = (await response.json()) as { lead?: Lead; error?: string };
      if (response.status === 401) {
        navigate("/auth");
        return;
      }
      if (!response.ok || !body.lead)
        throw new Error(body.error ?? "Não foi possível gerar a análise.");
      setLeads(current =>
        current.map(lead => (lead.id === body.lead!.id ? body.lead! : lead))
      );
      setSelectedLead(body.lead);
    } catch (reason) {
      setAnalysisError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível gerar a análise."
      );
    } finally {
      setAnalyzingLeadId(null);
    }
  }

  async function handleDeleteLead() {
    if (!selectedLead) return;
    setDeletingLead(true);
    setError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-lead",
          leadId: selectedLead.id,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (response.status === 401) {
        navigate("/auth");
        return;
      }
      if (!response.ok)
        throw new Error(body.error ?? "Não foi possível excluir o lead.");
      setLeads(current => current.filter(lead => lead.id !== selectedLead.id));
      setSelectedLead(null);
      setDeleteConfirmationOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o lead."
      );
    } finally {
      setDeletingLead(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" });
    navigate("/auth");
  }

  async function handlePipelineSave() {
    if (!selectedLead) return;
    setSavingPipeline(true);
    setPipelineSaved(false);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-pipeline",
          leadId: selectedLead.id,
          status: pipelineStatus,
          nextAction: nextActionDraft,
          nextActionAt: nextActionAtDraft,
        }),
      });
      const body = (await response.json()) as LeadsResponse;
      if (response.status === 401) {
        navigate("/auth");
        return;
      }
      if (
        !response.ok ||
        (!body.leads && !(body as LeadsResponse & { lead?: Lead }).lead)
      ) {
        setError(body.error ?? "Não foi possível atualizar o pipeline.");
        return;
      }
      const updatedLead = (body as LeadsResponse & { lead: Lead }).lead;
      setLeads(current =>
        current.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
      );
      setSelectedLead(updatedLead);
      setPipelineSaved(true);
    } catch {
      setError("Não foi possível atualizar o pipeline agora.");
    } finally {
      setSavingPipeline(false);
    }
  }

  function handleBriefingSaved(updatedLead: Lead) {
    setLeads(current =>
      current.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setSelectedLead(updatedLead);
    setBriefingLead(null);
  }

  function handleBriefingAutosaved(updatedLead: Lead) {
    setLeads(current =>
      current.map(lead => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setSelectedLead(updatedLead);
    setBriefingLead(current => (current ? updatedLead : current));
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
          <span>APP DO GESTOR</span>
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
          <a href="/configuracoes" onClick={() => setMobileMenuOpen(false)}>
            <Settings2 size={17} /> Configurações <ChevronRight size={14} />
          </a>
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-session">
            <div className="session-avatar">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>Gestor</strong>
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
            <span className="section-index">/ MEUS LEADS</span>
            <h1>Briefings Recebidos</h1>
          </div>
          <div className="admin-top-actions">
            <span className="secure-status hide-on-mobile">
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

          <section id="pipeline" className="pipeline-section">
            <div className="admin-section-head">
              <div>
                <span className="section-index">/ PIPELINE OPERACIONAL</span>
                <h2>Próximo passo de cada lead</h2>
              </div>
              <span className="pipeline-total">
                {leads.length} oportunidades
              </span>
            </div>
            <div
              className="pipeline-board"
              role="tablist"
              aria-label="Filtrar por etapa"
            >
              <button
                className={`pipeline-stage ${pipelineFilter === "todos" ? "is-active" : ""}`}
                type="button"
                onClick={() => setPipelineFilter("todos")}
              >
                <span className="pipeline-stage-index">00</span>
                <strong>Todos</strong>
                <b>{leads.length}</b>
              </button>
              {leadStatuses.map((status, index) => {
                const count = leads.filter(
                  lead => lead.status === status
                ).length;
                return (
                  <button
                    className={`pipeline-stage ${pipelineFilter === status ? "is-active" : ""}`}
                    type="button"
                    key={status}
                    onClick={() => setPipelineFilter(status)}
                  >
                    <span className="pipeline-stage-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>
                      {operationSettings.stages.find(
                        stage => stage.id === status
                      )?.label ?? leadStatusLabels[status]}
                    </strong>
                    <b>{count}</b>
                  </button>
                );
              })}
            </div>
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
            <StrategicAIAssistant
              leadId={selectedLead.id}
              analysis={selectedLead.strategicAnalysis as StrategicAnalysis}
              hasBriefing={!!selectedLead.briefing}
              loading={analyzingLeadId === selectedLead.id}
              error={analysisError}
              onGenerate={() => void handleGenerateAnalysis()}
            />
            <section
              className="lead-pipeline-panel"
              aria-label="Pipeline do lead"
            >
              <div className="lead-pipeline-heading">
                <div>
                  <span className="section-index">/ PRÓXIMA AÇÃO</span>
                  <strong>Organize o avanço deste lead</strong>
                </div>
                {pipelineSaved && <span className="pipeline-saved">Salvo</span>}
              </div>
              <div className="lead-pipeline-fields">
                <label>
                  <span>Status</span>
                  <select
                    value={pipelineStatus}
                    onChange={event => {
                      const nextStatus = event.target.value as LeadStatus;
                      const nextStage = operationSettings.stages.find(
                        stage => stage.id === nextStatus
                      );
                      setPipelineStatus(nextStatus);
                      setNextActionDraft(nextStage?.defaultNextAction || "");
                      setNextActionAtDraft(
                        dateAfterDays(
                          nextStage?.deadlineDays ??
                            operationSettings.defaultFollowUpDays
                        )
                      );
                      setPipelineSaved(false);
                    }}
                  >
                    {leadStatuses.map(status => (
                      <option value={status} key={status}>
                        {operationSettings.stages.find(
                          stage => stage.id === status
                        )?.label ?? leadStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Próxima ação</span>
                  <input
                    value={nextActionDraft}
                    onChange={event => {
                      setNextActionDraft(event.target.value);
                      setPipelineSaved(false);
                    }}
                    placeholder="Ex.: enviar proposta ou agendar reunião"
                    maxLength={300}
                  />
                </label>
                <label>
                  <span>Quando</span>
                  <input
                    type="date"
                    value={nextActionAtDraft}
                    onChange={event => {
                      setNextActionAtDraft(event.target.value);
                      setPipelineSaved(false);
                    }}
                  />
                </label>
              </div>
              <button
                className="pipeline-save-button"
                type="button"
                onClick={() => void handlePipelineSave()}
                disabled={savingPipeline}
              >
                {savingPipeline ? (
                  <Loader2 className="spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                {savingPipeline ? "Salvando..." : "Salvar etapa"}
              </button>
            </section>
            <div className="lead-modal-footer">
              <div className="footer-main-actions">
                <a
                  className="primary-cta"
                  href={whatsappUrl(
                    selectedLead.whatsapp,
                    whatsappGreeting(selectedLead, operationSettings)
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Iniciar conversa no WhatsApp <MessageCircle size={17} />
                </a>
              <button
                className="admin-secondary-button"
                onClick={() => {
                  setBriefingLead(selectedLead);
                  setSelectedLead(null);
                }}
                disabled={!selectedLead.briefing}
              >
                <FileText size={15} /> Ver briefing
              </button>
              <button
                className="admin-secondary-button"
                onClick={() => {
                  const link = `${window.location.origin}/briefing/${selectedLead.id}`;
                  const msg = `Olá, ${selectedLead.name.split(" ")[0]}! Segue o link para o nosso briefing estratégico:\n${link}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Link copiado para a área de transferência!");
                  window.open(whatsappUrl(selectedLead.whatsapp, msg), "_blank");
                }}
              >
                <Link size={15} /> Enviar link do briefing
              </button>
              </div>
              <div className="footer-secondary-actions">
                <button
                  className="admin-secondary-button"
                  onClick={() => setSelectedLead(null)}
                >
                  <ArrowLeft size={15} /> Voltar para a lista
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => setDeleteConfirmationOpen(true)}
                >
                  <Trash2 size={15} /> Excluir duplicado
                </button>
              </div>
            </div>
            {deleteConfirmationOpen && (
              <div className="delete-confirm">
                <p>
                  Esta ação remove definitivamente o lead e o briefing salvo.
                  Use apenas se este registro for realmente duplicado.
                </p>
                <div className="delete-confirm-actions">
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => void handleDeleteLead()}
                    disabled={deletingLead}
                  >
                    {deletingLead ? (
                      <Loader2 className="spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {deletingLead ? "Excluindo..." : "Confirmar exclusão"}
                  </button>
                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={() => setDeleteConfirmationOpen(false)}
                    disabled={deletingLead}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        <a href="#resumo" className="nav-item is-active">
          <LayoutDashboard size={20} />
          <span>Resumo</span>
        </a>
        <a href="#briefings" className="nav-item">
          <FileText size={20} />
          <span>Briefings</span>
          {leads.length > 0 && <span className="nav-badge">{leads.length}</span>}
        </a>
        <a href="/configuracoes" className="nav-item">
          <Settings2 size={20} />
          <span>Ajustes</span>
        </a>
      </nav>
    </main>
  );
}
