import type { StrategicAnalysis } from "./operation.js";

export interface LeadInput {
  companyName: string;
  name: string;
  whatsapp: string;
  email: string;
  segment: string;
  ads: string;
  pain: string;
  goal: string;
}

export interface StrategicBriefing {
  companyClient: string;
  filledBy: string;
  briefingDate: string;
  siteInstagram: string;
  companyDescription: string;
  currentChannels: string;
  productService: string;
  includedItems: string;
  productDifferentials: string;
  guarantees: string;
  priceTicket: string;
  paymentConditions: string;
  activeOffer: string;
  servedRegion: string;
  deliveryLogistics: string;
  salesChannels: string;
  customerService: string;
  brandPositioning: string;
  existingProof: string;
  availableMaterials: string;
  campaignObjective: string;
  availableBudget: string;
  seasonality: string;
  directCompetitors: string;
  restrictions: string;
}

export type LeadStatus =
  | "novo"
  | "contato"
  | "briefing"
  | "proposta"
  | "cliente"
  | "perdido";

export const leadStatusLabels: Record<LeadStatus, string> = {
  novo: "Novo",
  contato: "Em contato",
  briefing: "Briefing em andamento",
  proposta: "Proposta enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};

export const leadStatuses: LeadStatus[] = [
  "novo",
  "contato",
  "briefing",
  "proposta",
  "cliente",
  "perdido",
];

export interface Lead extends LeadInput {
  id: string;
  createdAt: number;
  status: LeadStatus;
  nextAction: string;
  nextActionAt?: string;
  briefing?: StrategicBriefing;
  briefingUpdatedAt?: number;
  strategicAnalysis?: StrategicAnalysis;
}

export const leadFieldLabels: Record<keyof LeadInput, string> = {
  companyName: "Nome da Empresa",
  name: "Nome",
  whatsapp: "WhatsApp",
  email: "E-mail",
  segment: "Segmento",
  ads: "Anúncios hoje",
  pain: "Maior problema",
  goal: "Objetivo para os próximos 90 dias",
};

export const leadInputKeys: Array<keyof LeadInput> = [
  "companyName",
  "name",
  "whatsapp",
  "email",
  "segment",
  "ads",
  "pain",
  "goal",
];

export interface BriefingFieldDefinition {
  key: keyof StrategicBriefing;
  label: string;
  helper: string;
  placeholder: string;
  type?: "text" | "date" | "url";
}

export interface BriefingSectionDefinition {
  number: string;
  title: string;
  fields: BriefingFieldDefinition[];
}

export const strategicBriefingSections: BriefingSectionDefinition[] = [
  {
    number: "01",
    title: "A empresa",
    fields: [
      {
        key: "companyDescription",
        label: "O que a empresa faz",
        helper: "Ramo, modelo de negócio e há quanto tempo está no mercado.",
        placeholder:
          "Descreva o negócio, o modelo de operação e o momento atual.",
      },
      {
        key: "currentChannels",
        label: "Canais que já usa hoje",
        helper:
          "Site, Instagram e outros canais onde a empresa já está presente.",
        placeholder: "Liste os canais ativos e como cada um é usado.",
      },
    ],
  },
  {
    number: "02",
    title: "Produto / serviço",
    fields: [
      {
        key: "productService",
        label: "O que é o produto ou serviço",
        helper:
          "Descreva em detalhes o que é e como funciona. Fuja do genérico.",
        placeholder: "O que é vendido, como funciona e para quem foi criado?",
      },
      {
        key: "includedItems",
        label: "O que está incluído",
        helper: "Tudo que o cliente leva ao comprar o pacote completo.",
        placeholder: "Entregas, bônus, suporte, etapas e itens incluídos.",
      },
      {
        key: "productDifferentials",
        label: "Diferenciais do produto / serviço",
        helper: "O que ele tem que o concorrente não tem. Seja específico.",
        placeholder:
          "Características, método, tecnologia, experiência ou prova de valor.",
      },
      {
        key: "guarantees",
        label: "Garantias",
        helper: "A empresa oferece alguma garantia? Qual?",
        placeholder: "Descreva prazo, condições e limites da garantia.",
      },
    ],
  },
  {
    number: "03",
    title: "Oferta e pagamento",
    fields: [
      {
        key: "priceTicket",
        label: "Preço e ticket médio",
        helper: "Faixa de preço dos produtos e valor médio de uma venda.",
        placeholder: "Faixa de preço, ticket médio e produtos prioritários.",
      },
      {
        key: "paymentConditions",
        label: "Formas e condições de pagamento",
        helper: "À vista, parcelado, desconto e formas aceitas.",
        placeholder: "Condições, parcelamento, descontos e meios de pagamento.",
      },
      {
        key: "activeOffer",
        label: "Oferta ou promoção ativa",
        helper: "Tem alguma oferta rodando agora? Qual e até quando?",
        placeholder: "Oferta, benefício, prazo de validade e regras.",
      },
    ],
  },
  {
    number: "04",
    title: "Entrega e atendimento",
    fields: [
      {
        key: "servedRegion",
        label: "Região atendida",
        helper: "Bairro, cidade, estado, Brasil todo ou e-commerce.",
        placeholder: "Onde a empresa atende e existem restrições geográficas?",
      },
      {
        key: "deliveryLogistics",
        label: "Prazo e logística de entrega",
        helper: "Quanto tempo leva e como a entrega é feita.",
        placeholder: "Prazos, etapas, frete, agenda ou logística envolvida.",
      },
      {
        key: "salesChannels",
        label: "Canais de venda",
        helper: "WhatsApp, site, loja física, marketplace e outros.",
        placeholder: "Onde a conversão acontece hoje e quem fecha a venda.",
      },
      {
        key: "customerService",
        label: "Como funciona o atendimento",
        helper:
          "Quem atende, horário de funcionamento e tempo médio de resposta.",
        placeholder: "Equipe, horários, processo e tempo de resposta.",
      },
    ],
  },
  {
    number: "05",
    title: "Marca e materiais",
    fields: [
      {
        key: "brandPositioning",
        label: "Diferenciais e posicionamento da marca",
        helper: "O que faz a marca ser lembrada, além do produto em si.",
        placeholder: "Como a marca quer ser percebida e por que é lembrada.",
      },
      {
        key: "existingProof",
        label: "Provas que já existem",
        helper: "Depoimentos, cases, números, mídia, prêmios e autoridade.",
        placeholder:
          "Liste provas, números, cases, reconhecimentos e depoimentos.",
      },
      {
        key: "availableMaterials",
        label: "Materiais disponíveis",
        helper: "Fotos, vídeos e criativos antigos que já deram resultado.",
        placeholder:
          "Links, pastas, formatos e materiais disponíveis para anúncios.",
      },
    ],
  },
  {
    number: "06",
    title: "Objetivo e limites",
    fields: [
      {
        key: "campaignObjective",
        label: "Objetivo da campanha",
        helper:
          "Venda, lead, agendamento, mensagem no WhatsApp, visita e outros.",
        placeholder:
          "Qual ação precisa acontecer e como o sucesso será percebido?",
      },
      {
        key: "availableBudget",
        label: "Verba disponível",
        helper: "Quanto por mês e quanto pode pagar por cliente (CAC alvo).",
        placeholder: "Investimento mensal, CAC alvo e limites de escala.",
      },
      {
        key: "seasonality",
        label: "Sazonalidade",
        helper: "Épocas mais fortes e mais fracas do negócio durante o ano.",
        placeholder: "Meses, datas ou momentos que alteram a demanda.",
      },
      {
        key: "directCompetitors",
        label: "Concorrentes diretos",
        helper: "Liste apenas os nomes e perfis. A análise vem depois.",
        placeholder: "Nomes, @perfis ou links dos concorrentes diretos.",
      },
      {
        key: "restrictions",
        label: "Restrições",
        helper: "O que não pode ser dito, questões legais ou nicho sensível.",
        placeholder:
          "Termos proibidos, limitações legais, compliance e cuidados.",
      },
    ],
  },
];

export const strategicBriefingGeneralFields: BriefingFieldDefinition[] = [
  {
    key: "companyClient",
    label: "Empresa / cliente",
    helper: "Nome comercial ou razão social que será usada no diagnóstico.",
    placeholder: "Nome da empresa ou do cliente",
  },
  {
    key: "filledBy",
    label: "Responsável pelo preenchimento",
    helper: "Quem está conduzindo a coleta do contexto.",
    placeholder: "Nome do responsável",
  },
  {
    key: "briefingDate",
    label: "Data",
    helper: "Data de preenchimento ou atualização do briefing.",
    placeholder: "dd/mm/aaaa",
    type: "date",
  },
  {
    key: "siteInstagram",
    label: "Site / Instagram",
    helper: "Links oficiais e perfis prioritários da empresa.",
    placeholder: "https:// ou @perfil",
    type: "text",
  },
];

export const strategicBriefingMaxLengths: Record<
  keyof StrategicBriefing,
  number
> = {
  companyClient: 160,
  filledBy: 160,
  briefingDate: 30,
  siteInstagram: 500,
  companyDescription: 2000,
  currentChannels: 1200,
  productService: 2200,
  includedItems: 1800,
  productDifferentials: 1800,
  guarantees: 1000,
  priceTicket: 800,
  paymentConditions: 1200,
  activeOffer: 1200,
  servedRegion: 1000,
  deliveryLogistics: 1400,
  salesChannels: 1200,
  customerService: 1400,
  brandPositioning: 1600,
  existingProof: 1800,
  availableMaterials: 1600,
  campaignObjective: 1200,
  availableBudget: 800,
  seasonality: 1000,
  directCompetitors: 1200,
  restrictions: 1400,
};
