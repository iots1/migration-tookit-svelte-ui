# Migration Toolkit UI

SvelteKit 5 web interface for the Migration Toolkit — a data migration pipeline builder with schema mapping, pipeline editor, and job management.

## Demo

[https://iots1.github.io/migration-tookit-svelte-ui](https://iots1.github.io/migration-tookit-svelte-ui)

## Tech Stack

- **SvelteKit 5** with runes mode
- **TypeScript**
- **Tailwind CSS v4** + SCSS
- **@xyflow/svelte** for pipeline canvas
- **adapter-node** for server-side rendering

## Developing

```sh
pnpm install
pnpm dev
```

## Building

```sh
pnpm build
pnpm preview
```

## Docker

```sh
docker build -t migration-toolkit-ui .

docker run -p 5173:5173 \
  -e PUBLIC_API_URL=https://your-api.com/api/v1 \
  -e PUBLIC_WS_URL=wss://your-api.com \
  migration-toolkit-ui
```

## CI/CD

Pushing to `main` automatically builds and publishes a Docker image to GitHub Container Registry:

```sh
docker pull ghcr.io/iots1/migration-tookit-svelte-ui:latest
```
