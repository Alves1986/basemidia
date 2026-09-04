// Design: Dark Performance Lab — neo-brutalist digital, assimetria editorial, verde ácido como sinal de ação e prova.
import { useEffect, useState, useRef } from "react";
import { motion, animate, useInView } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  LockKeyhole,
  Menu,
  MoveUpRight,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import heroDashboard from "../assets/base-midia-hero-dashboard.svg";
import signalDetail from "../assets/base-midia-signal-detail.svg";
import officialLogo from "../assets/logo_bm.png";

const painPoints = [
  "Você investe em anúncios e não sabe exatamente onde está o problema?",
  "Seu tráfego gera clique, mas não gera lead qualificado?",
  "O anúncio roda, mas o comercial não sente diferença?",
];

const steps = [
  {
    number: "01",
    title: "Você conta o cenário",
    copy: "Um formulário curto revela canal, momento e o gargalo que mais pesa hoje.",
  },
  {
    number: "02",
    title: "A gente faz a triagem",
    copy: "Organizamos sua dor em hipóteses objetivas, sem diagnóstico genérico.",
  },
  {
    number: "03",
    title: "Marcamos o próximo movimento",
    copy: "Se fizer sentido, você agenda uma conversa gratuita para entender as prioridades.",
  },
];

const faqs = [
  [
    "O diagnóstico é realmente gratuito?",
    "Sim. A primeira conversa é uma análise inicial sem custo e sem compromisso de contratação.",
  ],
  [
    "Serve para quem ainda não anuncia?",
    "Serve. Entender a base antes de investir é justamente uma das formas mais seguras de começar.",
  ],
  [
    "Vocês atendem empresas locais?",
    "Sim. A BASE MÍDIA trabalha com negócios locais e empresas que precisam transformar mídia em demanda real.",
  ],
  [
    "Preciso ter site ou Instagram ativo?",
    "Não para preencher o formulário. O diagnóstico serve também para apontar quais bases precisam ser fortalecidas.",
  ],
];

const painOptions = [
  "Poucos cliques",
  "Cliques sem contato",
  "Contato sem venda",
  "Não sei o que priorizar",
];

const goalOptions = [
  "Mais previsibilidade",
  "Reduzir custo por lead",
  "Escalar o que já funciona",
  "Começar do zero",
];

const AnimatedNumber = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate(v) {
          if (ref.current) {
            ref.current.textContent = Math.round(v).toString() + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [value, inView, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const generateData = () => {
  const data = [];
  let currentVal = 10;
  for (let i = 0; i < 30; i++) {
    currentVal += (Math.random() - 0.4) * 15;
    if (currentVal < 0) currentVal = 0;
    data.push({ x: i, y: currentVal });
  }
  return data;
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    whatsapp: "",
    email: "",
    segment: "",
    ads: "",
    pain: "",
    goal: "",
  });

  const openDiagnostic = () => {
    setMenuOpen(false);
    setIsFormOpen(true);
    setFormStep(1);
  };
  const closeDiagnostic = () => setIsFormOpen(false);
  const update = (field: string, value: string) =>
    setForm(current => ({ ...current, [field]: value }));
  const goToStep = (step: number) => setFormStep(step);
  const canAdvance =
    form.companyName.trim() !== "" &&
    form.name.trim() !== "" &&
    form.whatsapp.trim() !== "" &&
    form.segment !== "" &&
    form.ads !== "";
  const canSubmit = form.pain !== "" && form.goal !== "";
  const submitForm = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSubmitError(
          body.error ?? "Não foi possível enviar suas respostas agora."
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Não foi possível conectar ao formulário agora. Tente novamente em instantes."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isFormOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDiagnostic();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen]);

  return (
    <main className="site-shell">
      <AnimatedBackground />
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="BASE MÍDIA início">
          <img src={officialLogo} alt="BASE MÍDIA" className="brand-logo" />
        </a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <a href="#metodo" onClick={() => setMenuOpen(false)}>
            Como funciona
          </a>
          <button className="nav-cta" onClick={openDiagnostic}>
            Diagnóstico gratuito <ArrowUpRight size={15} />
          </button>
        </div>
        <button
          className="menu-toggle"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
      <aside className="progress-rail" aria-label="Etapas do diagnóstico">
        <a href="#top">
          <span>00</span>
          <i />
          <b>INÍCIO</b>
        </a>
        <a href="#dor">
          <span>01</span>
          <i />
          <b>DOR</b>
        </a>
        <a href="#metodo">
          <span>02</span>
          <i />
          <b>MÉTODO</b>
        </a>
        <button onClick={openDiagnostic}>
          <span>03</span>
          <i />
          <b>AÇÃO</b>
        </button>
      </aside>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> GESTÃO DE TRÁFEGO COM BASE
          </div>
          <h1>
            Antes de apertar o botão<span className="acid">,</span>
            <br />
            <em>encontre o gargalo.</em>
          </h1>
          <p className="hero-lede">
            Gestão de tráfego com planejamento antes da execução. Receba um
            diagnóstico gratuito para entender onde seu tráfego está travando e
            o que precisa ser ajustado para gerar mais resultado.
          </p>
          <div className="hero-actions">
            <button className="primary-cta" onClick={openDiagnostic}>
              Quero meu diagnóstico gratuito <ArrowUpRight size={18} />
            </button>
            <a className="text-cta" href="#dor">
              Entender minha dor primeiro <ArrowDownRight size={16} />
            </a>
          </div>
          <div className="trust-row">
            <ShieldCheck size={15} />
            <span>Sem compromisso</span>
            <i /> <Clock3 size={15} />
            <span>Resposta em até 1 dia útil</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-label label-top">
            PAINEL DE CONTROLE <span>LIVE</span>
          </div>
          <div className="dashboard-frame">
            <img
              src={heroDashboard}
              alt="Visualização abstrata de um dashboard de performance"
            />
            <div className="dashboard-overlay">
              <div className="metric-card">
                <span>ÍNDICE DE CLAREZA</span>
                <strong>
                  82.4<small>%</small>
                </strong>
                <b>
                  <ArrowUpRight size={13} /> +18.6%
                </b>
              </div>
              <div className="metric-card metric-dark">
                <span>PRÓXIMO GARGALO</span>
                <strong>CONVERSÃO</strong>
                <div className="mini-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </div>
          <div className="visual-label label-bottom">
            <span className="mono-accent">03</span> sinais para uma decisão
            melhor
          </div>
        </div>
        <div className="hero-side-note">
          <span>01</span>
          <span>PLANEJAR</span>
          <span>02</span>
          <span>MEDIR</span>
          <span>03</span>
          <span>OTIMIZAR</span>
        </div>
      </section>

      <motion.section
        id="dor"
        className="pain-section section-pad"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-index">/ 01 — RECONHECIMENTO</div>
        <div className="pain-layout">
          <div className="section-heading">
            <div className="readout">
              <span>FINDING_01</span>
              <b>CLAREZA ABAIXO DO INVESTIMENTO</b>
            </div>
            <h2>
              Seu tráfego não precisa de mais <span>achismo.</span>
            </h2>
            <p>
              Quando o investimento cresce e a clareza não acompanha, o problema
              raramente está em apenas um botão.
            </p>
          </div>
          <div className="pain-list">
            {painPoints.map((pain, index) => (
              <div className="pain-item" key={pain}>
                <span>0{index + 1}</span>
                <p>{pain}</p>
                <ArrowUpRight size={19} />
              </div>
            ))}
          </div>
        </div>
        <div className="statement-strip">
          <span className="quote-mark">“</span>
          <p>
            Planejamento não é uma etapa burocrática.
            <br />
            <strong>É onde o resultado começa.</strong>
          </p>
          <div className="strip-line" />
        </div>
      </motion.section>

      <motion.section
        id="metodo"
        className="method-section section-pad"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-index">/ 02 — MÉTODO</div>
        <div className="method-intro">
          <div>
            <div className="readout">
              <span>METHOD_TRACE / 03 NÓS</span>
              <b>FLUXO DE DECISÃO</b>
            </div>
            <h2>
              Clareza primeiro.
              <br />
              <span>Execução depois.</span>
            </h2>
          </div>
          <p>
            Um processo simples para tirar o ruído da frente e colocar a decisão
            certa no centro.
          </p>
        </div>
        <div className="steps-list">
          {steps.map(step => (
            <div className="step-row" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div className="step-icon">
                <Target size={21} />
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
              <MoveUpRight className="step-arrow" size={21} />
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="proof-section section-pad"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="proof-image">
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              opacity: 0.8,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={generateData()}
                margin={{ top: 120, right: 0, left: 0, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38FF14" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38FF14" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="#38FF14"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorGreen)"
                  isAnimationActive={true}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              color: "#38FF14",
              fontSize: "10px",
              letterSpacing: "0.14em",
              fontFamily: "monospace",
            }}
          >
            SINAL / LEITURA / DECISÃO
          </div>
          <div
            style={{
              position: "absolute",
              top: "44px",
              left: "24px",
              color: "#806060",
              fontSize: "10px",
              letterSpacing: "0.14em",
              fontFamily: "monospace",
            }}
          >
            FINDING_01 / CONVERSÃO
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "24px",
              border: "1px solid #38FF14",
              padding: "6px 12px",
              borderRadius: "4px",
              background: "rgba(56, 255, 20, 0.1)",
              color: "#38FF14",
              fontSize: "10px",
              letterSpacing: "0.14em",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            LEITURA ATIVA
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              color: "#806060",
              fontSize: "10px",
              letterSpacing: "0.14em",
              fontFamily: "monospace",
            }}
          >
            ATUALIZAÇÃO / 24H
          </div>
        </div>
        <div className="proof-copy">
          <div className="section-index">/ 03 — CREDIBILIDADE</div>
          <h2>
            Mídia sem leitura é só <span>custo.</span>
          </h2>
          <p>
            A BASE MÍDIA existe para conectar planejamento, análise e otimização
            em um sistema que o seu comercial consegue sentir.
          </p>
          <div className="proof-grid">
            <div>
              <strong>
                <AnimatedNumber value={3} />
                <span>×</span>
              </strong>
              <small>
                camadas de
                <br />
                análise
              </small>
            </div>
            <div>
              <strong>
                <AnimatedNumber value={90} />
              </strong>
              <small>
                dias para uma
                <br />
                visão de evolução
              </small>
            </div>
            <div>
              <strong>
                <AnimatedNumber value={1} />
              </strong>
              <small>
                próximo movimento
                <br />
                por vez
              </small>
            </div>
          </div>
          <button className="outline-cta" onClick={openDiagnostic}>
            Ver se faz sentido para mim <ArrowUpRight size={17} />
          </button>
        </div>
      </motion.section>

      <motion.section
        className="faq-section section-pad"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-index">/ 04 — DÚVIDAS FREQUENTES</div>
        <div className="faq-layout">
          <h2>
            Antes de decidir,
            <br />
            <span>tire o ruído.</span>
          </h2>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={18} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="final-cta"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="final-grid" />
        <div className="section-index">/ PRÓXIMO MOVIMENTO</div>
        <h2>
          Pronto para entender o que está
          <br />
          <span>travando seus anúncios?</span>
        </h2>
        <button className="primary-cta" onClick={openDiagnostic}>
          Agendar diagnóstico gratuito <ArrowUpRight size={18} />
        </button>
        <p>
          <Clock3 size={14} /> Resposta em até 1 dia útil
        </p>
      </motion.section>

      <footer className="footer">
        <div className="footer-brand">
          <img
            src={officialLogo}
            alt="BASE MÍDIA"
            className="brand-logo footer-logo"
          />
          <p>Planejamento antes da execução.</p>
        </div>
        <div className="footer-meta">
          <a className="footer-admin-link" href="/auth">
            Área restrita <ArrowUpRight size={12} />
          </a>
          <span>© 2026 BASE MÍDIA</span>
          <span>Privacidade & dados</span>
        </div>
      </footer>

      {isFormOpen && (
        <div
          id="diagnostico"
          className="modal-backdrop"
          role="presentation"
          onMouseDown={closeDiagnostic}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnostico-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Fechar formulário"
              onClick={closeDiagnostic}
            >
              <X size={21} />
            </button>
            {submitted ? (
              <div className="success-state modal-success">
                <div className="success-icon">
                  <Check size={28} />
                </div>
                <div className="section-index">/ RECEBIDO</div>
                <h3>Seu cenário chegou até a gente.</h3>
                <p>
                  Vamos analisar suas respostas e entrar em contato em até 1 dia
                  útil para combinar o próximo passo.
                </p>
                <button
                  className="primary-cta"
                  onClick={() => {
                    setSubmitted(false);
                    closeDiagnostic();
                  }}
                >
                  Fechar <X size={17} />
                </button>
              </div>
            ) : (
              <div className="modal-form-content modal-form-stepped">
                <div className="modal-heading">
                  <div className="section-index">/ DIAGNÓSTICO GRATUITO</div>
                  <h2 id="diagnostico-title">
                    Conte o cenário.
                    <br />
                    <span>A gente organiza o próximo movimento.</span>
                  </h2>
                  <p className="stepped-sub">
                    4 perguntas rápidas, sem letra miúda.
                  </p>
                </div>
                <div className="form-card">
                  <div className="form-top stepped-progress">
                    <div className="stepped-progress-row">
                      <span className="stepped-progress-label">
                        Etapa <b>{formStep}</b> de 2
                      </span>
                      <span className="stepped-progress-hint">
                        {formStep === 1 ? "Seus dados" : "Seu contexto"}
                      </span>
                    </div>
                    <div className="stepped-track">
                      <div
                        className="stepped-fill"
                        style={{ width: formStep === 1 ? "50%" : "100%" }}
                      />
                    </div>
                  </div>

                  {/* STEP 1 */}
                  {formStep === 1 && (
                    <div className="stepped-step">
                      <div className="form-grid">
                        <label>
                          Nome da Empresa
                          <input
                            value={form.companyName}
                            onChange={e =>
                              update("companyName", e.target.value)
                            }
                            placeholder="Sua empresa"
                          />
                        </label>
                        <label>
                          Seu nome
                          <input
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="Como podemos te chamar?"
                          />
                        </label>
                        <label>
                          WhatsApp
                          <input
                            type="tel"
                            value={form.whatsapp}
                            onChange={e => update("whatsapp", e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </label>
                        <label className="full-label">
                          Segmento
                          <select
                            value={form.segment}
                            onChange={e => update("segment", e.target.value)}
                          >
                            <option value="">Selecione o segmento</option>
                            <option>Beleza e estética</option>
                            <option>Imobiliário</option>
                            <option>Saúde</option>
                            <option>Varejo local</option>
                            <option>Outro</option>
                          </select>
                        </label>
                        <label className="full-label">
                          Você já anuncia hoje?
                          <select
                            value={form.ads}
                            onChange={e => update("ads", e.target.value)}
                          >
                            <option value="">Escolha uma opção</option>
                            <option>Sim, com agência ou gestor</option>
                            <option>Sim, faço por conta própria</option>
                            <option>Não, nunca anunciei</option>
                          </select>
                        </label>
                      </div>
                      <div className="stepped-actions">
                        <button
                          type="button"
                          className="primary-cta form-submit"
                          disabled={!canAdvance}
                          onClick={() => goToStep(2)}
                        >
                          Continuar <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {formStep === 2 && (
                    <div className="stepped-step">
                      <div className="chip-group">
                        <span className="chip-group-label">
                          Qual é hoje o maior problema com tráfego pago?
                        </span>
                        <div className="chips">
                          {painOptions.map(option => (
                            <button
                              key={option}
                              type="button"
                              className={`chip ${form.pain === option ? "selected" : ""}`}
                              onClick={() => update("pain", option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="chip-group">
                        <span className="chip-group-label">
                          O que você quer melhorar nos próximos 90 dias?
                        </span>
                        <div className="chips">
                          {goalOptions.map(option => (
                            <button
                              key={option}
                              type="button"
                              className={`chip ${form.goal === option ? "selected" : ""}`}
                              onClick={() => update("goal", option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      {submitError && (
                        <p className="form-error" role="alert">
                          {submitError}
                        </p>
                      )}
                      <div className="stepped-actions stepped-actions-split">
                        <button
                          type="button"
                          className="stepped-btn-ghost"
                          onClick={() => goToStep(1)}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          className="primary-cta form-submit"
                          disabled={!canSubmit || isSubmitting}
                          onClick={submitForm}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="spin" size={18} /> Enviando...
                            </>
                          ) : (
                            <>Quero meu diagnóstico →</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="privacy-note">
                    <LockKeyhole size={13} /> Seus dados ficam seguros e são
                    usados apenas para este contato.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
