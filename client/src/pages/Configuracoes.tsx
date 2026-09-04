import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, Settings2, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import {
  defaultOperationSettings,
  type OperationSettings,
} from "@shared/operation";
import { leadStatuses } from "@shared/leads";
import officialLogo from "../assets/logo_base.jpg";

export default function Configuracoes() {
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<OperationSettings>(
    defaultOperationSettings
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings", { credentials: "same-origin" })
      .then(async response => {
        const body = (await response.json()) as {
          settings?: OperationSettings;
          error?: string;
        };
        if (response.status === 401) {
          navigate("/auth");
          return;
        }
        if (!response.ok)
          throw new Error(
            body.error || "Não foi possível carregar as configurações."
          );
        if (body.settings) setSettings(body.settings);
      })
      .catch(reason =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar as configurações."
        )
      )
      .finally(() => setLoading(false));
  }, [navigate]);

  function updateStage(
    index: number,
    key: "label" | "defaultNextAction" | "deadlineDays",
    value: string
  ) {
    setSaved(false);
    setSettings(current => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) =>
        stageIndex === index
          ? {
              ...stage,
              [key]:
                key === "deadlineDays"
                  ? Math.max(0, Math.min(90, Number(value) || 0))
                  : value,
            }
          : stage
      ),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = (await response.json()) as {
        settings?: OperationSettings;
        error?: string;
      };
      if (response.status === 401) {
        navigate("/auth");
        return;
      }
      if (!response.ok)
        throw new Error(
          body.error || "Não foi possível salvar as configurações."
        );
      if (body.settings) setSettings(body.settings);
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar as configurações."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <main className="admin-loading-page">
        <Loader2 className="spin" size={20} /> Carregando configurações...
      </main>
    );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <a href="/" aria-label="Voltar para a página inicial">
            <img src={officialLogo} alt="BASE MÍDIA" className="brand-logo" />
          </a>
          <span>OPERAÇÕES / 02</span>
        </div>
        <nav className="admin-nav" aria-label="Navegação da gestão">
          <a href="/gestao">
            <ArrowLeft size={17} /> Voltar para gestão
          </a>
          <a className="is-active" href="#funil">
            <Settings2 size={17} /> Configurações
          </a>
        </nav>
        <div className="admin-sidebar-foot">
          <span className="secure-status">
            <ShieldCheck size={15} /> Área restrita
          </span>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-index">/ OPERAÇÃO / CONFIGURAÇÕES</span>
            <h1>Como a operação avança</h1>
          </div>
          <button
            className="admin-refresh"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Save size={16} />
            )}{" "}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </header>
        <div className="admin-content operation-settings-page">
          {error && (
            <div className="admin-error">
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="admin-success">
              <span>Configurações salvas para a operação.</span>
            </div>
          )}
          <section className="settings-card" id="funil">
            <div className="admin-section-head">
              <div>
                <span className="section-index">/ 01 — PIPELINE</span>
                <h2>Etapas, prazos e próxima ação</h2>
              </div>
            </div>
            <p className="settings-intro">
              Ajuste os nomes que aparecem no funil e defina a ação sugerida
              para cada novo lead.
            </p>
            <div className="settings-stage-list">
              {settings.stages
                .filter(stage => leadStatuses.includes(stage.id))
                .map((stage, index) => (
                  <div className="settings-stage-row" key={stage.id}>
                    <span
                      className="settings-stage-dot"
                      style={{ background: stage.color }}
                    />
                    <div>
                      <strong>
                        {String(index + 1).padStart(2, "0")} / {stage.id}
                      </strong>
                      <input
                        value={stage.label}
                        onChange={event =>
                          updateStage(index, "label", event.target.value)
                        }
                        maxLength={80}
                        aria-label={`Nome da etapa ${stage.id}`}
                      />
                    </div>
                    <label>
                      Próxima ação
                      <input
                        value={stage.defaultNextAction}
                        onChange={event =>
                          updateStage(
                            index,
                            "defaultNextAction",
                            event.target.value
                          )
                        }
                        maxLength={160}
                      />
                    </label>
                    <label>
                      Prazo (dias)
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={stage.deadlineDays}
                        onChange={event =>
                          updateStage(index, "deadlineDays", event.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
            </div>
            <label className="settings-wide-field">
              Prazo padrão de follow-up (dias)
              <input
                type="number"
                min={0}
                max={90}
                value={settings.defaultFollowUpDays}
                onChange={event => {
                  setSaved(false);
                  setSettings(current => ({
                    ...current,
                    defaultFollowUpDays: Math.max(
                      0,
                      Math.min(90, Number(event.target.value) || 0)
                    ),
                  }));
                }}
              />
            </label>
          </section>
          <section className="settings-card">
            <div className="admin-section-head">
              <div>
                <span className="section-index">/ 02 — MENSAGENS</span>
                <h2>Textos de atendimento</h2>
              </div>
            </div>
            <p className="settings-intro">
              Use <code>{`{{nome}}`}</code>, <code>{`{{empresa}}`}</code> e{" "}
              <code>{`{{objetivo}}`}</code> como campos dinâmicos nas mensagens.
            </p>
            <div className="settings-message-grid">
              {(
                [
                  ["newLead", "Lead novo"],
                  ["briefingReady", "Briefing recebido"],
                  ["proposalSent", "Proposta enviada"],
                  ["followUp", "Follow-up"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <textarea
                    rows={4}
                    value={settings.messages[key]}
                    onChange={event => {
                      setSaved(false);
                      setSettings(current => ({
                        ...current,
                        messages: {
                          ...current.messages,
                          [key]: event.target.value,
                        },
                      }));
                    }}
                    maxLength={800}
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="settings-card" id="ia">
            <div className="admin-section-head">
              <div>
                <span className="section-index">/ 03 — INTELIGÊNCIA ARTIFICIAL</span>
                <h2>Leitura Estratégica (OpenRouter)</h2>
              </div>
            </div>
            <p className="settings-intro">
              Para habilitar o diagnóstico gerado por IA nos briefings, cole sua 
              chave de API do <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{color: "var(--acid)", textDecoration: "underline"}}>OpenRouter</a> abaixo. 
              Deixe em branco para usar a chave configurada no servidor (se houver).
            </p>
            <div className="settings-message-grid" style={{ marginTop: "20px" }}>
              <label>
                OpenRouter API Key
                <input
                  type="password"
                  value={settings.openRouterApiKey ?? ""}
                  onChange={event => {
                    setSaved(false);
                    setSettings(current => ({
                      ...current,
                      openRouterApiKey: event.target.value,
                    }));
                  }}
                  placeholder="sk-or-v1-..."
                  maxLength={200}
                />
              </label>
              <label>
                Modelo de IA
                <select
                  value={settings.openRouterModel ?? "google/gemini-2.5-flash"}
                  onChange={event => {
                    setSaved(false);
                    setSettings(current => ({
                      ...current,
                      openRouterModel: event.target.value,
                    }));
                  }}
                >
                  <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Rápido e Inteligente)</option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (Avançado)</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Excelente em Copywriting)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (Ótimo Custo Benefício)</option>
                  <option value="openai/gpt-4o">GPT-4o (Máxima Qualidade)</option>
                  <option value="openrouter/free">Modelos Gratuitos (Pode falhar)</option>
                </select>
              </label>
            </div>
          </section>
          <div className="settings-actions">
            <button
              className="primary-cta"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar configurações"}{" "}
              <Save size={17} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
