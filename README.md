# Rubra

![Astro](https://img.shields.io/badge/Astro-6-FF5D01?style=flat-square&logo=astro&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-ready-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Node](https://img.shields.io/badge/Node-%3E%3D22.12-339933?style=flat-square&logo=nodedotjs&logoColor=white)

A porta de entrada para a cena tech de Londrina.

Rubra é um hub estático que mapeia comunidades, instituições de ensino, eventos e iniciativas de tecnologia em Londrina e região. O nome homenageia a terra roxa, a memória avermelhada do café e o orgulho pé vermelho da cidade.

O projeto existe para reduzir links perdidos, grupos fechados e descobertas por acaso. A ideia é manter um mapa público, bonito e confiável do que já está acontecendo no ecossistema local.

## O que tem no Rubra

- Diretório de comunidades de tecnologia de Londrina e região.
- Mapa de instituições de ensino ligadas à formação, pesquisa, extensão, carreira e eventos.
- Agenda com próximos eventos publicados.
- Histórico de eventos já realizados.
- Fluxo aberto de indicação via GitHub Issues, com curadoria antes da publicação.

## Como contribuir

As informações publicadas no site vivem neste repositório e passam por revisão editorial. Qualquer pessoa pode sugerir uma nova entrada ou pedir atualização de dados existentes.

Abra uma issue usando o formulário certo:

| Tipo de indicação | Link |
| --- | --- |
| Comunidade | [Indicar ou atualizar comunidade](https://github.com/Jean-CS/rubra/issues/new?template=indicar-comunidade.yml) |
| Instituição de ensino | [Indicar ou atualizar instituição](https://github.com/Jean-CS/rubra/issues/new?template=indicar-instituicao.yml) |
| Evento | [Indicar evento](https://github.com/Jean-CS/rubra/issues/new?template=indicar-evento.yml) |

Inclua links verificáveis sempre que possível. A curadoria pode ajustar descrição, categoria, tags e outros campos para manter o diretório consistente.

Para detalhes do processo, leia [CONTRIBUTING.md](CONTRIBUTING.md).

## Dados publicados

O conteúdo do Rubra é mantido em Markdown com frontmatter validado por Astro Content Collections.

```txt
src/content/
├── communities/
├── events/
└── institutions/
```

Cada coleção tem campos obrigatórios definidos em [src/content.config.ts](src/content.config.ts). O build falha se algum arquivo publicado estiver incompleto ou fora do formato esperado.

Para preparar uma entrada sem exibir no site, use:

```yaml
draft: true
```

## Desenvolvimento

Requisitos:

- Node.js 22.12 ou superior
- pnpm

Instale as dependências e inicie o servidor local:

```sh
pnpm install
pnpm dev
```

Por padrão, o Astro sobe em `http://localhost:4321`.

## Comandos

| Comando | Ação |
| --- | --- |
| `pnpm install` | Instala as dependências |
| `pnpm dev` | Inicia o servidor de desenvolvimento |
| `pnpm build` | Gera o site de produção em `dist/` |
| `pnpm preview` | Pré-visualiza o build localmente |
| `pnpm astro` | Executa comandos da CLI do Astro |

## Estrutura do projeto

```txt
.
├── src/
│   ├── content/          # Comunidades, instituições e eventos
│   ├── layouts/          # Layout base do site
│   └── pages/            # Home e página de eventos
├── public/               # Assets públicos
├── BRAND.md              # Direção de marca e tom de voz
├── CONTRIBUTING.md       # Fluxo de contribuição e curadoria
└── README.md
```

## Curadoria

Rubra é aberto para contribuições, mas não publica tudo automaticamente. Entradas precisam ter relação clara com tecnologia em Londrina ou região metropolitana, além de contexto mínimo para verificação.

Não entram no site: spam, descrições puramente promocionais, dados sem fonte mínima, conteúdo discriminatório ou iniciativas sem relação com o ecossistema local.

## Repositório

GitHub: [`Jean-CS/rubra`](https://github.com/Jean-CS/rubra)
