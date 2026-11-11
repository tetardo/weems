# Weems API image. Build context: the repository root (see docker-compose.yml).
FROM node:24-slim
WORKDIR /repo
RUN corepack enable

# Dependencies first, so that a code change does not reinstall them.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contrats/package.json packages/contrats/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @weems/api...

COPY packages/contrats/src packages/contrats/src
COPY apps/api/src apps/api/src
COPY apps/api/migrations apps/api/migrations
COPY apps/api/data apps/api/data

ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "apps/api/src/server.ts"]
