import { useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  Loader2,
  Sparkles,
  Send,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { StrategicAnalysis } from "@shared/operation";
import type { Lead } from "@shared/leads";

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
  analysis?: StrategicAnalysis; // we might repurpose this, or leave as legacy
  hasBriefing: boolean;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
}

type AgentStatus = "idle" | "loading" | "success" | "error";

interface WarRoomState {
  strategist: { status: AgentStatus; result: string };
  copywriter: { status: AgentStatus; result: string };
  designer: { status: AgentStatus; result: string };
  traffic: { status: AgentStatus; result: string };
}

export default function StrategicAIAssistant({
  leadId,
  analysis,
  hasBriefing,
  loading: externalLoading,
  error: externalError,
  onGenerate,
}: StrategicAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "strategist" | "copywriter" | "designer" | "traffic"
  >("strategist");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [pipelineState, setPipelineState] = useState<WarRoomState>(() => {
    if (analysis && (analysis.strategist || analysis.copywriter || analysis.designer || analysis.traffic)) {
      return {
        strategist: { status: analysis.strategist ? "success" : "idle", result: analysis.strategist || "" },
        copywriter: { status: analysis.copywriter ? "success" : "idle", result: analysis.copywriter || "" },
        designer: { status: analysis.designer ? "success" : "idle", result: analysis.designer || "" },
        traffic: { status: analysis.traffic ? "success" : "idle", result: analysis.traffic || "" },
      };
    }
    return {
      strategist: { status: "idle", result: "" },
      copywriter: { status: "idle", result: "" },
      designer: { status: "idle", result: "" },
      traffic: { status: "idle", result: "" },
    };
  });

  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineError, setPipelineError] = useState("");

  const hasResults = pipelineState.strategist.status === "success";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatting]);

  const startPipeline = async () => {
    if (!hasBriefing) return;
    setIsPipelineRunning(true);
    setPipelineError("");
    setPipelineState({
      strategist: { status: "loading", result: "" },
      copywriter: { status: "idle", result: "" },
      designer: { status: "idle", result: "" },
      traffic: { status: "idle", result: "" },
    });

    try {
      // 1. Estrategista
      const resStrat = await fetch("/api/agents/strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const dataStrat = await resStrat.json();
      if (!resStrat.ok)
        throw new Error(dataStrat.error || "Erro no Estrategista");
      const stratResult = dataStrat.result;

      setPipelineState(prev => ({
        ...prev,
        strategist: { status: "success", result: stratResult },
        copywriter: { status: "loading", result: "" },
      }));
      setActiveTab("strategist");

      // 2. Copywriter
      const resCopy = await fetch("/api/agents/copywriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: stratResult }),
      });
      const dataCopy = await resCopy.json();
      if (!resCopy.ok) throw new Error(dataCopy.error || "Erro no Copywriter");
      const copyResult = dataCopy.result;

      setPipelineState(prev => ({
        ...prev,
        copywriter: { status: "success", result: copyResult },
        designer: { status: "loading", result: "" },
      }));
      setActiveTab("copywriter");

      // 3. Designer (Carrossel)
      const resDesigner = await fetch("/api/agents/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: copyResult }),
      });
      const dataDesigner = await resDesigner.json();
      if (!resDesigner.ok)
        throw new Error(dataDesigner.error || "Erro no Designer");
      const designerResult = dataDesigner.result;

      setPipelineState(prev => ({
        ...prev,
        designer: { status: "success", result: designerResult },
        traffic: { status: "loading", result: "" },
      }));
      setActiveTab("designer");

      // 4. Gestor de Tráfego
      const resTraffic = await fetch("/api/agents/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextCopy: copyResult,
          contextStrategy: stratResult,
        }),
      });
      const dataTraffic = await resTraffic.json();
      if (!resTraffic.ok)
        throw new Error(dataTraffic.error || "Erro no Gestor");
      const trafficResult = dataTraffic.result;

      const finalState: WarRoomState = {
        strategist: { status: "success", result: stratResult },
        copywriter: { status: "success", result: copyResult },
        designer: { status: "success", result: designerResult },
        traffic: { status: "success", result: trafficResult },
      };

      setPipelineState(finalState);
      setActiveTab("traffic");

      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save-analysis",
            leadId,
            analysis: {
              strategist: stratResult,
              copywriter: copyResult,
              designer: designerResult,
              traffic: trafficResult,
              generatedAt: Date.now()
            }
          })
        });
      } catch (err) {
        console.error("Erro ao salvar sala de guerra no banco de dados:", err);
      }
    } catch (err: any) {
      setPipelineError(err.message);
      setPipelineState(prev => {
        const next = { ...prev };
        if (next.strategist.status === "loading")
          next.strategist.status = "error";
        if (next.copywriter.status === "loading")
          next.copywriter.status = "error";
        if (next.designer.status === "loading") next.designer.status = "error";
        if (next.traffic.status === "loading") next.traffic.status = "error";
        return next;
      });
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatting) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsChatting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, messages: newMessages }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Erro ao processar mensagem");

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message.content },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro: " + err.message,
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const renderStatusIcon = (status: AgentStatus) => {
    if (status === "loading") return <Loader2 className="spin" size={16} />;
    if (status === "success")
      return <CheckCircle2 size={16} style={{ color: "#22c55e" }} />;
    if (status === "error")
      return <AlertCircle size={16} style={{ color: "#ef4444" }} />;
    return (
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid #ccc",
        }}
      />
    );
  };

  return (
    <section className="analysis-panel" aria-label="Sala de Guerra (War Room)">
      <div className="analysis-panel-heading">
        <div>
          <span className="section-index">
            <BrainCircuit size={13} /> / SALA DE GUERRA (AGÊNCIA DE IA)
          </span>
          <h3>Pipeline de Produção & Chat</h3>
        </div>
      </div>

      {!hasResults && !isPipelineRunning && (
        <div className="ai-intro-state">
          <p className="settings-intro">
            A <strong>Sala de Guerra</strong> reúne seus agentes especializados:
            Estrategista, Copywriter, Designer e Gestor de Tráfego. Eles vão
            analisar o briefing em sequência para montar toda a campanha do
            lead.
          </p>
          <div className="analysis-inline-action">
            <button
              className="admin-secondary-button"
              type="button"
              onClick={startPipeline}
              disabled={!hasBriefing}
            >
              <Sparkles size={14} />
              {!hasBriefing
                ? "Salve o briefing primeiro"
                : "Iniciar Produção da Equipe de IA"}
            </button>
          </div>
          {(externalError || pipelineError) && (
            <div className="admin-error">
              <span>{externalError || pipelineError}</span>
            </div>
          )}
        </div>
      )}

      {(hasResults || isPipelineRunning) && (
        <div className="war-room-active-state" style={{ marginTop: 20 }}>
          <div
            className="war-room-pipeline"
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {['strategist', 'copywriter', 'designer', 'traffic'].map((key, idx) => {
              const labels = ['1. Estrategista', '2. Copywriter', '3. Designer', '4. Gestor Ads'];
              const status = pipelineState[key as keyof WarRoomState].status;
              return (
                <div
                  key={key}
                  className="agent-step"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 15px",
                    background: "var(--card, #171717)",
                    border: "1px solid var(--border, rgba(240,240,240,0.13))",
                    borderRadius: 8,
                    color: status === "success" ? "var(--foreground, #f0f0f0)" : "#887e7e",
                  }}
                >
                  {renderStatusIcon(status)}
                  <span>{labels[idx]}</span>
                </div>
              );
            })}
          </div>

          <div
            className="war-room-tabs"
            style={{
              display: "flex",
              gap: 5,
              borderBottom: "1px solid var(--border, rgba(240,240,240,0.13))",
              marginBottom: 20,
            }}
          >
            {["strategist", "copywriter", "designer", "traffic"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: "10px 20px",
                  background: activeTab === tab ? "rgba(56, 255, 20, 0.05)" : "transparent",
                  color: activeTab === tab ? "var(--acid, #38ff14)" : "#887e7e",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--acid, #38ff14)"
                      : "2px solid transparent",
                  cursor: "pointer",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {tab === "traffic" ? "Gestor" : tab}
              </button>
            ))}
          </div>

          <div
            className="war-room-result"
            style={{
              background: "var(--card, #171717)",
              padding: 20,
              border: "1px solid var(--border, rgba(240,240,240,0.13))",
              borderRadius: 8,
              maxHeight: 400,
              overflowY: "auto",
              color: "var(--foreground, #f0f0f0)",
            }}
          >
            {pipelineState[activeTab].status === "loading" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#887e7e",
                }}
              >
                <Loader2 className="spin" size={18} /> O agente está
                trabalhando...
              </div>
            )}
            {pipelineState[activeTab].status === "idle" && (
              <div style={{ color: "#887e7e" }}>
                Aguardando a etapa anterior...
              </div>
            )}
            {pipelineState[activeTab].status === "success" && (
              <div
                className="markdown-content"
                style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {pipelineState[activeTab].result}
              </div>
            )}
            {pipelineState[activeTab].status === "error" && (
              <div style={{ color: "#ef4444" }}>
                Ocorreu um erro nesta etapa. {pipelineError}
              </div>
            )}
          </div>

          {/* CHAT INTERFACE - Somente se finalizou (ou se pelo menos 1 já acabou) */}
          {hasResults && (
            <div className="ai-chat-container" style={{ marginTop: 30 }}>
              <h4 style={{ marginBottom: 15, fontSize: 14, color: "#475569" }}>
                Conversar com a Equipe:
              </h4>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <Bot size={24} />
                    <p>
                      Pergunte sobre ajustes na estratégia, copy ou criativos. A
                      IA já tem todo o contexto.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                      <div className="chat-avatar">
                        {msg.role === "user" ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}
                      </div>
                      <div className="chat-content">
                        {msg.content.split("\n").map((line, idx) => (
                          <span key={idx}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="chat-bubble assistant">
                    <div className="chat-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="chat-content">
                      <Loader2 size={14} className="spin" /> Pensando...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Ex: Refaça a copy com um tom mais urgente..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isChatting}
                />
                <button type="submit" disabled={!input.trim() || isChatting}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
