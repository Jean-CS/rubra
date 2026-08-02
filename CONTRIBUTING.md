# Como contribuir

Rubra usa o GitHub como fluxo de contribuição e curadoria. Qualquer pessoa pode sugerir uma nova comunidade, uma instituição de ensino, um evento datado ou uma atualização. Nada entra automaticamente no site: toda mudança passa por revisão editorial.

## Sugerir dados

Abra uma Issue usando um dos formulários:

- [Indicar ou atualizar comunidade](https://github.com/Jean-CS/rubra/issues/new?template=indicar-comunidade.yml)
- [Indicar ou atualizar instituição de ensino](https://github.com/Jean-CS/rubra/issues/new?template=indicar-instituicao.yml)
- [Indicar ou corrigir evento](https://github.com/Jean-CS/rubra/issues/new?template=indicar-evento.yml)

Inclua links verificáveis quando houver e uma descrição curta. A curadoria pode ajustar texto, tags e categoria para manter o diretório consistente.

## Critérios de curadoria

Entradas devem ter relação clara com tecnologia em Londrina ou região metropolitana. Comunidades precisam ter algum sinal público de atividade, como eventos, grupo aberto, página pública ou organizadores identificáveis. Instituições precisam ter presença local ou atuação relevante para formação, pesquisa, extensão, carreira ou tecnologia. Eventos precisam ter data, organizador identificado e contexto suficiente para verificação.

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
status: Agendado
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

A curadoria pode ajustar título, descrição, tags, categoria e organizador antes de publicar. Para eventos, publique apenas quando houver informação suficiente para verificar a indicação.

## Revisar descobertas automáticas

O coletor diário nunca publica diretamente. Ele produz dois tipos de entrada para revisão:

1. Um PR na branch `automation/event-sync` quando o organizador já existe no Rubra e todos os campos obrigatórios estão disponíveis.
2. Uma Issue `descoberta-automatica` quando o organizador é desconhecido ou a descoberta está incompleta.

Ao revisar um PR automático:

- abra a URL pública e confira título, data, cidade, formato, organizador e status;
- rejeite eventos sem relação clara com tecnologia em Londrina;
- trate a descrição da Sympla como um resumo factual mínimo, não como texto promocional;
- não interprete ausência no catálogo como cancelamento;
- aceite mudança de status do Meetup somente quando o JSON-LD declarar adiamento ou cancelamento;
- confirme que `pnpm test` e `pnpm build` passaram.

Quando uma correção comunitária aprovada contradizer a plataforma, mantenha o valor corrigido e adicione o campo a `syncIgnore`:

```yaml
syncIgnore:
  - description
  - location
```

Valores permitidos são `title`, `date`, `endDate`, `time`, `location`, `format`, `organizerName`, `url`, `description`, `status` e `tags`. Eventos manuais continuam válidos sem `source`, e contribuições diretas por PR continuam bem-vindas.
