# Revisão de interação e responsividade

- [x] Esconder o formulário da página inicial e abrir somente por ação explícita nos CTAs.
- [x] Implementar modal flutuante responsivo com fechamento por botão, clique externo e tecla Esc.
- [x] Garantir foco, rolagem e acessibilidade adequados durante a abertura do modal.
- [x] Ajustar grids, tipografia, imagens e espaçamentos para desktop, tablet e mobile.
- [x] Validar a landing page e o modal em múltiplos viewports.
- [x] Rodar checagem de tipos/build e salvar nova versão.

## Área administrativa

- [x] Criar rota `/auth` com login por e-mail e senha configuráveis por ambiente.
- [x] Criar sessão com cookie HttpOnly assinado e logout.
- [x] Criar rota protegida `/gestao` com resumo, busca e lista de leads.
- [x] Permitir abrir o briefing completo, e-mail e WhatsApp de cada lead.
- [x] Conectar o formulário público ao endpoint `POST /api/leads`.
- [x] Persistir cada briefing em objeto privado do Vercel Blob.
- [x] Adicionar documentação de deploy e variáveis em `.env.example` e `README.md`.
- [ ] Criar/conectar o Blob Store e cadastrar `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `SESSION_SECRET` no projeto Vercel.
