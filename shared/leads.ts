export interface LeadInput {
  name: string;
  whatsapp: string;
  email: string;
  segment: string;
  ads: string;
  pain: string;
  goal: string;
}

export interface Lead extends LeadInput {
  id: string;
  createdAt: number;
}

export const leadFieldLabels: Record<keyof LeadInput, string> = {
  name: "Nome",
  whatsapp: "WhatsApp",
  email: "E-mail",
  segment: "Segmento",
  ads: "Anúncios hoje",
  pain: "Maior problema",
  goal: "Objetivo para os próximos 90 dias",
};

export const leadInputKeys: Array<keyof LeadInput> = [
  "name",
  "whatsapp",
  "email",
  "segment",
  "ads",
  "pain",
  "goal",
];
