# Rubra

Hub estático para mapear comunidades, instituições de ensino, eventos e iniciativas de tecnologia em Londrina e região. O nome homenageia a terra roxa, a cor avermelhada do café e o orgulho pé vermelho de Londrina.

## Contribuições

As informações de comunidades, instituições e eventos são mantidas no GitHub e passam por curadoria antes de aparecer no site.

- Para sugerir ou atualizar dados, abra uma Issue pelo fluxo descrito em [CONTRIBUTING.md](CONTRIBUTING.md).
- Dados publicados ficam em `src/content/communities/`, `src/content/institutions/` e `src/content/events/`.
- O build valida os campos obrigatórios com Astro Content Collections.
- Eventos publicados na home precisam ter data e link público. Próximos eventos aparecem primeiro; eventos já encerrados aparecem no histórico.

## Desenvolvimento

```sh
pnpm install
pnpm dev
```

## Comandos

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`      |
| `pnpm build`               | Builds the production site to `./dist/`          |
| `pnpm preview`             | Previews the build locally                       |

Repositório no GitHub: `Jean-CS/rubra`.
