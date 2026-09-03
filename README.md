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
