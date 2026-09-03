import { useEffect, useState, type FormEvent } from "react";
import { useRoute } from "wouter";
import { Loader2, Check, Send } from "lucide-react";
import type { Lead, StrategicBriefing } from "../../../shared/leads.js";
import { toast } from "sonner";
import officialLogo from "../assets/logo_base.jpg"; // using the same logo

type BriefingForm = StrategicBriefing;

const emptyBriefing: BriefingForm = {
  companyClient: "",
  filledBy: "",
  briefingDate: "",
  siteInstagram: "",
  companyDescription: "",
  currentChannels: "",
  productService: "",
  includedItems: "",
  productDifferentials: "",
  guarantees: "",
  priceTicket: "",
  paymentConditions: "",
  activeOffer: "",
  servedRegion: "",
  deliveryLogistics: "",
  salesChannels: "",
  customerService: "",
  brandPositioning: "",
  existingProof: "",
  availableMaterials: "",
  campaignObjective: "",
  availableBudget: "",
  seasonality: "",
  directCompetitors: "",
  restrictions: "",
};

export default function ClientBriefing() {
  const [, params] = useRoute("/briefing/:leadId");
  const leadId = params?.leadId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [lead, setLead] = useState<Partial<Lead> | null>(null);
  const [form, setForm] = useState<BriefingForm>(emptyBriefing);

  useEffect(() => {
    if (!leadId) {
      setError("ID do lead não fornecido.");
      setLoading(false);
      return;
    }

    async function fetchLead() {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "client-get-lead", leadId }),
        });
        const data = await res.json();
        
        if (data.success && data.lead) {
          setLead(data.lead);
          setForm(data.lead.briefing || emptyBriefing);
          
          // Se o formulário estiver vazio, preencher com os dados do lead
          if (!data.lead.briefing) {
            setForm(prev => ({
              ...prev,
              companyClient: data.lead.name || "",
              filledBy: data.lead.name || "",
              briefingDate: new Date().toISOString().split("T")[0],
            }));
          }
        } else {
          setError(data.error || "Não foi possível carregar os dados.");
        }
      } catch (err) {
        setError("Falha na conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [leadId]);

  const update = (field: keyof BriefingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "client-save-briefing",
          leadId,
          briefing: form,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(data.error || "Ocorreu um erro ao salvar o briefing.");
        setError(data.error || "Ocorreu um erro ao salvar o briefing.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cb-wrap cb-loading-state">
        <Loader2 className="spin" size={32} />
        <p>Carregando briefing estratégico...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="cb-wrap cb-loading-state">
        <div className="cb-error-card">
          <h2>Link Inválido ou Expirado</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="cb-wrap cb-success-wrap">
        <div className="cb-success-card">
          <div className="cb-success-icon">
            <Check size={48} />
          </div>
          <h2>Briefing Recebido com Sucesso</h2>
          <p>
            Obrigado, {lead?.name}. Recebemos suas respostas e nosso time estratégico já está analisando o seu cenário.
          </p>
          <div className="cb-success-footer">
            <span>MÉTODO PRIMEIRO, RESULTADO DEPOIS.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-wrap">
      <header className="cb-header">
        <div className="cb-container cb-header-inner">
          <div className="cb-brand">
            <img src={officialLogo} alt="Base Mídia" className="cb-logo" />
          </div>
          <div className="cb-title-right">BRIEFING ESTRATÉGICO</div>
        </div>
      </header>

      <main className="cb-container">
        <div className="cb-intro-card">
          <div className="cb-intro-tag">MODELO DE PREENCHIMENTO → BASE MÍDIA</div>
          <h1>Briefing Estratégico</h1>
          <p className="cb-subtitle">Antes de abrir o gerenciador, o jogo começa aqui.</p>
          <div className="cb-intro-quote">
            <p>
              Quanto melhor o briefing, melhor a estratégia. Preencha com o máximo de detalhes e fuja do óbvio — respostas genéricas geram campanhas genéricas.
            </p>
          </div>
        </div>

        <form className="cb-form" onSubmit={submit}>
          {/* Seção 1 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>01. O Projeto</h2>
              <p>Informações básicas de identificação</p>
            </div>
            <div className="cb-grid">
              <label>
                Empresa/Cliente
                <input required value={form.companyClient} onChange={(e) => update("companyClient", e.target.value)} />
              </label>
              <label>
                Preenchido por
                <input required value={form.filledBy} onChange={(e) => update("filledBy", e.target.value)} />
              </label>
              <label>
                Data do Briefing
                <input type="date" required value={form.briefingDate} onChange={(e) => update("briefingDate", e.target.value)} />
              </label>
              <label>
                Site e Instagram principal
                <input required value={form.siteInstagram} onChange={(e) => update("siteInstagram", e.target.value)} placeholder="Ex: basemidia.com / @basemidia" />
              </label>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>02. A Empresa</h2>
              <p>Entendendo o negócio a fundo</p>
            </div>
            <div className="cb-grid-full">
              <label>
                O que a empresa vende? Qual o problema principal que resolve?
                <textarea required value={form.companyDescription} onChange={(e) => update("companyDescription", e.target.value)} rows={3} />
              </label>
              <label>
                Onde capta clientes hoje? (Quais canais dão mais resultado?)
                <textarea required value={form.currentChannels} onChange={(e) => update("currentChannels", e.target.value)} rows={2} />
              </label>
            </div>
          </div>

          {/* Seção 3 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>03. Produto ou Serviço</h2>
              <p>O que vamos vender na campanha</p>
            </div>
            <div className="cb-grid-full">
              <label>
                O que exatamente vamos anunciar?
                <textarea required value={form.productService} onChange={(e) => update("productService", e.target.value)} rows={2} />
              </label>
              <label>
                O que está incluso na entrega? (Entregáveis, escopo, bônus)
                <textarea required value={form.includedItems} onChange={(e) => update("includedItems", e.target.value)} rows={3} />
              </label>
              <label>
                Quais os diferenciais competitivos DESSE produto/serviço? (Por que comprar de vocês e não do concorrente?)
                <textarea required value={form.productDifferentials} onChange={(e) => update("productDifferentials", e.target.value)} rows={3} />
              </label>
              <label>
                Existe garantia? Se sim, como funciona?
                <input required value={form.guarantees} onChange={(e) => update("guarantees", e.target.value)} />
              </label>
            </div>
          </div>

          {/* Seção 4 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>04. Oferta e Comercial</h2>
              <p>Detalhes de preço e logística</p>
            </div>
            <div className="cb-grid">
              <label>
                Preço / Ticket Médio
                <input required value={form.priceTicket} onChange={(e) => update("priceTicket", e.target.value)} />
              </label>
              <label>
                Condições de Pagamento
                <input required value={form.paymentConditions} onChange={(e) => update("paymentConditions", e.target.value)} />
              </label>
              <label className="span-full">
                Existe alguma oferta ativa ou desconto agressivo para captação?
                <input required value={form.activeOffer} onChange={(e) => update("activeOffer", e.target.value)} />
              </label>
              <label>
                Região atendida (Local, Nacional, Global?)
                <input required value={form.servedRegion} onChange={(e) => update("servedRegion", e.target.value)} />
              </label>
              <label>
                Logística/Entrega (Se for produto físico)
                <input value={form.deliveryLogistics} onChange={(e) => update("deliveryLogistics", e.target.value)} placeholder="Deixe em branco se não aplicável" />
              </label>
              <label className="span-full">
                A venda acontece por onde? (Site, WhatsApp, Ligação, Presencial)
                <input required value={form.salesChannels} onChange={(e) => update("salesChannels", e.target.value)} />
              </label>
              <label className="span-full">
                Como é o tempo de resposta do comercial hoje?
                <input required value={form.customerService} onChange={(e) => update("customerService", e.target.value)} />
              </label>
            </div>
          </div>

          {/* Seção 5 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>05. Mercado e Posicionamento</h2>
              <p>Como a empresa é vista</p>
            </div>
            <div className="cb-grid-full">
              <label>
                A empresa se posiciona como Mais Barata, Melhor Custo-Benefício ou Premium/Exclusiva?
                <input required value={form.brandPositioning} onChange={(e) => update("brandPositioning", e.target.value)} />
              </label>
              <label>
                Temos prova social forte? (Avaliações, depoimentos em vídeo, clientes famosos, anos de mercado)
                <textarea required value={form.existingProof} onChange={(e) => update("existingProof", e.target.value)} rows={2} />
              </label>
              <label>
                Temos material visual de qualidade? (Fotos, vídeos bons do produto/serviço)
                <input required value={form.availableMaterials} onChange={(e) => update("availableMaterials", e.target.value)} />
              </label>
            </div>
          </div>

          {/* Seção 6 */}
          <div className="cb-section">
            <div className="cb-section-header">
              <h2>06. Objetivo e Expectativa</h2>
              <p>O que vamos buscar</p>
            </div>
            <div className="cb-grid-full">
              <label>
                Qual o objetivo exato da campanha? (Ex: Gerar 50 leads por semana no WhatsApp para serviço X)
                <textarea required value={form.campaignObjective} onChange={(e) => update("campaignObjective", e.target.value)} rows={2} />
              </label>
              <div className="cb-grid">
                <label>
                  Orçamento de Mídia disponível (Mensal)
                  <input required value={form.availableBudget} onChange={(e) => update("availableBudget", e.target.value)} />
                </label>
                <label>
                  Existe sazonalidade forte neste nicho?
                  <input required value={form.seasonality} onChange={(e) => update("seasonality", e.target.value)} />
                </label>
              </div>
              <label>
                Quem são os 3 principais concorrentes diretos? (Links se possível)
                <textarea required value={form.directCompetitors} onChange={(e) => update("directCompetitors", e.target.value)} rows={2} />
              </label>
              <label>
                Existe alguma regra ou restrição do que NÃO PODEMOS fazer de jeito nenhum?
                <textarea required value={form.restrictions} onChange={(e) => update("restrictions", e.target.value)} rows={2} />
              </label>
            </div>
          </div>

          {error && <div className="cb-error-msg">{error}</div>}

          <div className="cb-submit-area">
            <button type="submit" className="cb-submit-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="spin" size={18} /> Enviando Informações...
                </>
              ) : (
                <>
                  <Send size={18} /> Concluir e Enviar Briefing
                </>
              )}
            </button>
            <p className="cb-secure">Seus dados estão seguros e serão utilizados exclusivamente para planejamento estratégico.</p>
          </div>
        </form>
      </main>
    </div>
  );
}
