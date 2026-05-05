# Como contribuir

Rubra usa o GitHub como fluxo de contribuição e curadoria. Qualquer pessoa pode sugerir uma nova comunidade, uma instituição de ensino, um evento datado ou uma atualização. Nada entra automaticamente no site: toda mudança passa por revisão editorial.

## Sugerir dados

Abra uma Issue usando um dos formulários:

- [Indicar ou atualizar comunidade](https://github.com/Jean-CS/rubra/issues/new?template=indicar-comunidade.yml)
- [Indicar ou atualizar instituição de ensino](https://github.com/Jean-CS/rubra/issues/new?template=indicar-instituicao.yml)
- [Indicar evento](https://github.com/Jean-CS/rubra/issues/new?template=indicar-evento.yml)

Inclua links verificáveis e uma descrição curta. A curadoria pode ajustar texto, tags e categoria para manter o diretório consistente.

## Critérios de curadoria

Entradas devem ter relação clara com tecnologia em Londrina ou região metropolitana. Comunidades precisam ter algum sinal público de atividade, como eventos, grupo aberto, página pública ou organizadores identificáveis. Instituições precisam ter presença local ou atuação relevante para formação, pesquisa, extensão, carreira ou tecnologia. Eventos precisam ter data, organizador identificado e link público para verificação.

Não aceitamos descrições puramente promocionais, dados sem fonte mínima, spam, conteúdo discriminatório ou iniciativas sem relação com o ecossistema local.

## Como os dados publicados funcionam

Os dados aprovados ficam em arquivos Markdown:

- `src/content/communities/*.md`
- `src/content/institutions/*.md`
- `src/content/events/*.md`

Cada arquivo tem campos no topo em YAML. O build valida esses campos antes de publicar o site.

Exemplo de comunidade:

```md
---
name: GDG Londrina
type: Developers
description: Comunidade local para pessoas que criam com web, cloud, mobile e práticas modernas de desenvolvimento.
cadence: Meetups e eventos
status: Ativa
accent: red
tags:
  - Web
  - Cloud
  - Android
---
```

Exemplo de instituição:

```md
---
name: UTFPR
website: https://www.utfpr.edu.br/campus/londrina
type: Universidade
description: Instituição federal com presença em engenharia, computação, pesquisa aplicada e formação tecnológica no norte do Paraná.
profile: Federal
accent: cyan
tags:
  - Federal
  - Pesquisa
  - Engenharia
---
```

Exemplo de evento:

```md
---
title: Meetup de IA em Londrina
date: 2026-06-15
time: 19h
location: Londrina, PR
format: Presencial
organizerName: IA Londrina
organizerType: Comunidade
url: https://example.com/evento
description: Encontro para pessoas interessadas em inteligência artificial aplicada, produtos e carreira.
tags:
  - IA
  - Meetup
  - Carreira
---
```

Para eventos com mais de um dia, adicione `endDate`. A home usa `date` como início e `endDate` como fim. Eventos futuros ou em andamento aparecem primeiro; eventos já encerrados aparecem no histórico. Eventos sem horário continuam válidos desde que tenham data.

## Publicar uma entrada aprovada

Depois de revisar uma Issue:

1. Crie ou atualize o arquivo Markdown correspondente.
2. Use nomes de arquivo em kebab-case, como `gdg-londrina.md`.
3. Rode `pnpm build`.
4. Faça merge apenas se o build passar.

Para preparar uma entrada sem publicar ainda, adicione `draft: true` ao frontmatter. Entradas em draft são validadas, mas não aparecem no site.

A curadoria pode ajustar título, descrição, tags, categoria e organizador antes de publicar. Para eventos, não publique indicações sem link público verificável.
