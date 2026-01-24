# --- 1. BUILD AŞAMASI (Derleme) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# KRİTİK NOKTA: Sadece 'npm install' diyoruz. 
# Böylece TypeScript (devDependencies) yükleniyor.
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Şimdi tsc komutu çalışacak çünkü yukarıda yüklendi
RUN npm run build

# --- 2. PRODUCTION AŞAMASI (Çalıştırma) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Sadece production için gerekenleri al (Gereksiz dosyalar gelmesin)
COPY package*.json ./
RUN npm ci --only=production

# Yukarıdaki 'builder' aşamasından derlenmiş dosyaları (dist) al
COPY --from=builder /app/dist ./dist

# Sağlık kontrolü
RUN apk add --no-cache curl

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]