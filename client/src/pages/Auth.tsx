import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import officialLogo from "../assets/base-midia-logo.svg";

interface AuthResponse {
  configured?: boolean;
  authenticated?: boolean;
  user?: { email: string } | null;
  error?: string;
}

export default function Auth() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth", { credentials: "same-origin" })
      .then(async response => ({
        response,
        body: (await response.json()) as AuthResponse,
      }))
      .then(({ body }) => {
        if (!active) return;
        if (body.authenticated) navigate("/gestao");
        if (body.configured === false)
          setError(
            "A área restrita ainda precisa ser configurada no ambiente de produção."
          );
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível verificar a sessão agora. Tente novamente."
          );
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(body.error ?? "Não foi possível entrar. Confira seus dados.");
        return;
      }
      navigate("/gestao");
    } catch {
      setError("Não foi possível conectar ao ambiente agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <a href="/" aria-label="Voltar para a página inicial">
          <img src={officialLogo} alt="BASE MÍDIA" className="brand-logo" />
        </a>
        <span>ÁREA RESTRITA / BASE MÍDIA</span>
      </header>

      <div className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">
            <span className="status-dot" /> CENTRO DE OPERAÇÕES
          </div>
          <h1>
            Leads claros.
            <br />
            <em>Próximo passo visível.</em>
          </h1>
          <p>
            Entre para acompanhar os cenários enviados pelo formulário de
            diagnóstico e abrir cada briefing completo em um só lugar.
          </p>
          <div className="auth-story-grid">
            <div>
              <strong>01</strong>
              <span>receba o contexto</span>
            </div>
            <div>
              <strong>02</strong>
              <span>leia o gargalo</span>
            </div>
            <div>
              <strong>03</strong>
              <span>mova a conversa</span>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-head">
            <div className="auth-icon">
              <KeyRound size={21} />
            </div>
            <div>
              <span className="section-index">/ LOGIN_ADMIN</span>
              <h2 id="auth-title">Acesso à gestão</h2>
            </div>
          </div>
          <p className="auth-card-copy">
            Use as credenciais administrativas configuradas para o projeto.
          </p>

          {checkingSession ? (
            <div className="auth-loading">
              <Loader2 className="spin" size={18} /> Verificando sessão...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                E-mail administrativo
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="equipe@empresa.com"
                  required
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </label>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="primary-cta"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="spin" size={17} /> Entrando...
                  </>
                ) : (
                  <>
                    Entrar na gestão <ArrowUpRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-trust">
            <ShieldCheck size={16} />
            <span>
              Sessão protegida por cookie HttpOnly e dados armazenados em
              ambiente privado.
            </span>
          </div>
          <a className="auth-back" href="/">
            <ArrowLeft size={14} /> Voltar para a página pública
          </a>
        </section>
      </div>

      <footer className="auth-footer">
        <span>
          <LockKeyhole size={13} /> SOMENTE EQUIPE AUTORIZADA
        </span>
        <span>© 2026 BASE MÍDIA</span>
      </footer>
    </main>
  );
}
