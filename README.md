# Comunidades

Hub estático para mapear comunidades, instituições de ensino, eventos e iniciativas de tecnologia em Londrina e região.

## Contribuições

As informações de comunidades e instituições são mantidas no GitHub e passam por curadoria antes de aparecer no site.

- Para sugerir ou atualizar dados, abra uma Issue pelo fluxo descrito em [CONTRIBUTING.md](CONTRIBUTING.md).
- Dados publicados ficam em `src/content/communities/` e `src/content/institutions/`.
- O build valida os campos obrigatórios com Astro Content Collections.

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

Se o repositório final no GitHub não for `jeancs/comunidades`, atualize os links em `src/pages/index.astro`, `.github/ISSUE_TEMPLATE/config.yml` e `CONTRIBUTING.md`.
