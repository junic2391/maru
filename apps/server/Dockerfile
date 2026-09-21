FROM node:24-slim
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @maru/server build
WORKDIR /repo/apps/server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]