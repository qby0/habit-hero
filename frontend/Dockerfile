FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 