# =========================================================================
# Etapa 1: Build de la aplicación Vite + React + PWA
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalación limpia de dependencias
RUN npm ci

# Copiar el código fuente y compilar artefactos para producción
COPY . .
RUN npm run build

# =========================================================================
# Etapa 2: Servidor Web Nginx Alpine ultraligero
# =========================================================================
FROM nginx:alpine

# Limpiar configuración por defecto y archivos estáticos
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
