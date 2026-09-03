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

## Briefing estratégico por lead

- [x] Replicar no sistema as seis seções e os campos do PDF briefing.
- [x] Pré-preencher empresa, responsável e data a partir do lead selecionado.
- [x] Permitir abrir o formulário pela ação `Gerar briefing` dentro do lead.
- [x] Salvar e atualizar o documento no mesmo registro privado do lead.
- [x] Exibir na lista se o briefing está pendente ou preenchido.
- [x] Fazer `Iniciar conversa` abrir diretamente o WhatsApp.
- [x] Disponibilizar o PDF modelo em `client/public/briefing-modelo.pdf`.

## Integração Bolten.io

- [x] Criar adaptador server-side para API REST da Bolten.
- [x] Sincronizar cada novo lead como oportunidade quando as variáveis estiverem configuradas.
- [x] Manter o cadastro local funcionando se a Bolten estiver indisponível ou sem configuração.
- [x] Documentar `BOLTEN_API_KEY`, `BOLTEN_PROJECT_ID` e `BOLTEN_API_BASE_URL`.
- [ ] Configurar a API Key e o Project ID da Bolten no Vercel.
- [ ] Ativar no CRM Bolten a automação/template de WhatsApp para a nova oportunidade.

## Próxima evolução operacional

- [x] Criar a tela protegida `/configuracoes` para etapas, mensagens e prazos.
- [x] Aplicar rótulos, ações padrão, prazos e mensagens configurados na gestão.
- [x] Gerar análise estratégica por IA a partir do briefing salvo.
- [x] Salvar a análise estratégica no lead e exibir diagnóstico, ângulos, público, perguntas e riscos.
- [x] Adicionar confirmação para excluir lead duplicado e briefing vinculado.
- [ ] Configurar as credenciais integradas de IA no ambiente de produção, se ainda não estiverem disponíveis.
