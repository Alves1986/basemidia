import React, { useEffect, useState } from "react";
import { Loader2, ArrowRight, ShieldCheck, Download, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { type Lead, type Contract } from "@shared/leads";
import { type OperationSettings } from "@shared/operation";

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
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [agencyName, setAgencyName] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings", { credentials: "same-origin" })
        .then(res => res.json())
        .then(data => {
          const settings = data.settings as OperationSettings;
          setAgencyName(settings.agencySettings?.name || "Agência Não Configurada");
          
          if (!lead.contract) {
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
          }
        })
        .finally(() => setLoadingSettings(false));
    }
  }, [isOpen, lead]);

  const handleSave = async (signAsAgency: boolean = false) => {
    setSaving(true);
    try {
      const payload = { ...contract };
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
      
      toast.success(signAsAgency ? "Contrato assinado!" : "Rascunho salvo!");
      onSuccess(body.lead);
      if (signAsAgency) onClose();
    } catch (error) {
       toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
       setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
            <div className="bg-white text-black p-8 rounded min-h-[500px] text-[13px] leading-relaxed shadow-lg">
               <style>{`
                 @media print {
                   body * { visibility: hidden; }
                   #contract-content, #contract-content * { visibility: visible; color: black !important; }
                   #contract-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; background: white; }
                   .print-hidden { display: none !important; }
                 }
               `}</style>
               <h1 className="text-center font-bold text-lg mb-8 uppercase">INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE {contract.serviceDescription?.toUpperCase()}</h1>
               
               <p className="mb-4 text-justify">
                 Pelo presente instrumento particular, de um lado, <strong>{contract.agencyName}</strong>, inscrita no CNPJ sob o nº {contract.agencyCnpj}, sediada em {contract.agencyAddress}, neste ato representada por {contract.agencyRepresentative}, doravante denominada <strong>CONTRATADA</strong>, e, de outro lado, <strong>{contract.clientName}</strong>, inscrito(a) no CPF/CNPJ sob o nº {contract.clientCnpjCpf}, com endereço em {contract.clientAddress}, doravante denominado(a) <strong>CONTRATANTE</strong>.
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 1 - DO OBJETO</h2>
               <p className="mb-4 text-justify">
                 O presente contrato tem por objeto a prestação, pela CONTRATADA à CONTRATANTE, de serviços especializados de <strong>{contract.serviceDescription}</strong>, focados em estratégia digital, criação de campanhas, monitoramento e otimização de anúncios em plataformas digitais conforme escopo acordado entre as partes.
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 2 - DAS OBRIGAÇÕES DA CONTRATADA</h2>
               <p className="mb-4 text-justify">
                 Compete à CONTRATADA: a) Planejar, executar e monitorar as campanhas de anúncios; b) Fornecer relatórios periódicos de desempenho; c) Prestar o serviço com zelo e diligência, aplicando as melhores práticas de mercado. A CONTRATADA atua em regime de meios (prestação do serviço de gestão) e não de garantia de resultados (faturamento).
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 3 - DAS OBRIGAÇÕES DA CONTRATANTE</h2>
               <p className="mb-4 text-justify">
                 Compete à CONTRATANTE: a) Fornecer todas as informações, materiais (criativos, fotos, vídeos) e acessos necessários em tempo hábil; b) Arcar diretamente com os custos de veiculação (orçamento de mídia) cobrados pelas plataformas de anúncios; c) Efetuar o pagamento dos honorários da CONTRATADA nas datas estipuladas.
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 4 - DA REMUNERAÇÃO E FORMA DE PAGAMENTO</h2>
               <p className="mb-4 text-justify">
                 Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA:
                 <br />- <strong>Investimento Mensal (Honorários):</strong> {contract.investmentValue}
                 {contract.setupValue && contract.setupValue !== "R$ 0,00" && <><br />- <strong>Taxa de Setup:</strong> {contract.setupValue}</>}
                 <br />- <strong>Vencimento:</strong> Todo dia {contract.paymentDay} de cada mês.
                 <br />- <strong>Condições:</strong> {contract.paymentConditions}.
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 5 - DA VIGÊNCIA E RESCISÃO</h2>
               <p className="mb-4 text-justify">
                 O presente contrato entra em vigor na data de sua assinatura, com validade de <strong>{contract.durationMonths} meses</strong>, renovando-se automaticamente por prazos iguais e sucessivos caso não haja manifestação em contrário. O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio por escrito de 30 dias.
               </p>

               <h2 className="font-bold mt-6 mb-2">CLÁUSULA 6 - DO FORO</h2>
               <p className="mb-8 text-justify">
                 Fica eleito o foro da comarca de {contract.forumCity} para dirimir quaisquer dúvidas oriundas deste contrato.
               </p>

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
                       Assinar como Agência
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
