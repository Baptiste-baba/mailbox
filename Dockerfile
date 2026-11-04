# syntax=docker/dockerfile:1.7
# Two images, `api` and `worker`, built from a single compilation of the monorepo:
#   docker build --target api --tag mailbox-api .
#   docker build --target worker --tag mailbox-worker .

# Pinned by digest: the same base at every build, upgraded on purpose.
ARG NODE_IMAGE=node:26.12.1-trixie-slim@sha256:94816674c62774da0d099a947bf4613b9e1972a2733abd0d0cd80e795f8411d0

FROM ${NODE_IMAGE} AS build
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json ./
# The pnpm version is the one package.json pins in `packageManager`.
RUN npm install --global "$(node --print "require('./package.json').packageManager")"
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
# Each service keeps only its runtime files and production dependencies.
RUN pnpm --filter @mailbox/api --prod deploy /deploy/api \
  && pnpm --filter @mailbox/worker --prod deploy /deploy/worker

FROM ${NODE_IMAGE} AS api
ENV NODE_ENV=production \
  API_HOST=0.0.0.0 \
  WEB_DIRECTORY=/app/web
WORKDIR /app
# Owned by root: the service reads its code but can never rewrite it.
COPY --from=build /deploy/api ./
COPY --from=build /app/apps/web/dist ./web
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM ${NODE_IMAGE} AS worker
# pg_dump must be at least as recent as the server: Debian ships 17, the PostgreSQL repository has 18.
# The key goes into the existing keyrings folder: a folder created by ADD may not be traversable by
# apt's unprivileged signature check, depending on the BuildKit version.
ADD --chmod=644 --checksum=sha256:0144068502a1eddd2a0280ede10ef607d1ec592ce819940991203941564e8e76 \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc /etc/apt/keyrings/apt.postgresql.org.asc
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates \
  && echo "deb [signed-by=/etc/apt/keyrings/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt trixie-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update \
  && apt-get install --yes --no-install-recommends postgresql-client-18 \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /deploy/worker ./
USER node
CMD ["node", "src/main.ts"]
