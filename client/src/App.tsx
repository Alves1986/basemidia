// Design: Dark Performance Lab — a rota pública é uma landing page única, escura e orientada a diagnóstico.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Gestao from "./pages/Gestao";
import Configuracoes from "./pages/Configuracoes";
import ClientBriefing from "./pages/ClientBriefing";
import ClientContract from "./pages/ClientContract";

import GoogleTracking from "./components/GoogleTracking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/gestao" component={Gestao} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/briefing/:leadId" component={ClientBriefing} />
      <Route path="/contrato/:leadId" component={ClientContract} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <GoogleTracking />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
