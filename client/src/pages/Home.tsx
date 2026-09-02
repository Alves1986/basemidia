// Design: Dark Performance Lab — neo-brutalist digital, assimetria editorial, verde ácido como sinal de ação e prova.
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Check, ChevronDown, CircleCheck, Clock3, Crosshair, Gauge, LineChart, LockKeyhole, Menu, MoveUpRight, ShieldCheck, Sparkles, Target, X } from "lucide-react";

const heroDashboard = "/manus-storage/base-midia-hero-dashboard_b6a66915.png";
const signalDetail = "/manus-storage/base-midia-signal-detail_3b2b23b3.png";
const officialLogo = "/manus-storage/base-midia-logo-compact_988a8739.png";

const painPoints = [
  "Você investe em anúncios e não sabe exatamente onde está o problema?",
  "Seu tráfego gera clique, mas não gera lead qualificado?",
  "O anúncio roda, mas o comercial não sente diferença?",
];

const steps = [
  { number: "01", title: "Você conta o cenário", copy: "Um formulário curto revela canal, momento e o gargalo que mais pesa hoje." },
  { number: "02", title: "A gente faz a triagem", copy: "Organizamos sua dor em hipóteses objetivas, sem diagnóstico genérico." },
  { number: "03", title: "Marcamos o próximo movimento", copy: "Se fizer sentido, você agenda uma conversa gratuita para entender as prioridades." },
];

const faqs = [
  ["O diagnóstico é realmente gratuito?", "Sim. A primeira conversa é uma análise inicial sem custo e sem compromisso de contratação."],
  ["Serve para quem ainda não anuncia?", "Serve. Entender a base antes de investir é justamente uma das formas mais seguras de começar."],
  ["Vocês atendem empresas locais?", "Sim. A BASE MÍDIA trabalha com negócios locais e empresas que precisam transformar mídia em demanda real."],
  ["Preciso ter site ou Instagram ativo?", "Não para preencher o formulário. O diagnóstico serve também para apontar quais bases precisam ser fortalecidas."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", segment: "", ads: "", pain: "", goal: "" });

  const scrollToForm = () => document.getElementById("diagnostico")?.scrollIntoView({ behavior: "smooth" });
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="BASE MÍDIA início">
          <img src={officialLogo} alt="BASE MÍDIA" className="brand-logo" />
        </a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <a href="#metodo" onClick={() => setMenuOpen(false)}>Como funciona</a>
          <a href="#diagnostico" onClick={() => setMenuOpen(false)}>Diagnóstico</a>
          <button className="nav-cta" onClick={scrollToForm}>Agendar conversa <ArrowUpRight size={15} /></button>
        </div>
        <button className="menu-toggle" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </nav>
      <aside className="progress-rail" aria-label="Etapas do diagnóstico">
        <a href="#top"><span>00</span><i /><b>INÍCIO</b></a>
        <a href="#dor"><span>01</span><i /><b>DOR</b></a>
        <a href="#metodo"><span>02</span><i /><b>MÉTODO</b></a>
        <a href="#diagnostico"><span>03</span><i /><b>AÇÃO</b></a>
      </aside>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> GESTÃO DE TRÁFEGO COM BASE</div>
          <h1>Antes de apertar o botão<span className="acid">,</span><br /><em>encontre o gargalo.</em></h1>
          <p className="hero-lede">Gestão de tráfego com planejamento antes da execução. Receba um diagnóstico gratuito para entender onde seu tráfego está travando e o que precisa ser ajustado para gerar mais resultado.</p>
          <div className="hero-actions">
            <button className="primary-cta" onClick={scrollToForm}>Quero meu diagnóstico gratuito <ArrowUpRight size={18} /></button>
            <a className="text-cta" href="#dor">Entender minha dor primeiro <ArrowDownRight size={16} /></a>
          </div>
          <div className="trust-row"><ShieldCheck size={15} /><span>Sem compromisso</span><i /> <Clock3 size={15} /><span>Resposta em até 1 dia útil</span></div>
        </div>
        <div className="hero-visual">
          <div className="visual-label label-top">PAINEL DE CONTROLE <span>LIVE</span></div>
          <div className="dashboard-frame">
            <img src={heroDashboard} alt="Visualização abstrata de um dashboard de performance" />
            <div className="dashboard-overlay">
              <div className="metric-card"><span>ÍNDICE DE CLAREZA</span><strong>82.4<small>%</small></strong><b><ArrowUpRight size={13} /> +18.6%</b></div>
              <div className="metric-card metric-dark"><span>PRÓXIMO GARGALO</span><strong>CONVERSÃO</strong><div className="mini-bars"><i /><i /><i /><i /><i /></div></div>
            </div>
          </div>
          <div className="visual-label label-bottom"><span className="mono-accent">03</span> sinais para uma decisão melhor</div>
        </div>
        <div className="hero-side-note"><span>01</span><span>PLANEJAR</span><span>02</span><span>MEDIR</span><span>03</span><span>OTIMIZAR</span></div>
      </section>

      <section id="dor" className="pain-section section-pad">
        <div className="section-index">/ 01 — RECONHECIMENTO</div>
        <div className="pain-layout">
          <div className="section-heading"><div className="readout"><span>FINDING_01</span><b>CLAREZA ABAIXO DO INVESTIMENTO</b></div><h2>Seu tráfego não precisa de mais <span>achismo.</span></h2><p>Quando o investimento cresce e a clareza não acompanha, o problema raramente está em apenas um botão.</p></div>
          <div className="pain-list">{painPoints.map((pain, index) => <div className="pain-item" key={pain}><span>0{index + 1}</span><p>{pain}</p><ArrowUpRight size={19} /></div>)}</div>
        </div>
        <div className="statement-strip"><span className="quote-mark">“</span><p>Planejamento não é uma etapa burocrática.<br /><strong>É onde o resultado começa.</strong></p><div className="strip-line" /></div>
      </section>

      <section id="metodo" className="method-section section-pad">
        <div className="section-index">/ 02 — MÉTODO</div>
        <div className="method-intro"><div><div className="readout"><span>METHOD_TRACE / 03 NÓS</span><b>FLUXO DE DECISÃO</b></div><h2>Clareza primeiro.<br /><span>Execução depois.</span></h2></div><p>Um processo simples para tirar o ruído da frente e colocar a decisão certa no centro.</p></div>
        <div className="steps-list">{steps.map((step) => <div className="step-row" key={step.number}><span className="step-number">{step.number}</span><div className="step-icon"><Target size={21} /></div><div className="step-content"><h3>{step.title}</h3><p>{step.copy}</p></div><MoveUpRight className="step-arrow" size={21} /></div>)}</div>
      </section>

      <section className="proof-section section-pad">
        <div className="proof-image"><img src={signalDetail} alt="Linha de sinal representando análise de performance" /><div className="image-caption">SINAL / LEITURA / DECISÃO</div></div>
        <div className="proof-copy"><div className="section-index">/ 03 — CREDIBILIDADE</div><h2>Mídia sem leitura é só <span>custo.</span></h2><p>A BASE MÍDIA existe para conectar planejamento, análise e otimização em um sistema que o seu comercial consegue sentir.</p><div className="proof-grid"><div><strong>3<span>×</span></strong><small>camadas de<br />análise</small></div><div><strong>90</strong><small>dias para uma<br />visão de evolução</small></div><div><strong>1</strong><small>próximo movimento<br />por vez</small></div></div><button className="outline-cta" onClick={scrollToForm}>Ver se faz sentido para mim <ArrowUpRight size={17} /></button></div>
      </section>

      <section id="diagnostico" className="form-section section-pad">
        <div className="form-intro"><div className="section-index">/ 04 — DIAGNÓSTICO GRATUITO</div><div className="signal-readout"><span>INTAKE STATUS</span><b>READY TO ANALYZE</b><i><em /><em /><em /><em /><em /></i></div><h2>Conte o cenário.<br /><span>A gente organiza o próximo movimento.</span></h2><p>Preencha em menos de 2 minutos. As respostas ajudam a tornar a conversa mais objetiva desde o primeiro contato.</p><div className="form-benefits"><div><CircleCheck size={18} /><span>Sem pitch genérico</span></div><div><CircleCheck size={18} /><span>Leitura do seu contexto</span></div><div><CircleCheck size={18} /><span>Próximos passos claros</span></div></div></div>
          <div className="form-card">{submitted ? <div className="success-state"><div className="success-icon"><Check size={28} /></div><div className="section-index">/ RECEBIDO</div><h3>Seu cenário chegou até a gente.</h3><p>Vamos analisar suas respostas e entrar em contato em até 1 dia útil para combinar o próximo passo.</p><button className="primary-cta" onClick={() => setSubmitted(false)}>Enviar outra resposta <ArrowUpRight size={17} /></button></div> : <form onSubmit={submit}><div className="form-top"><span>01 / 01</span><span className="progress-label">FORMULÁRIO RÁPIDO</span><div className="progress-bar"><i /></div></div><div className="form-grid"><label>Seu nome<input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Como podemos te chamar?" /></label><label>WhatsApp<input required type="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(00) 00000-0000" /></label><label>E-mail<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="voce@empresa.com" /></label><label>Segmento<select required value={form.segment} onChange={(e) => update("segment", e.target.value)}><option value="">Selecione o segmento</option><option>Negócio local</option><option>E-commerce</option><option>Serviços B2B</option><option>Outro</option></select></label><label>Você já anuncia hoje?<select required value={form.ads} onChange={(e) => update("ads", e.target.value)}><option value="">Escolha uma opção</option><option>Sim, mas sem estratégia clara</option><option>Sim, com frequência</option><option>Ainda não anuncio</option></select></label><label className="full-label">Qual é hoje o maior problema que você quer resolver com tráfego pago?<textarea required value={form.pain} onChange={(e) => update("pain", e.target.value)} placeholder="Ex.: tenho cliques, mas poucos contatos que avançam..." /></label><label className="full-label">O que você quer melhorar nos próximos 90 dias?<input required value={form.goal} onChange={(e) => update("goal", e.target.value)} placeholder="Ex.: gerar demanda com mais previsibilidade" /></label></div><button type="submit" className="primary-cta form-submit">Quero meu diagnóstico gratuito <ArrowUpRight size={18} /></button><p className="privacy-note"><LockKeyhole size={13} /> Seus dados ficam seguros e serão usados apenas para este contato.</p></form>}</div>
      </section>

      <section className="faq-section section-pad"><div className="section-index">/ 05 — DÚVIDAS FREQUENTES</div><div className="faq-layout"><h2>Antes de decidir,<br /><span>tire o ruído.</span></h2><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="final-cta"><div className="final-grid" /><div className="section-index">/ PRÓXIMO MOVIMENTO</div><h2>Pronto para entender o que está<br /><span>travando seus anúncios?</span></h2><button className="primary-cta" onClick={scrollToForm}>Agendar diagnóstico gratuito <ArrowUpRight size={18} /></button><p><Clock3 size={14} /> Resposta em até 1 dia útil</p></section>

      <footer className="footer"><div className="footer-brand"><img src={officialLogo} alt="BASE MÍDIA" className="brand-logo footer-logo" /><p>Planejamento antes da execução.</p></div><div className="footer-contact"><span>FALE COM A BASE</span><a href="mailto:contato@basemidia.com.br">contato@basemidia.com.br</a></div><div className="footer-meta"><span>© 2026 BASE MÍDIA</span><span>Privacidade & dados</span></div></footer>
    </main>
  );
}
