// Design: Dark Performance Lab — fallback responsivo com diagnóstico visual e retorno direto para a ação principal.
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="not-found-page">
      <div className="not-found-grid" />
      <div className="not-found-card">
        <div className="not-found-mark">
          <AlertCircle size={26} />
        </div>
        <div className="section-index">/ ERROR_404</div>
        <h1>
          Esta rota saiu
          <br />
          <span>do radar.</span>
        </h1>
        <p>
          A página que você tentou acessar não existe ou foi movida. Volte para
          a base e continue sua leitura.
        </p>
        <button className="primary-cta" onClick={() => setLocation("/")}>
          Voltar para a BASE <ArrowUpRight size={17} />
        </button>
      </div>
    </main>
  );
}
