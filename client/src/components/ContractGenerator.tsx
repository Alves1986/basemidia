import React, { useEffect, useState } from "react";
import { Loader2, ArrowRight, ShieldCheck, Download, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { type Lead, type Contract } from "@shared/leads";
import { type OperationSettings } from "@shared/operation";
import { marked } from "marked";

interface Props {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

export function ContractGenerator({ lead, isOpen, onClose, onSuccess }: Props) {
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<Partial<Contract>>(lead.contract || {});
  const [step, setStep] = useState<"edit" | "preview">("preview");
  const [agencyName, setAgencyName] = useState("");
  const [templateMd, setTemplateMd] = useState("");

  const DEFAULT_CONTRACT = `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

**CONTRATADA:** {{AGENCIA_NOME}}, inscrita no CNPJ sob o n° {{AGENCIA_CNPJ}}, sediada em {{AGENCIA_ENDERECO}}, representada por {{AGENCIA_REPRESENTANTE}}.
**E-mail:** {{AGENCIA_EMAIL}}

**CONTRATANTE:** {{CLIENTE_NOME}}, inscrito no CNPJ/CPF sob o n° {{CLIENTE_CNPJ_CPF}}, sediado em {{CLIENTE_ENDERECO}}.
**E-mail:** {{CLIENTE_EMAIL}}

**1. OBJETO:** O presente instrumento tem como objeto a prestação de serviços de {{DESCRICAO_SERVICO}}.
**2. VALORES E PAGAMENTO:** O investimento mensal será de {{VALOR_MENSAL}} e uma taxa de setup inicial de {{VALOR_SETUP}}. Os pagamentos serão realizados via {{CONDICOES_PAGAMENTO}}, com vencimento todo dia {{DIA_VENCIMENTO}}.
**3. PRAZO:** Este contrato possui vigência de {{DURACAO_MESES}} meses, a contar da data de sua assinatura.
**4. FORO:** As partes elegem o foro de {{FORO_COMARCA}} para dirimir quaisquer dúvidas oriundas deste contrato.
`;

  const renderMarkdown = (md: string) => {
    let replaced = md
      .replace(/{{AGENCIA_NOME}}/g, contract.agencyName || "")
      .replace(/{{AGENCIA_CNPJ}}/g, contract.agencyCnpj || "")
      .replace(/{{AGENCIA_ENDERECO}}/g, contract.agencyAddress || "")
      .replace(/{{AGENCIA_REPRESENTANTE}}/g, contract.agencyRepresentative || "")
      .replace(/{{AGENCIA_EMAIL}}/g, contract.agencyEmail || "")
      .replace(/{{FORO_COMARCA}}/g, contract.forumCity || "")
      .replace(/{{CLIENTE_NOME}}/g, contract.clientName || "")
      .replace(/{{CLIENTE_CNPJ_CPF}}/g, contract.clientCnpjCpf || "")
      .replace(/{{CLIENTE_ENDERECO}}/g, contract.clientAddress || "")
      .replace(/{{CLIENTE_EMAIL}}/g, contract.clientEmail || "")
      .replace(/{{DESCRICAO_SERVICO}}/g, contract.serviceDescription || "")
      .replace(/{{VALOR_MENSAL}}/g, contract.investmentValue || "")
      .replace(/{{VALOR_SETUP}}/g, contract.setupValue || "")
      .replace(/{{DURACAO_MESES}}/g, contract.durationMonths || "")
      .replace(/{{CONDICOES_PAGAMENTO}}/g, contract.paymentConditions || "")
      .replace(/{{DIA_VENCIMENTO}}/g, contract.paymentDay || "")
      .replace(/{{CLIENTE_INSTAGRAM}}/g, lead.briefing?.siteInstagram || "")
      .replace(/{{CLIENTE_WHATSAPP}}/g, lead.whatsapp || "")
      .replace(/{{PRAZO_ENTREGA_CRIATIVOS}}/g, "7")
      .replace(/{{PERIODICIDADE_RELATORIO}}/g, "mensal")
      .replace(/{{PRAZO_APROVACAO_CRIATIVOS}}/g, "3")
      .replace(/{{CONDICAO_PAGAMENTO_SETUP}}/g, "na assinatura")
      .replace(/{{PRAZO_AVISO_REAJUSTE}}/g, "30")
      .replace(/{{VERBA_MIDIA_MENSAL}}/g, "a definir pelo cliente")
      .replace(/{{PRAZO_AVISO_RENOVACAO}}/g, "30")
      .replace(/{{PRAZO_AVISO_RESCISAO}}/g, "30")
      .replace(/{{MULTA_RESCISAO_PERCENTUAL}}/g, "30")
      .replace(/{{PRAZO_INADIMPLENCIA}}/g, "5")
      .replace(/{{DATA_ASSINATURA}}/g, contract.agencySignatureDate ? new Date(contract.agencySignatureDate).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"));
    return marked.parse(replaced) as string;
  };
  
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings", { credentials: "same-origin" })
        .then(res => res.json())
        .then(data => {
          const settings = data.settings as OperationSettings;
          setAgencyName(settings.agencySettings?.name || "Agência Não Configurada");
          
          if (!lead.contract) {
             setTemplateMd(settings.contractTemplateMd || DEFAULT_CONTRACT);
             // Pre-fill
             setContract({
                agencyName: settings.agencySettings?.name || "",
                agencyCnpj: settings.agencySettings?.cnpj || "",
                agencyAddress: settings.agencySettings?.address || "",
                agencyRepresentative: settings.agencySettings?.legalRepresentative || "",
                agencyEmail: settings.agencySettings?.email || "",
                forumCity: settings.agencySettings?.forumCity || "São Paulo - SP",
                clientName: lead.companyName || lead.name,
                clientEmail: lead.email,
                clientCnpjCpf: "",
                clientAddress: "",
                serviceDescription: "Gestão de Tráfego Pago",
                investmentValue: "R$ 1.000,00",
                setupValue: "R$ 0,00",
                durationMonths: "3",
                paymentConditions: "Boleto ou PIX",
                paymentDay: "10",
                status: "draft"
             });
          } else {
             setTemplateMd(lead.contract.markdownTemplate || settings.contractTemplateMd || DEFAULT_CONTRACT);
          }
        })
        .finally(() => setLoadingSettings(false));
    }
  }, [isOpen, lead]);

  const handlePrint = async () => {
    const el = document.getElementById("contract-content");
    if (!el) return;
    
    // Add a wrapper class or adjust styles temporarily
    const originalDisplay = el.style.display;
    
    try {
      const { exportPdfSmartBreaks } = await import("../lib/exportPdfSmartBreaks");
      
      // Temporarily expand height to ensure all content is visible for html2canvas
      const originalMaxHeight = el.style.maxHeight;
      const originalOverflow = el.style.overflow;
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';

      await exportPdfSmartBreaks({
        element: el,
        fileName: `contrato_${lead.companyName || lead.name}.pdf`,
      });

      // Restore original styles
      el.style.maxHeight = originalMaxHeight;
      el.style.overflow = originalOverflow;
    } catch (e) {
      console.error("Error generating PDF", e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const handleSave = async (signAsAgency: boolean = false) => {
    setSaving(true);
    try {
      const payload = { ...contract };
      payload.markdownTemplate = templateMd;
      if (signAsAgency) {
         payload.status = "signed_by_agency";
         payload.agencySignatureDate = Date.now();
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-contract",
          leadId: lead.id,
          contract: payload
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Erro ao salvar contrato");
      
      toast.success(signAsAgency ? "Contrato gerado com sucesso!" : "Rascunho salvo!");
      
      if (signAsAgency) {
         // Generate the PDF automatically before closing
         await handlePrint();
      }

      onSuccess(body.lead);
      if (signAsAgency) onClose();
    } catch (error) {
       toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
       setSaving(false);
    }
  };

  const isSignedByAgency = contract.status === "signed_by_agency" || contract.status === "signed_by_client";
  const isSignedByClient = contract.status === "signed_by_client";

  if (loadingSettings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
           <div className="flex flex-col items-center justify-center p-10 gap-4">
              <Loader2 className="animate-spin text-gray-500" />
              <p>Carregando base da agência...</p>
           </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-[#0A0A0A] border-[#222]">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b border-[#222]">
          <DialogTitle>Gerador de Contrato</DialogTitle>
          <DialogDescription>
            Configure os parâmetros do contrato para {lead.companyName || lead.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6" id="contract-content">
          {step === "edit" && !isSignedByAgency ? (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#f6c85f] border-b border-[#222] pb-2">CONTRATANTE</h3>
                    <label className="block text-sm">
                      Razão Social / Nome Completo
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.clientName || ""} onChange={e => setContract({...contract, clientName: e.target.value})} />
                    </label>
                    <label className="block text-sm">
                      CNPJ ou CPF
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.clientCnpjCpf || ""} onChange={e => setContract({...contract, clientCnpjCpf: e.target.value})} />
                    </label>
                    <label className="block text-sm">
                      Endereço Completo
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.clientAddress || ""} onChange={e => setContract({...contract, clientAddress: e.target.value})} />
                    </label>
                    <label className="block text-sm">
                      E-mail do Contratante
                      <input type="email" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.clientEmail || ""} onChange={e => setContract({...contract, clientEmail: e.target.value})} />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#f6c85f] border-b border-[#222] pb-2">CONDIÇÕES DO SERVIÇO</h3>
                    <label className="block text-sm">
                      Descrição do Objeto
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.serviceDescription || ""} onChange={e => setContract({...contract, serviceDescription: e.target.value})} />
                    </label>
                    <label className="block text-sm">
                      Investimento Mensal
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.investmentValue || ""} onChange={e => setContract({...contract, investmentValue: e.target.value})} />
                    </label>
                    <label className="block text-sm">
                      Taxa de Setup
                      <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.setupValue || ""} onChange={e => setContract({...contract, setupValue: e.target.value})} />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                       <label className="block text-sm">
                         Vigência (meses)
                         <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.durationMonths || ""} onChange={e => setContract({...contract, durationMonths: e.target.value})} />
                       </label>
                       <label className="block text-sm">
                         Dia do Pagamento
                         <input type="text" className="w-full mt-1 bg-[#111] border border-[#333] p-2 rounded text-white" value={contract.paymentDay || ""} onChange={e => setContract({...contract, paymentDay: e.target.value})} />
                       </label>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white text-black p-8 rounded min-h-[500px] text-[13px] leading-relaxed shadow-lg contract-preview-wrapper relative">
               <style>{`
                 @media print {
                   body * { visibility: hidden; }
                   #contract-content, #contract-content * { visibility: visible; color: black !important; }
                   #contract-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; background: white; }
                   .print-hidden { display: none !important; }
                 }
                 .contract-preview-wrapper h1 { font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center; text-transform: uppercase; }
                 .contract-preview-wrapper h2 { font-size: 1rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                 .contract-preview-wrapper p { margin-bottom: 1rem; text-align: justify; }
                 .contract-preview-wrapper strong { font-weight: bold; }
               `}</style>
               
               {/* Logotipo discreto no topo */}
               <div className="flex justify-center mb-8">
                 <img src="/branding/logo_base.jpg" alt="Logo" className="h-10 opacity-40 grayscale" />
               </div>

               {templateMd ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(templateMd) }} />
               ) : (
                  <div className="text-center text-gray-500 italic py-10">
                    Nenhum modelo de contrato (Markdown) foi configurado.<br/>
                    Acesse "Ajustes" para definir as diretrizes do contrato.
                  </div>
               )}

               <div className="mt-12 pt-8 border-t border-gray-300">
                  <h3 className="font-bold text-center mb-6">ASSINATURAS DIGITAIS REGISTRADAS</h3>
                  
                  <div className="grid grid-cols-2 gap-8 text-center text-xs">
                     <div className="p-4 border border-dashed border-gray-400 bg-gray-50 rounded">
                        <strong className="block text-sm mb-2">{contract.agencyName}</strong>
                        {contract.status === "signed_by_agency" || contract.status === "signed_by_client" ? (
                           <>
                             <div className="text-green-600 mb-1 flex justify-center items-center gap-1"><ShieldCheck size={14}/> Assinado Eletronicamente</div>
                             <div>Data: {new Date(contract.agencySignatureDate || 0).toLocaleString('pt-BR')}</div>
                             <div>Representante: {contract.agencyRepresentative}</div>
                           </>
                        ) : (
                           <span className="text-gray-400 italic">Aguardando assinatura do Gestor</span>
                        )}
                     </div>

                     <div className="p-4 border border-dashed border-gray-400 bg-gray-50 rounded">
                        <strong className="block text-sm mb-2">{contract.clientName}</strong>
                        {contract.status === "signed_by_client" ? (
                           <>
                             <div className="text-green-600 mb-1 flex justify-center items-center gap-1"><ShieldCheck size={14}/> Assinado Eletronicamente</div>
                             <div>Data: {new Date(contract.clientSignatureDate || 0).toLocaleString('pt-BR')}</div>
                             <div>Endereço IP: {contract.clientSignatureIP}</div>
                           </>
                        ) : (
                           <span className="text-gray-400 italic">Aguardando aceite do Cliente</span>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#222] shrink-0 bg-[#0A0A0A] flex justify-between items-center print-hidden">
          {step === "edit" && !isSignedByAgency ? (
            <>
              <button onClick={() => setStep("preview")} className="px-4 py-2 bg-[#222] text-white rounded font-medium hover:bg-[#333] transition-colors ml-auto">
                Ver Prévia do Contrato <ArrowRight size={16} className="inline ml-1" />
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                 {!isSignedByAgency && (
                   <button onClick={() => setStep("edit")} className="px-4 py-2 border border-[#333] text-gray-300 rounded hover:bg-[#111]">
                     <Edit size={14} className="inline mr-1" /> Editar Dados
                   </button>
                 )}
                 {(isSignedByAgency || isSignedByClient) && (
                   <button onClick={handlePrint} className="px-4 py-2 border border-[#333] text-gray-300 rounded hover:bg-[#111]">
                     <Download size={14} className="inline mr-1" /> Salvar PDF
                   </button>
                 )}
              </div>
              <div className="flex gap-2">
                 {!isSignedByAgency && (
                   <>
                     <button disabled={saving} onClick={() => handleSave(false)} className="px-4 py-2 border border-[#333] text-gray-300 rounded hover:bg-[#111]">
                       Salvar Rascunho
                     </button>
                     <button disabled={saving} onClick={() => handleSave(true)} className="px-4 py-2 bg-[#f6c85f] text-black rounded font-bold hover:brightness-110 flex items-center gap-2">
                       {saving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                       Gerar Contrato
                     </button>
                   </>
                 )}
                 {isSignedByAgency && !isSignedByClient && (
                   <>
                     <div className="text-sm text-[#78dce8] flex items-center gap-2 bg-[#78dce8]/10 px-3 py-1.5 rounded">
                       <Loader2 className="animate-spin" size={14} /> Aguardando cliente
                     </div>
                     <button
                       onClick={() => {
                         const link = `${window.location.origin}/contrato/${lead.id}`;
                         navigator.clipboard.writeText(link);
                         toast.success("Link do contrato copiado!");
                       }}
                       className="px-4 py-2 border border-[#333] text-gray-300 rounded hover:bg-[#111]"
                     >
                       Copiar Link
                     </button>
                   </>
                 )}
                 {isSignedByClient && (
                   <div className="text-sm text-[#a6e3a1] flex items-center gap-2 bg-[#a6e3a1]/10 px-3 py-1.5 rounded">
                     <ShieldCheck size={14} /> Contrato Vigente
                   </div>
                 )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
