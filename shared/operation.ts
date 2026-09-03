import type { LeadStatus } from "./leads.js";

export interface FunnelStageSettings {
  id: LeadStatus;
  label: string;
  color: string;
  defaultNextAction: string;
  deadlineDays: number;
}

export interface OperationMessageSettings {
  newLead: string;
  briefingReady: string;
  proposalSent: string;
  followUp: string;
}

export interface OperationSettings {
  stages: FunnelStageSettings[];
  messages: OperationMessageSettings;
  defaultFollowUpDays: number;
  openRouterApiKey?: string;
}

export interface StrategicAnalysis {
  diagnosis: string;
  campaignAngles: Array<{
    title: string;
    rationale: string;
    hook: string;
    callToAction: string;
  }>;
  audienceHypotheses: string[];
  meetingQuestions: string[];
  risksAndGaps: string[];
  recommendedNextStep: string;
  generatedAt: number;
}

export const defaultOperationSettings: OperationSettings = {
  stages: [
    {
      id: "novo",
      label: "Novo",
      color: "#f6c85f",
      defaultNextAction: "Fazer primeiro contato",
      deadlineDays: 1,
    },
    {
      id: "contato",
      label: "Em contato",
      color: "#78dce8",
      defaultNextAction: "Agendar conversa",
      deadlineDays: 2,
    },
    {
      id: "briefing",
      label: "Briefing em andamento",
      color: "#cba6f7",
      defaultNextAction: "Concluir briefing",
      deadlineDays: 3,
    },
    {
      id: "proposta",
      label: "Proposta enviada",
      color: "#f38ba8",
      defaultNextAction: "Fazer follow-up da proposta",
      deadlineDays: 3,
    },
    {
      id: "cliente",
      label: "Cliente",
      color: "#a6e3a1",
      defaultNextAction: "Planejar onboarding",
      deadlineDays: 7,
    },
    {
      id: "perdido",
      label: "Perdido",
      color: "#9399b2",
      defaultNextAction: "Registrar motivo da perda",
      deadlineDays: 0,
    },
  ],
  messages: {
    newLead:
      "Olá, {{nome}}! Aqui é da BASE MÍDIA. Recebi seu diagnóstico e quero entender melhor o cenário para te mostrar o próximo passo.",
    briefingReady:
      "Olá, {{nome}}! Obrigado por compartilhar o contexto da {{empresa}}. Vou revisar o briefing e retorno com os próximos pontos.",
    proposalSent:
      "Olá, {{nome}}! Passando para saber se conseguiu revisar a proposta e se ficou alguma dúvida sobre o próximo passo.",
    followUp:
      "Olá, {{nome}}! Retomando nossa conversa sobre {{objetivo}}. Posso te ajudar a avançar com esse plano?",
  },
  defaultFollowUpDays: 2,
  openRouterApiKey: "",
};
