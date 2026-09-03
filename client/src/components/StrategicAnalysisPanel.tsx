import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import type { StrategicAnalysis } from "@shared/operation";

function formatGeneratedAt(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

interface StrategicAnalysisPanelProps {
  analysis?: StrategicAnalysis;
  hasBriefing: boolean;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
}

export default function StrategicAnalysisPanel({
  analysis,
  hasBriefing,
  loading,
  error,
  onGenerate,
}: StrategicAnalysisPanelProps) {
  return (
    <section className="analysis-panel" aria-label="Análise estratégica por IA">
      <div className="analysis-panel-heading">
        <div>
          <span className="section-index">
            <BrainCircuit size={13} /> / LEITURA ESTRATÉGICA
          </span>
          <h3>Transforme contexto em direção.</h3>
        </div>
        {analysis && (
          <time dateTime={new Date(analysis.generatedAt).toISOString()}>
            Gerado em {formatGeneratedAt(analysis.generatedAt)}
          </time>
        )}
      </div>
      {!analysis && (
        <>
          <p className="settings-intro">
            A IA cruza as respostas do formulário com o briefing salvo e entrega
            hipóteses práticas para a conversa e para a próxima campanha. Use
            como ponto de partida estratégico, não como verdade automática.
          </p>
          <div className="analysis-inline-action">
            <button
              className="admin-secondary-button"
              type="button"
              onClick={onGenerate}
              disabled={!hasBriefing || loading}
            >
              {loading ? (
                <Loader2 className="spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}{" "}
              {!hasBriefing
                ? "Salve o briefing primeiro"
                : loading
                  ? "Analisando contexto..."
                  : "Gerar análise estratégica"}
            </button>
          </div>
          {error && (
            <div className="admin-error">
              <span>{error}</span>
            </div>
          )}
        </>
      )}
      {analysis && (
        <>
          <h4>Diagnóstico</h4>
          <p>{analysis.diagnosis}</p>
          <h4>Ângulos de campanha</h4>
          <div className="analysis-angle-grid">
            {analysis.campaignAngles.map((angle, index) => (
              <article
                className="analysis-angle"
                key={`${angle.title}-${index}`}
              >
                <strong>{angle.title}</strong>
                <p>{angle.rationale}</p>
                <em>Gancho: {angle.hook}</em>
                <p>CTA: {angle.callToAction}</p>
              </article>
            ))}
          </div>
          <h4>Hipóteses de público</h4>
          <ul>
            {analysis.audienceHypotheses.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
          <h4>Perguntas para a reunião</h4>
          <ul>
            {analysis.meetingQuestions.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
          <h4>Lacunas e riscos</h4>
          <ul>
            {analysis.risksAndGaps.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
          <h4>Próximo passo recomendado</h4>
          <p>{analysis.recommendedNextStep}</p>
          <div className="analysis-inline-action">
            <button
              className="admin-secondary-button"
              type="button"
              onClick={onGenerate}
              disabled={!hasBriefing || loading}
            >
              {loading ? (
                <Loader2 className="spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}{" "}
              {loading ? "Atualizando análise..." : "Atualizar análise"}
            </button>
          </div>
          {error && (
            <div className="admin-error">
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
