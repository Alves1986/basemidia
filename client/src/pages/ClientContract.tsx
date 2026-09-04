import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ShieldCheck, Loader2, Download, AlertTriangle } from "lucide-react";
import type { Lead } from "@shared/leads";

export default function ClientContract() {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${leadId}`, { credentials: "omit" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Contrato não encontrado");
        setLead(body.lead);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleSign = async () => {
    if (!lead || !lead.contract) return;
    setSigning(true);
    try {
      // Usar a rota genérica POST em /api/leads ou ajustar se for necessário
      const response = await fetch(`/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "client-sign-contract", leadId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha ao assinar contrato");
      setLead(body.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = async () => {
    const el = document.getElementById("contract-content");
    if (!el) return;
    
    const originalDisplay = el.style.display;
    
    try {
      const { getHtml2Pdf } = await import("../lib/pdfUtils");
      const html2pdf = await getHtml2Pdf();
      
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `contrato_${lead?.companyName || lead?.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      await html2pdf().set(opt).from(el).save();
    } catch (e) {
      console.error("Error generating PDF", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-gray-500 mb-4" size={32} />
        <p>Carregando contrato...</p>
      </div>
    );
  }

  if (error || !lead || !lead.contract) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-6">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
        <p className="text-gray-400 max-w-md text-center">{error || "Contrato não encontrado ou ainda não foi gerado pela agência."}</p>
      </div>
    );
  }

  const contract = lead.contract;
  const isSignedByAgency = contract.status === "signed_by_agency" || contract.status === "signed_by_client";
  const isSignedByClient = contract.status === "signed_by_client";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white py-12 px-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
           <div>
             <h1 className="text-2xl font-bold text-[#f6c85f]">Portal de Assinatura</h1>
             <p className="text-gray-400 text-sm mt-1">Visualize e assine seu contrato de prestação de serviços.</p>
           </div>
           
           <div className="flex gap-2">
              {(isSignedByAgency || isSignedByClient) && (
                <button onClick={handlePrint} className="px-4 py-2 border border-[#333] text-gray-300 rounded hover:bg-[#111] flex items-center justify-center min-w-[140px]">
                  <Download size={16} className="mr-2" /> Salvar PDF
                </button>
              )}
              {isSignedByAgency && !isSignedByClient && (
                <button disabled={signing} onClick={handleSign} className="px-6 py-2 bg-[#f6c85f] text-black font-bold rounded hover:brightness-110 flex items-center justify-center min-w-[200px]">
                  {signing ? <Loader2 className="animate-spin" size={16} /> : "Assinar Contrato"}
                </button>
              )}
              {isSignedByClient && (
                <div className="px-6 py-2 bg-[#a6e3a1]/20 text-[#a6e3a1] font-bold rounded flex items-center justify-center min-w-[200px]">
                  <ShieldCheck size={18} className="mr-2" /> Assinado
                </div>
              )}
           </div>
        </div>

        <div className="bg-white text-black p-8 sm:p-12 rounded shadow-2xl text-[13px] sm:text-[14px] leading-relaxed relative print:shadow-none print:p-0" id="contract-content">
           <style>{`
             @media print {
               body * { visibility: hidden; }
               #contract-content, #contract-content * { visibility: visible; color: black !important; }
               #contract-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; background: white; }
               .print\\:hidden { display: none !important; }
             }
           `}</style>

           {!isSignedByAgency && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 print:hidden rounded">
                 <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center shadow-lg border border-red-200">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <h2 className="font-bold text-lg mb-1">Contrato em Rascunho</h2>
                    <p className="text-sm">A agência ainda não assinou este contrato.</p>
                 </div>
              </div>
           )}

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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
                 <div className="p-4 border border-dashed border-gray-400 bg-gray-50 rounded">
                    <strong className="block text-sm mb-2">{contract.agencyName}</strong>
                    {contract.status === "signed_by_agency" || contract.status === "signed_by_client" ? (
                       <>
                         <div className="text-green-600 mb-1 flex justify-center items-center gap-1 font-medium"><ShieldCheck size={14}/> Assinado Eletronicamente</div>
                         <div className="text-gray-600">Data: {new Date(contract.agencySignatureDate || 0).toLocaleString('pt-BR')}</div>
                         <div className="text-gray-600 mt-1">Representante Legal: {contract.agencyRepresentative}</div>
                       </>
                    ) : (
                       <span className="text-gray-400 italic">Aguardando assinatura do Gestor</span>
                    )}
                 </div>

                 <div className="p-4 border border-dashed border-gray-400 bg-gray-50 rounded">
                    <strong className="block text-sm mb-2">{contract.clientName}</strong>
                    {contract.status === "signed_by_client" ? (
                       <>
                         <div className="text-green-600 mb-1 flex justify-center items-center gap-1 font-medium"><ShieldCheck size={14}/> Assinado Eletronicamente</div>
                         <div className="text-gray-600">Data: {new Date(contract.clientSignatureDate || 0).toLocaleString('pt-BR')}</div>
                         <div className="text-gray-600 mt-1">IP do Signatário: {contract.clientSignatureIP}</div>
                       </>
                    ) : (
                       <span className="text-gray-400 italic">Aguardando seu aceite e assinatura</span>
                    )}
                 </div>
              </div>

              {isSignedByClient && (
                <div className="mt-8 text-[10px] text-gray-400 text-center uppercase tracking-wide">
                  Documento validado e registrado via plataforma Base Mídia
                </div>
              )}
           </div>
        </div>
      </div>
    </main>
  );
}
