# Rubra

![Astro](https://img.shields.io/badge/Astro-6-FF5D01?style=flat-square&logo=astro&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-ready-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Node](https://img.shields.io/badge/Node-%3E%3D22.12-339933?style=flat-square&logo=nodedotjs&logoColor=white)

A porta de entrada para a cena tech de Londrina.

Rubra existe para tornar visível a cena tech de Londrina e região: comunidades, encontros, instituições, iniciativas e oportunidades que muitas pessoas só descobrem por acaso.

A visão é simples: ajudar mais gente a participar, criar rede, desenvolver habilidades, colaborar, pedir ajuda e se inspirar. Londrina já tem escala, talento e formação em tecnologia. Rubra quer ajudar a cidade a transformar isso em vida comunitária mais forte.

Hoje, o projeto começa como um hub estático e curado para mapear comunidades, instituições de ensino e eventos. O nome homenageia a terra roxa, a memória avermelhada do café e o orgulho pé vermelho da cidade.

## Por que existe

Muita gente em Londrina quer aprender, participar, conhecer pessoas e crescer na tecnologia, mas ainda descobre comunidades por acaso. Em eventos do GDG Londrina, comunidade ativa desde 2023, ainda aparecem estudantes ouvindo falar do grupo pela primeira vez porque alguém comentou em uma conversa aleatória.

Isso não deveria depender de sorte. Londrina tem [mais de 580 mil habitantes](https://www.casacivil.pr.gov.br/Noticia/Populacao-do-Parana-cresce-acima-da-media-nacional-e-ganha-658-mil-habitantes) e é a segunda maior cidade do Paraná, atrás apenas de Curitiba. A cidade reúne dezenas de instituições de ensino com cursos ligados à tecnologia; considerando várias turmas por instituição e cerca de 30 estudantes por turma, o potencial passa facilmente de mil novas pessoas entrando nesse ecossistema a cada ano.

O objetivo maior é ajudar Londrina a ocupar melhor o espaço que seu tamanho já sugere: ser uma referência em atividade comunitária de tecnologia no Paraná, fortalecendo a cidade como um hub logo atrás da capital.

## Como participar

As informações publicadas no site vivem neste repositório e passam por revisão editorial. Qualquer pessoa pode sugerir uma nova entrada ou pedir atualização de dados existentes.

Abra uma issue usando o formulário certo:

| Tipo de indicação | Link |
| --- | --- |
| Comunidade | [Indicar ou atualizar comunidade](https://github.com/Jean-CS/rubra/issues/new?template=indicar-comunidade.yml) |
| Instituição de ensino | [Indicar ou atualizar instituição](https://github.com/Jean-CS/rubra/issues/new?template=indicar-instituicao.yml) |
| Evento | [Indicar evento](https://github.com/Jean-CS/rubra/issues/new?template=indicar-evento.yml) |

Inclua links verificáveis sempre que possível. A curadoria pode ajustar descrição, categoria, tags e outros campos para manter o diretório consistente.

Para detalhes do processo, leia [CONTRIBUTING.md](CONTRIBUTING.md).

## O que existe hoje

- Diretório de comunidades de tecnologia de Londrina e região.
- Mapa de instituições de ensino ligadas à formação, pesquisa, extensão, carreira e eventos.
- Agenda com próximos eventos publicados.
- Histórico de eventos já realizados.
- Fluxo aberto de indicação via GitHub Issues, com curadoria antes da publicação.

## Curadoria

Rubra é aberto para contribuições, mas não publica tudo automaticamente. Entradas precisam ter relação clara com tecnologia em Londrina ou região metropolitana, além de contexto mínimo para verificação.

Não entram no site: spam, descrições puramente promocionais, dados sem fonte mínima, conteúdo discriminatório ou iniciativas sem relação com o ecossistema local.

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

## Repositório

GitHub: [`Jean-CS/rubra`](https://github.com/Jean-CS/rubra)
