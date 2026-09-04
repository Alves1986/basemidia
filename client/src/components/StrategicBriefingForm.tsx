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
    
    const textareas = formEl.querySelectorAll("textarea");

    // Temporarily expand all textareas to their full content height for printing
    const originalHeights = Array.from(textareas).map(ta => ta.style.height);
    textareas.forEach(ta => {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight + 10}px`;
    });

    try {
      const { getHtml2Pdf } = await import("../lib/pdfUtils");
      const html2pdf = await getHtml2Pdf();
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `briefing_${lead.companyName || lead.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.section-break', avoid: '.briefing-field' }
      };
      
      // @ts-ignore
      await html2pdf().set(opt).from(formEl).save();
    } catch (e) {
      console.error("Error generating PDF", e);
      toast.error("Erro ao gerar PDF.");
    } finally {
      // Restore original styles
      textareas.forEach((ta, i) => {
        ta.style.height = originalHeights[i];
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

          <section className="briefing-form-section briefing-general-section section-break">
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
            <section className="briefing-form-section section-break" key={section.number}>
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
