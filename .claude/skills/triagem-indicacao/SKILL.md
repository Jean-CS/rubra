---
name: triagem-indicacao
description: Triage and act on a Rubra contribution issue (indicar-comunidade, indicar-instituicao, indicar-evento). Researches the suggested entity, applies editorial adjustments, posts a curation comment on the issue, and opens a PR adding or updating the Markdown entry. Use when the user references a Rubra contribution issue (e.g. "evaluate issue #N", "triage this indicação", "review this community/institution/event suggestion") or pastes an issue URL from this repo.
---

# Triagem de indicação no Rubra

Rubra é um diretório curado. Toda contribuição entra por uma issue (`indicar-comunidade.yml`, `indicar-instituicao.yml`, `indicar-evento.yml`) e precisa de revisão editorial antes de virar arquivo Markdown em `src/content/`.

Esta skill executa a triagem completa de uma indicação: pesquisa, ajustes editoriais, comentário público na issue e PR.

## Pré-requisitos

- `gh` autenticado com permissão de escrita no repositório. Verifique com `gh auth status`.
- Working tree limpo (`git status`) antes de criar a branch.

## Etapas

### 1. Ler a issue e identificar o tipo

```sh
gh issue view <N>
```

Identifique se é comunidade, instituição ou evento. Cada um tem um schema diferente em `src/content.config.ts` — releia esse arquivo se houver qualquer dúvida sobre campos obrigatórios, enums permitidos (`accent`, `format`, `organizerType`) ou validações.

### 2. Pesquisar a entidade

Use `WebFetch` em todos os links fornecidos no campo "Como verificar?" e em qualquer link público citado. Procure por:

- Confirmação de que é real e ativa
- Auto-descrição da entidade (use as palavras dela mesma, não do solicitante)
- Tamanho da comunidade, cadência real dos eventos, foco temático
- Sinais que ajudem a escolher tags e tipo

Se a pesquisa não conseguir confirmar atividade pública ou identificar organizadores, **não abra PR** — comente na issue pedindo mais informações.

### 3. Conferir critérios de curadoria

Critérios obrigatórios (de `CONTRIBUTING.md`):

- Relação clara com Londrina ou região metropolitana
- Sinais públicos de atividade (perfil, eventos, página, organizadores identificáveis)
- Sem tom puramente promocional, sem spam, sem conteúdo discriminatório

Se algum critério falhar, comente na issue explicando o motivo e **não** abra PR.

### 4. Decidir os ajustes editoriais

Compare a indicação com as entradas já existentes para manter consistência:

```sh
ls src/content/communities  # ou institutions / events
```

Releia 2-3 entradas existentes do mesmo tipo antes de escrever a sua. Padrões observados na curadoria atual:

- **Nome:** prefira a marca canônica usada pelas plataformas públicas da entidade, mesmo que difira do nome enviado.
- **Tipo:** rótulo curto e nominal (ex.: `Developers`, `Startups`, `Ecossistema`, `Mulheres em tecnologia`). Não use listas separadas por vírgula.
- **Descrição:** uma frase, sem tom promocional, descrevendo público e formato.
- **Tags:** 3 tags curtas e específicas. Evite termos genéricos demais (ex.: "Digital", "Tecnologia") quando há opção mais precisa.
- **Accent:** escolha dentro do enum (`violet`, `red`, `lime`, `cyan`, `coral`). Repetir cores é aceitável — o palette tem só 5 opções.
- **Status / cadence:** copie do enunciado quando fizer sentido, ou normalize para algo coerente com as outras entradas.

Para evento, lembre de `format` (`Presencial`/`Online`/`Híbrido`), `organizerType` (`Comunidade`/`Instituição de Ensino`), `url` válida e `endDate` se durar mais de um dia.

### 5. Criar branch, arquivo e validar build

```sh
git checkout -b community/<slug>           # ou institution/<slug>, event/<slug>
```

Crie o arquivo em `src/content/<collection>/<slug>.md` em kebab-case. Schema completo em `src/content.config.ts`.

**Sempre** valide o build antes de commitar — o Zod do Astro pega erros de schema:

```sh
pnpm build
```

### 6. Comentar na issue

Antes de abrir o PR, poste um comentário público de curadoria na issue. Estrutura:

- **Pesquisa realizada:** bullets com os links consultados e o que cada um confirmou.
- **Critérios atendidos:** lista curta marcando os pontos do `CONTRIBUTING.md`.
- **Ajustes editoriais aplicados:** explique cada mudança em relação ao formulário original (nome, tipo, tags, accent, descrição). Esse comentário é o registro público da decisão editorial — não pule.

```sh
gh issue comment <N> --body "$(cat <<'EOF'
...
EOF
)"
```

Inclua a referência ao PR no final do comentário (a numeração do PR só sai depois — você pode atualizar o comentário ou criar o PR primeiro e depois comentar, contanto que ambos linkem entre si).

### 7. Commit, push e PR

Mensagem de commit curta, descritiva, com `Closes #N`:

```
Add <Nome canônico> community

Closes #N. <1-2 frases de contexto>
```

```sh
git push -u origin <branch>
gh pr create --base main --head <branch> \
  --title "Add <Nome canônico> community" \
  --body "$(cat <<'EOF'
## Summary
...

## Pesquisa
...

## Ajustes editoriais
...

## Test plan
- [x] `pnpm build` passa
- [ ] Conferir visualmente no preview

Closes #N
EOF
)"
```

Use `--head` com o nome da branch, `--base main`. O PR e o comentário da issue devem contar a mesma história — quem ler só a issue ou só o PR precisa entender a decisão.

## Quando não abrir PR

- Indicação fora do escopo de Londrina e região
- Sem qualquer sinal público de atividade
- Conteúdo promocional, sem fonte, ou que viole critérios do `CONTRIBUTING.md`
- Pesquisa não conseguiu confirmar dados básicos

Nesses casos, comente na issue explicando o motivo, com links, e deixe em aberto para o solicitante responder. Não feche a issue unilateralmente.

## Notas

- Não rode `pnpm build` em arquivos isolados — o Astro precisa do projeto inteiro para validar o content collection.
- Não invente campos que não estão no schema (ex.: `website` em comunidade). O Zod rejeita.
- Issues de bug ou feedback (`bug.yml`, `feedback.yml`) **não** entram nesta skill — elas não geram Markdown novo.
