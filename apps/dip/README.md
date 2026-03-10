# DIP

## Setup

Install the dependencies:

```bash
yarn install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
yarn run dev
```

For local debugging with backend API proxy, you can provide RSBuild env vars in `.env.local`:

```bash
DEBUG_ORIGIN=https://your-backend-origin
PUBLIC_TOKEN=your_access_token
PUBLIC_REFRESH_TOKEN=your_refresh_token
```

In dev mode, frontend auth reads Cookie first; if missing, it falls back to `PUBLIC_TOKEN` and `PUBLIC_REFRESH_TOKEN`.

Build the app for production:

```bash
yarn run build
```

Preview the production build locally:

```bash
yarn run preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
