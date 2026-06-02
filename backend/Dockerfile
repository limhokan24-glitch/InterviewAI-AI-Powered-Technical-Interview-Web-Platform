# InterviewAI backend image.
FROM node:22-alpine

# openssl: required by Prisma on alpine. python3: enables real Python code execution.
RUN apk add --no-cache openssl python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The containerized stack uses PostgreSQL (local dev uses SQLite). Swap the
# Prisma provider, then generate the client. Single schema, no duplication.
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma \
    && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
