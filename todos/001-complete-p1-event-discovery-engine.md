---
status: complete
priority: p1
issue_id: "001"
tags: [events, scraping, github-actions, content]
dependencies: []
---

# Implementar motor de descoberta pública de eventos

Construir a coleta de baixo volume de eventos públicos da Sympla e do Meetup, preservando a revisão humana e o conteúdo editorial mantido no GitHub.

## Problem Statement

Os eventos do Rubra são cadastrados manualmente, o que deixa a agenda incompleta ou desatualizada. As alternativas baseadas em Google Events, tokens individuais e calendários públicos não cobrem adequadamente as comunidades locais.

## Findings

- O Rubra é um site Astro estático, com eventos em Markdown e deploy automático pela Vercel.
- Os catálogos públicos da Sympla expõem dados estruturados no estado serializado do HTML; páginas individuais podem ser desviadas para Queue-it.
- O Meetup expõe grupos na busca pública e eventos em JSON-LD nas páginas públicas dos grupos.
- O repositório não possui banco, suíte de testes ou job periódico; GitHub Actions é compatível com a arquitetura existente.

## Proposed Solutions

### Option 1: Coleta pública e PR editorial

**Approach:** Adaptadores HTTP TypeScript coletam HTML público, normalizam os dados e propõem alterações por PR ou Issue.

**Pros:** Mantém GitHub como fonte da verdade, não exige tokens de organizadores e preserva revisão humana.

**Cons:** Parsers precisam de manutenção quando as plataformas mudarem o HTML.

**Effort:** Médio

**Risk:** Médio

### Option 2: Cadastro exclusivamente comunitário

**Approach:** Melhorar apenas formulários e links de correção.

**Pros:** Simples e sem dependência de plataformas externas.

**Cons:** Não resolve a descoberta e atualização automática.

**Effort:** Baixo

**Risk:** Baixo

### Option 3: Banco e painel administrativo

**Approach:** Migrar eventos para um serviço persistente com sincronização e moderação.

**Pros:** Fluxos editoriais mais sofisticados.

**Cons:** Amplia muito a infraestrutura e contraria a arquitetura atual.

**Effort:** Alto

**Risk:** Alto

## Recommended Action

Implementar a Option 1 com adaptadores independentes para Sympla e Meetup, cliente HTTP defensivo, fixtures sanitizadas, reconciliação idempotente de Markdown e GitHub Actions diário. Complementar com a Option 2 para correções comunitárias.

## Technical Details

**Affected areas:**
- `scripts/events/` para coleta, normalização, reconciliação e Issues.
- `src/content.config.ts` e `src/content/events/` para metadados de sincronização.
- `src/pages/` e `.github/ISSUE_TEMPLATE/` para correções comunitárias.
- `.github/workflows/` para execução diária e PR contínuo.
- `tests/fixtures/` e `tests/events/` para testes offline.

**Database changes:** Nenhuma; Markdown continua sendo a fonte da verdade.

## Resources

- [Sympla — eventos de tecnologia em Londrina](https://www.sympla.com.br/eventos/londrina-pr/tecnologia)
- [Meetup — grupos em Londrina](https://www.meetup.com/find/br--londrina/)
- [GitHub Actions — eventos agendados](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

## Acceptance Criteria

- [x] Adaptadores TypeScript `sympla` e `meetup` implementam uma interface comum.
- [x] Coleta usa user-agent identificável, timeout, duas tentativas e limite de requisições.
- [x] Bloqueios 403/429, captcha, Queue-it e Cloudflare encerram a fonte sem bypass.
- [x] Sympla extrai e deduplica os eventos serializados das três categorias públicas.
- [x] Meetup descobre grupos tech, usa lista versionada e rejeita eventos fora de Londrina.
- [x] Modelo aceita `status`, `source` opcional e `syncIgnore`.
- [x] Reconciliação é idempotente, não remove históricos e respeita correções protegidas.
- [x] Organizadores reconhecidos geram Markdown; descobertas incertas geram candidatos a Issue.
- [x] Workflow diário testa, sincroniza, faz build e atualiza um único PR.
- [x] Formulário e cards permitem indicar novos eventos e corrigir existentes.
- [x] Fixtures cobrem duração, formatos, status, duplicação, payload incompleto e bloqueios.
- [x] `pnpm test` e `pnpm build` passam.
- [x] Documentação operacional e limites de cobertura estão registrados.

## Work Log

### 2026-08-01 - Investigação e início

**By:** Codex

**Actions:**
- Atualizou `main` por fast-forward e criou a branch `jean/event-discovery`.
- Confirmou a arquitetura Astro/Markdown/Vercel e os formatos públicos disponíveis nas duas fontes.
- Validou os limites de acesso: sem páginas autenticadas, APIs internas ou bypass de proteções.

**Learnings:**
- O estado serializado do catálogo da Sympla é suficiente para o v1.
- O filtro por município no Meetup é obrigatório para grupos regionais.

### 2026-08-01 - Implementação concluída

**By:** Codex

**Actions:**
- Implementou cliente HTTP defensivo, verificação de `robots.txt`, adaptadores e normalização comum.
- Implementou reconciliação idempotente, proteção de conteúdo editorial, candidatos e publicação deduplicada de Issues.
- Adicionou workflow diário, schema, formulário, links de correção, status e documentação operacional.
- Validou com `pnpm check`, 16 testes offline, `pnpm events:sync`, `pnpm build` e `git diff --check`.

**Learnings:**
- A Sympla injeta cidades vizinhas até nas URLs de Londrina, portanto o filtro explícito de município é necessário nas duas fontes.
- A coleta real encontrou 18 eventos locais: 4 classificados pela coleção de tecnologia e 14 mantidos como incertos para triagem.
- Nenhum organizador das descobertas atuais corresponde exatamente ao cadastro do Rubra, então a execução real preservou o conteúdo e preparou apenas candidatos.

## Notes

- A revisão humana permanece obrigatória antes da publicação.
- Ausência em catálogo nunca implica remoção ou cancelamento.
- Redes sociais ficam fora do v1.
