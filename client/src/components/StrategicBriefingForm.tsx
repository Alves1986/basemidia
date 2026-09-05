import { useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  MessageCircle,
  X,
  Loader2,
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
  const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
  const textParam = message ? `text=${encodeURIComponent(message)}` : "";

  if (isMobile) {
    return `https://wa.me/${normalized}${message ? `?${textParam}` : ""}`;
  }
  return `https://web.whatsapp.com/send?phone=${normalized}${message ? `&${textParam}` : ""}`;
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
    companyClient:
      lead.briefing?.companyClient || lead.companyName || lead.name,
    filledBy: lead.briefing?.filledBy || lead.name,
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
        <textarea id={id} value={value} readOnly rows={4} />
      ) : (
        <input id={id} type={field.type ?? "text"} value={value} readOnly />
      )}
    </label>
  );
}

export default function StrategicBriefingForm({
  lead,
  adminEmail,
  onClose,
}: StrategicBriefingFormProps) {
  const [form] = useState<StrategicBriefing>(() =>
    createInitialBriefing(lead, adminEmail)
  );

  const allFields = useMemo(
    () => [
      ...strategicBriefingGeneralFields,
      ...strategicBriefingSections.flatMap(section => section.fields),
    ],
    []
  );
  const filledFields = allFields.filter(field =>
    form[field.key]?.trim()
  ).length;
  const progress = Math.round((filledFields / allFields.length) * 100);

  const formRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!formRef.current) return;

    setIsExporting(true);
    const formEl = formRef.current;
    
    // Add print class for styling overrides during PDF generation
    formEl.classList.add("print-mode");
    
    // Convert inputs and textareas to divs for html2canvas to render text properly without clipping
    const formFields = formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
    const replacements = Array.from(formFields).map(el => {
      const div = document.createElement("div");
      const computedStyle = window.getComputedStyle(el);
      
      div.className = el.className;
      
      // Iterate over computed styles and apply them to the div (more reliable than cssText in some browsers)
      for (let i = 0; i < computedStyle.length; i++) {
        const propName = computedStyle[i];
        div.style.setProperty(propName, computedStyle.getPropertyValue(propName), computedStyle.getPropertyPriority(propName));
      }
      
      // Override specific styles to ensure full visibility and correct rendering
      div.style.height = "auto";
      div.style.minHeight = el.tagName.toLowerCase() === "textarea" ? `${el.scrollHeight + 10}px` : computedStyle.height;
      div.style.whiteSpace = "pre-wrap";
      div.style.wordBreak = "break-word";
      div.style.overflow = "visible";
      div.style.display = "flex";
      div.style.alignItems = el.tagName.toLowerCase() === "textarea" ? "flex-start" : "center";
      // Textareas often need a bit of padding adjustment for visual parity in divs
      if (el.tagName.toLowerCase() === "textarea") {
          div.style.paddingTop = computedStyle.paddingTop;
      }
      
      // Preserve the text content
      div.innerText = el.value || " ";
      
      el.parentNode?.insertBefore(div, el);
      
      // Hide the original element
      const originalDisplay = el.style.display;
      el.style.display = "none";
      
      return { el, div, originalDisplay };
    });

    try {
      const { exportPdfSmartBreaks } = await import("../lib/exportPdfSmartBreaks");
      await exportPdfSmartBreaks({
        element: formEl,
        fileName: `briefing_${lead.companyName || lead.name}.pdf`,
        atomicSelector: ".briefing-field, .briefing-section-heading, .briefing-form-hero",
      });
    } catch (e) {
      console.error("Error generating PDF", e);
      toast.error("Erro ao gerar PDF.");
    } finally {
      // Restore original elements and remove replacements
      replacements.forEach(({ el, div, originalDisplay }) => {
        el.style.display = originalDisplay;
        div.remove();
      });
      formEl.classList.remove("print-mode");
      setIsExporting(false);
    }
  };

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
            <button
              className="briefing-pdf-link briefing-pdf-button"
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{
                opacity: isExporting ? 0.5 : 1,
                cursor: isExporting ? "wait" : "pointer",
              }}
            >
              {isExporting ? (
                <>
                  Gerando PDF... <Loader2 size={13} className="animate-spin" />
                </>
              ) : (
                <>
                  Exportar PDF <ArrowUpRight size={13} />
                </>
              )}
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

        <div className="briefing-form" ref={formRef}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
              <div style={{ background: "#111", padding: "16px", borderRadius: "8px", alignSelf: "flex-end", display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                <img src="/branding/logo_bm.png" alt="Base Mídia" style={{ width: "150px", height: "auto", display: "block" }} />
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
                  value={form[field.key] || ""}
                  onChange={() => {}}
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
                    value={form[field.key] || ""}
                    onChange={() => {}}
                  />
                ))}
              </div>
            </section>
          ))}

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
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
