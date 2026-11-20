# pepega-bot

To install dependencies and generate the Prisma client:

```bash
pnpm install
pnpm generate
```

To run (secrets come from Doppler):

```bash
pnpm dev
```

`pnpm typecheck` runs the TypeScript check. Render builds with
`pnpm install && pnpm prisma generate` and starts with `bun start`.

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Queue backend

`QUEUE_BACKEND` (`redis` or `do`) and `REALTIME_BACKEND` (`pusher` or `do`)
must match the frontend. With `do`, also set `QUEUE_WORKER_URL` and
`QUEUE_WORKER_SECRET`. See the frontend repo's `queue-worker/README.md`.
