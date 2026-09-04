import { useState, useRef, useEffect } from "react";
import { BrainCircuit, Loader2, Sparkles, Send, User, Bot, ChevronDown, ChevronUp } from "lucide-react";
import type { StrategicAnalysis, Lead } from "@shared/operation";

function formatGeneratedAt(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StrategicAIAssistantProps {
  leadId: string;
  analysis?: StrategicAnalysis;
  hasBriefing: boolean;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
}

export default function StrategicAIAssistant({
  leadId,
  analysis,
  hasBriefing,
  loading,
  error,
  onGenerate,
}: StrategicAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatting]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatting) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsChatting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, messages: newMessages }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao processar mensagem");
      
      setMessages([...newMessages, { role: "assistant", content: data.message.content }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: "Desculpe, ocorreu um erro: " + err.message }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <section className="analysis-panel" aria-label="Assistente de IA">
      <div className="analysis-panel-heading">
        <div>
          <span className="section-index">
            <BrainCircuit size={13} /> / ASSISTENTE DE CRESCIMENTO (IA)
          </span>
          <h3>Playbook de Aceleração & Chat</h3>
        </div>
        {analysis && (
          <time dateTime={new Date(analysis.generatedAt).toISOString()}>
            Atualizado em {formatGeneratedAt(analysis.generatedAt)}
          </time>
        )}
      </div>

      {!analysis && (
        <div className="ai-intro-state">
          <p className="settings-intro">
            Gere o Playbook de Aceleração para ter acesso a ângulos de campanha, ganchos persuasivos, segmentações e scripts de fechamento adaptados a este lead. Depois de gerado, você poderá conversar livremente com a IA.
          </p>
          <div className="analysis-inline-action">
            <button
              className="admin-secondary-button"
              type="button"
              onClick={onGenerate}
              disabled={!hasBriefing || loading}
            >
              {loading ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}{" "}
              {!hasBriefing
                ? "Salve o briefing primeiro"
                : loading
                  ? "Construindo playbook..."
                  : "Gerar Playbook de Aceleração"}
            </button>
          </div>
          {error && <div className="admin-error"><span>{error}</span></div>}
        </div>
      )}

      {analysis && (
        <div className="ai-active-state">
          {/* PLAYBOOK ACCORDION */}
          <div className="playbook-accordion">
            <button 
              type="button" 
              className="playbook-toggle" 
              onClick={() => setShowPlaybook(!showPlaybook)}
            >
              <Sparkles size={16} /> Ver Playbook de Aceleração 
              {showPlaybook ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            
            {showPlaybook && (
              <div className="playbook-content">
                <h4>Diagnóstico do Funil</h4>
                <p>{analysis.funnelDiagnosis}</p>
                
                <h4>Proposta Irrecusável</h4>
                <p>{analysis.irresistibleOffer}</p>
                
                <h4>Público e Segmentação</h4>
                <ul>
                  {analysis.audienceAndTargeting?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                
                <h4>Ganchos de Copywriting (Hooks)</h4>
                <ul>
                  {analysis.copywritingHooks?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                
                <h4>Script de Fechamento (WhatsApp)</h4>
                <div className="script-box">
                  <p>{analysis.closingScript}</p>
                </div>
                
                <div className="analysis-inline-action" style={{ marginTop: 20 }}>
                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={onGenerate}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}{" "}
                    {loading ? "Regerando..." : "Regerar Playbook"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CHAT INTERFACE */}
          <div className="ai-chat-container">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <Bot size={24} />
                  <p>Pergunte sobre anúncios, copies ou objeções para este lead.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className="chat-avatar">
                      {msg.role === "user" ? <User size={14}/> : <Bot size={14}/>}
                    </div>
                    <div className="chat-content">
                      {msg.content.split("\n").map((line, idx) => (
                        <span key={idx}>{line}<br/></span>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {isChatting && (
                <div className="chat-bubble assistant">
                  <div className="chat-avatar"><Bot size={14}/></div>
                  <div className="chat-content"><Loader2 size={14} className="spin" /> Pensando...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                placeholder="Ex: Crie 3 variações de roteiro para o Google Ads..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isChatting}
              />
              <button type="submit" disabled={!input.trim() || isChatting}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
