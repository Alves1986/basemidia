import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  FileText,
  Loader2,
  MessageCircle,
  Save,
  X,
} from "lucide-react";
import type {
  BriefingFieldDefinition,
  Lead,
  StrategicBriefing,
} from "@shared/leads";
import {
  strategicBriefingGeneralFields,
  strategicBriefingSections,
} from "@shared/leads";

interface StrategicBriefingFormProps {
  lead: Lead;
  adminEmail: string;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  onAutosaved?: (lead: Lead) => void;
}

interface BriefingResponse {
  lead?: Lead;
  error?: string;
}

function formatWhatsAppHref(value: string, message?: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("55")
    ? digits
    : digits.length >= 10
      ? `55${digits}`
      : digits;
  if (!normalized) return "#";
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

function whatsappGreeting(lead: Lead) {
  const firstName = lead.name.trim().split(/\s+/)[0] || "tudo bem";
  return `Olá, ${firstName}! Aqui é da BASE MÍDIA. Estou organizando seu briefing estratégico e quero alinhar o próximo passo com você.`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialBriefing(
  lead: Lead,
  adminEmail: string
): StrategicBriefing {
  return {
    companyClient: lead.briefing?.companyClient || lead.name,
    filledBy: lead.briefing?.filledBy || adminEmail,
    briefingDate: lead.briefing?.briefingDate || today(),
    siteInstagram: lead.briefing?.siteInstagram || "",
    companyDescription: lead.briefing?.companyDescription || "",
    currentChannels: lead.briefing?.currentChannels || "",
    productService: lead.briefing?.productService || "",
    includedItems: lead.briefing?.includedItems || "",
    productDifferentials: lead.briefing?.productDifferentials || "",
    guarantees: lead.briefing?.guarantees || "",
    priceTicket: lead.briefing?.priceTicket || "",
    paymentConditions: lead.briefing?.paymentConditions || "",
    activeOffer: lead.briefing?.activeOffer || "",
    servedRegion: lead.briefing?.servedRegion || "",
    deliveryLogistics: lead.briefing?.deliveryLogistics || "",
    salesChannels: lead.briefing?.salesChannels || "",
    customerService: lead.briefing?.customerService || "",
    brandPositioning: lead.briefing?.brandPositioning || "",
    existingProof: lead.briefing?.existingProof || "",
    availableMaterials: lead.briefing?.availableMaterials || "",
    campaignObjective: lead.briefing?.campaignObjective || "",
    availableBudget: lead.briefing?.availableBudget || "",
    seasonality: lead.briefing?.seasonality || "",
    directCompetitors: lead.briefing?.directCompetitors || "",
    restrictions: lead.briefing?.restrictions || "",
  };
}

function BriefingField({
  field,
  value,
  onChange,
}: {
  field: BriefingFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const isLong =
    field.key !== "companyClient" &&
    field.key !== "filledBy" &&
    field.type !== "date" &&
    field.type !== "url";
  const id = `briefing-${field.key}`;
  return (
    <label className={`briefing-field ${isLong ? "is-long" : ""}`} htmlFor={id}>
      <span className="briefing-field-label">{field.label}</span>
      <span className="briefing-field-helper">{field.helper}</span>
      {isLong ? (
        <textarea
          id={id}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      ) : (
        <input
          id={id}
          type={field.type ?? "text"}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      )}
    </label>
  );
}

export default function StrategicBriefingForm({
  lead,
  adminEmail,
  onClose,
  onSaved,
  onAutosaved,
}: StrategicBriefingFormProps) {
  const [form, setForm] = useState<StrategicBriefing>(() =>
    createInitialBriefing(lead, adminEmail)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const hasEdited = useRef(false);

  const allFields = useMemo(
    () => [
      ...strategicBriefingGeneralFields,
      ...strategicBriefingSections.flatMap(section => section.fields),
    ],
    []
  );
  const filledFields = allFields.filter(field => form[field.key].trim()).length;
  const progress = Math.round((filledFields / allFields.length) * 100);

  function updateField(key: keyof StrategicBriefing, value: string) {
    hasEdited.current = true;
    setForm(current => ({ ...current, [key]: value }));
    setSaved(false);
    setAutosaveStatus("idle");
    setError("");
  }

  async function persistBriefing(isManual: boolean) {
    if (isManual) setIsSaving(true);
    else setAutosaveStatus("saving");
    setError("");
    if (isManual) setSaved(false);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-briefing",
          leadId: lead.id,
          briefing: form,
        }),
      });
      const body = (await response.json()) as BriefingResponse;
      if (response.status === 401) {
        onClose();
        return;
      }
      if (!response.ok || !body.lead) {
        if (!isManual) setAutosaveStatus("error");
        setError(body.error ?? "Não foi possível salvar este briefing.");
        return;
      }
      if (isManual) {
        setSaved(true);
        onSaved(body.lead);
      } else {
        setAutosaveStatus("saved");
        onAutosaved?.(body.lead);
      }
    } catch {
      if (!isManual) setAutosaveStatus("error");
      setError("Não foi possível conectar ao armazenamento agora.");
    } finally {
      if (isManual) setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!hasEdited.current) return;
    const timer = window.setTimeout(() => void persistBriefing(false), 1200);
    return () => window.clearTimeout(timer);
  }, [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistBriefing(true);
  }

  return (
    <div className="briefing-modal-backdrop" role="presentation">
      <section
        className="briefing-workspace"
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-workspace-title"
      >
        <header className="briefing-workspace-topbar">
          <button className="briefing-back" type="button" onClick={onClose}>
            <ArrowLeft size={16} /> Voltar para o lead
          </button>
          <div className="briefing-workspace-actions">
            <a
              className="briefing-pdf-link"
              href="/briefing-modelo.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Ver PDF modelo <ArrowUpRight size={13} />
            </a>
            <span className={`briefing-autosave-status ${autosaveStatus}`}>
              {autosaveStatus === "saving"
                ? "Salvando rascunho..."
                : autosaveStatus === "saved"
                  ? "Rascunho salvo"
                  : autosaveStatus === "error"
                    ? "Falha no autosave"
                    : "Autosave ativo"}
            </span>
            <button
              className="briefing-pdf-link briefing-pdf-button"
              type="button"
              onClick={() => window.print()}
            >
              Exportar PDF <ArrowUpRight size={13} />
            </button>
            <span className="briefing-private-status">
              <FileText size={14} /> Documento interno
            </span>
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              aria-label="Fechar briefing"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <form className="briefing-form" onSubmit={handleSubmit}>
          <div className="briefing-form-hero">
            <div>
              <span className="section-index">
                / MODELO DE PREENCHIMENTO — TRÁFEGO PAGO + IA
              </span>
              <p className="briefing-form-eyebrow">Briefing estratégico</p>
              <h2 id="briefing-workspace-title">
                Antes de abrir o gerenciador,
                <br />
                <em>o jogo começa aqui.</em>
              </h2>
              <p>
                Quanto melhor o briefing, melhor a estratégia. Registre a
                matéria-prima do negócio com contexto e fuja do óbvio.
              </p>
            </div>
            <div className="briefing-progress-card">
              <span>PROGRESSO DO BRIEFING</span>
              <strong>{progress}%</strong>
              <div className="briefing-progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>
                {filledFields} de {allFields.length} campos preenchidos
              </small>
            </div>
          </div>

          <section className="briefing-form-section briefing-general-section">
            <div className="briefing-section-heading">
              <span className="briefing-section-number">◆</span>
              <div>
                <span className="section-index">DADOS GERAIS</span>
                <h3>Comece pelo contexto</h3>
              </div>
            </div>
            <div className="briefing-general-grid">
              {strategicBriefingGeneralFields.map(field => (
                <BriefingField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={value => updateField(field.key, value)}
                />
              ))}
            </div>
          </section>

          {strategicBriefingSections.map(section => (
            <section className="briefing-form-section" key={section.number}>
              <div className="briefing-section-heading">
                <span className="briefing-section-number">
                  {section.number}
                </span>
                <div>
                  <span className="section-index">SEÇÃO {section.number}</span>
                  <h3>{section.title}</h3>
                </div>
              </div>
              <div className="briefing-fields-grid">
                {section.fields.map(field => (
                  <BriefingField
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    onChange={value => updateField(field.key, value)}
                  />
                ))}
              </div>
            </section>
          ))}

          <aside className="briefing-analysis-note">
            <strong>◆ E as dores, desejos e objeções?</strong>
            <p>
              Isso não é preenchido aqui. Dores, desejos, objeções e jornada de
              compra são análise — o próximo passo, onde a IA entra para
              acelerar. Neste briefing você coleta a matéria-prima do negócio.
            </p>
            <span>MÉTODO: PRIMEIRO IA, DEPOIS.</span>
          </aside>

          {error && (
            <div className="briefing-form-error" role="alert">
              <CircleAlert size={17} /> {error}
            </div>
          )}
          {saved && (
            <div className="briefing-form-success" role="status">
              <Check size={17} /> Briefing salvo no cadastro de {lead.name}.
            </div>
          )}

          <footer className="briefing-form-footer">
            <div>
              <span className="section-index">/ LEAD VINCULADO</span>
              <strong>{lead.name}</strong>
              <small>{lead.email}</small>
            </div>
            <div className="briefing-form-footer-actions">
              <a
                className="admin-secondary-button"
                href={formatWhatsAppHref(lead.whatsapp, whatsappGreeting(lead))}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
              <button className="primary-cta" type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {isSaving ? "Salvando..." : "Salvar briefing"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
