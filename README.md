# BASE MÍDIA

Landing page e central administrativa da BASE MÍDIA para receber, consultar e abrir briefings de diagnóstico de tráfego.

## Rotas

A página pública continua em `/`. O acesso administrativo começa em `/auth`, e a consulta protegida dos briefings fica em `/gestao`.

## Configuração de produção

A gestão usa funções serverless do Vercel e objetos privados no Vercel Blob. Antes do primeiro deploy com captura real de leads, crie um Blob Store privado no projeto Vercel e conecte-o aos ambientes Production e Preview. Depois, configure as seguintes variáveis no projeto:

| Variável                | Uso                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ADMIN_EMAIL`           | E-mail que terá acesso à área administrativa.                                                                                  |
| `ADMIN_PASSWORD`        | Senha da área administrativa; não deve ser publicada no código.                                                                |
| `AUTH_SECRET`           | Segredo aleatório usado para assinar o cookie de sessão. Use uma string longa e exclusiva. (`SESSION_SECRET` também é aceito.) |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob, caso o projeto use token de leitura e escrita.                                                           |
| `BLOB_STORE_ID`         | ID do Blob Store quando o projeto estiver conectado via OIDC do Vercel.                                                        |

O `.env.example` contém a lista sem valores reais. Nunca comite `.env`, `.env.local` ou qualquer credencial.

## Desenvolvimento

```bash
pnpm install
pnpm check
pnpm build
pnpm dev
```

O endpoint público do formulário é `POST /api/leads`. A listagem administrativa usa `GET /api/leads` e exige o cookie de sessão emitido por `POST /api/auth`. O formulário interno salva o documento vinculado com `POST /api/leads` usando `{ action: "save-briefing", leadId, briefing }`. O login e o logout usam `POST /api/auth` e `DELETE /api/auth`.

Sem o Vercel Blob configurado, a interface continua disponível, mas o envio responde com erro de configuração em vez de fingir que o briefing foi salvo. Essa decisão evita perder dados silenciosamente.

## Operação comercial

A central de gestão agora organiza os leads por etapas de pipeline: Novo, Em contato, Briefing em andamento, Proposta enviada, Cliente e Perdido. Cada lead pode receber uma próxima ação e uma data de acompanhamento; essas informações são salvas no mesmo objeto privado do Blob.

O briefing estratégico conta com autosave após alterações, além do salvamento manual. A ação `Exportar PDF` usa a folha de impressão da própria identidade visual da BASE MÍDIA para gerar o documento pelo diálogo de impressão do navegador. O botão de WhatsApp abre a conversa com uma mensagem inicial contextualizada pelo nome e objetivo do lead.

## Integração com Bolten.io

O formulário público pode sincronizar cada novo lead com o CRM Bolten.io como uma oportunidade no funil. A integração é opcional e é ativada quando `BOLTEN_API_KEY` e `BOLTEN_PROJECT_ID` estão configuradas no ambiente de produção do Vercel. A chave deve ser criada na área de API Keys da Bolten e cadastrada diretamente no Vercel; ela nunca deve ser colocada no código ou enviada pelo navegador.

A sincronização usa o endpoint oficial de oportunidades da API REST da Bolten, com autenticação `Bearer`. O lead é salvo primeiro no armazenamento privado da BASE MÍDIA. Se a Bolten estiver indisponível, responder com erro ou ainda não estiver configurada, o cadastro local continua concluído e o problema fica registrado nos logs do servidor, evitando perda do lead ou falha para o usuário.

Depois de configurar as variáveis, é necessário publicar um novo deployment para que o runtime carregue os valores. A automação de WhatsApp deve ser configurada dentro do projeto Bolten, usando a oportunidade/contato criado pela API e o fluxo ou template aprovado no CRM.

## Configurações da operação

A rota protegida `/configuracoes` permite editar os nomes das etapas do funil, a próxima ação padrão, o prazo de cada etapa, o prazo padrão de follow-up e as mensagens operacionais. Os textos aceitam os marcadores `{{nome}}`, `{{empresa}}` e `{{objetivo}}`. As configurações ficam salvas em um objeto privado do Vercel Blob e, quando a tela de gestão é aberta, os rótulos e prazos configurados são aplicados ao pipeline.

## Análise estratégica por IA

Dentro do detalhe de um lead, depois que o briefing estiver salvo, a ação `Gerar análise estratégica` cria um diagnóstico com ângulos de campanha, hipóteses de público, perguntas para reunião, lacunas/riscos e próximo passo recomendado. A resposta é gerada server-side em `/api/analysis`, com JSON estruturado, e fica salva no mesmo registro privado do lead. O provedor é a OpenRouter e o modelo padrão é `openrouter/free`, que escolhe automaticamente um modelo gratuito disponível. A análise fica ativa quando `OPENROUTER_API_KEY` está configurada no Vercel; o modelo pode ser substituído por uma variante gratuita específica com `OPENROUTER_MODEL`.

Para ativar, crie uma chave em [OpenRouter Keys](https://openrouter.ai/keys) e adicione `OPENROUTER_API_KEY` no ambiente Production do Vercel. Opcionalmente, defina `OPENROUTER_SITE_URL` para identificar a aplicação e mantenha `OPENROUTER_API_BASE_URL` como `https://openrouter.ai/api/v1`. A modalidade gratuita pode ter limites de requisição, maior latência e disponibilidade variável; se a OpenRouter estiver indisponível, o sistema mostra uma mensagem de erro sem perder o briefing.

## Exclusão de leads duplicados

No detalhe de cada lead existe a ação `Excluir duplicado`. O sistema exige uma segunda confirmação e remove o registro e o briefing vinculado do armazenamento privado. Essa ação é protegida pela mesma autenticação administrativa e não é disponibilizada no formulário público.
