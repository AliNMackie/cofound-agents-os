FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Fix permissions for node_modules/.bin executables
RUN chmod -R +x ./node_modules/.bin

# Helper to inject public env vars at build time
ARG NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCoTXMQfMjhfGyhbG296Jc08cv8AwoI-00"
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="newsletter-engine-9988.firebaseapp.com"
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID="newsletter-engine-9988"
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="newsletter-engine-9988.firebasestorage.app"
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="99727052460"
ARG NEXT_PUBLIC_FIREBASE_APP_ID="1:99727052460:web:2bde35c737279a3a4d1909"

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

RUN npm run build

# Production image, copy static files and run with simple http server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the static export (output: 'export' creates /app/out directory)
COPY --from=builder --chown=nextjs:nodejs /app/out ./out

# Install serve to run the static site
RUN npm install -g serve

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Serve the static export
CMD ["serve", "-s", "out", "-l", "3000"]
