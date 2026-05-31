# InterviewAI frontend image: build with Vite, serve static files with nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Point the SPA at same-origin paths; nginx proxies them to the API load balancer.
ARG VITE_USE_MOCKS=false
ARG VITE_API_BASE_URL=/api
ARG VITE_WS_URL=/ws
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:alpine
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
