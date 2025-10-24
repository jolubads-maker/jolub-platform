# 🚀 Guía de Despliegue en Vercel

## 📋 Pasos para Desplegar JOLUB

### 1️⃣ Configuración en Vercel

1. Ve a: https://vercel.com/new
2. Selecciona tu repositorio `anuncios` de GitHub
3. Configura los siguientes ajustes:

#### Framework Preset
- Selecciona: **Vite**

#### Root Directory
- Deja en: `./` (raíz del proyecto)

#### Build Command
```bash
npm run build
```

#### Output Directory
```bash
dist
```

#### Install Command
```bash
npm install
```

---

### 2️⃣ Variables de Entorno (Environment Variables)

En la sección **Environment Variables** de Vercel, agrega:

```env
# Google OAuth
GOOGLE_CLIENT_ID=780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com

# Twilio (Opcional - para SMS)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio

# Prisma Optimize (Opcional)
OPTIMIZE_API_KEY=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ3aWQiOiJjbWg1Nm4zamwxM3V5NWZlYWpmOG03bXg3IiwidWlkIjoiY21oNTZuM2xnMTN2MTVmZWEwa3lwdDZheiIsInRzIjoxNzYxMzMzNTEzMTYzfQ.kJYl_LTM4rfEWa_MVs4t7R4M8v5bEoaLPVgNHMNnpjqP6Vkprux8m1rZEhbGqBGKa9B4o6Gz9gzWciVXjfPhBA
```

---

### 3️⃣ Configurar el Backend

**Opción A: Railway (Recomendado para el Backend)**

1. Ve a: https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio `anuncios`
5. Agrega las mismas variables de entorno
6. Railway te dará una URL como: `https://tu-app.up.railway.app`

**Opción B: Render**

1. Ve a: https://render.com
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio GitHub
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
5. Agrega las variables de entorno

---

### 4️⃣ Actualizar Google OAuth

Una vez que Vercel te dé tu URL (ej: `https://jolub.vercel.app`):

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu Client ID
3. Agrega a **"Orígenes de JavaScript autorizados"**:
   ```
   https://jolub.vercel.app
   https://tu-dominio.vercel.app
   ```
4. Guarda los cambios

---

### 5️⃣ Conectar Frontend con Backend

Una vez que tengas la URL del backend, actualiza `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-backend.railway.app/api/:path*"
    }
  ]
}
```

O crea una variable de entorno en Vercel:
```
VITE_API_URL=https://tu-backend.railway.app
```

---

## ⚠️ IMPORTANTE: Base de Datos

**SQLite NO funciona en Vercel/Railway.** Necesitas cambiar a PostgreSQL:

### Opción 1: Railway PostgreSQL (Gratis)

1. En Railway, click en **"New"** → **"Database"** → **"PostgreSQL"**
2. Copia el `DATABASE_URL` que te da
3. Agrégalo a las variables de entorno

### Opción 2: Supabase (Gratis)

1. Ve a: https://supabase.com
2. Crea un proyecto nuevo
3. Ve a **Settings** → **Database**
4. Copia el **Connection String** (Connection pooling)
5. Agrégalo como variable de entorno `DATABASE_URL`

### Actualizar Prisma Schema

Cambia en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Cambiar de "sqlite" a "postgresql"
  url      = env("DATABASE_URL")
}
```

Luego ejecuta:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

---

## 🎯 Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] Proyecto conectado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado (Railway/Render)
- [ ] Base de datos PostgreSQL creada
- [ ] Schema de Prisma actualizado
- [ ] Migraciones ejecutadas
- [ ] Google OAuth actualizado con nueva URL
- [ ] Frontend conectado con backend
- [ ] Probado en producción

---

## 🌐 URLs de Producción

- **Frontend**: https://tu-app.vercel.app
- **Backend**: https://tu-app.railway.app
- **Base de Datos**: PostgreSQL en Railway/Supabase

---

## 🔧 Solución de Problemas

### Error: Build Failed
```bash
# Asegúrate de tener el build script en package.json
"scripts": {
  "build": "vite build"
}
```

### Error: API No Responde
- Verifica que la URL del backend sea correcta
- Verifica que las variables de entorno estén configuradas
- Revisa los logs en Railway/Render

### Error: OAuth No Funciona
- Verifica que la URL de Vercel esté en Google Console
- Asegúrate de usar HTTPS (no HTTP)

---

¡Listo! Tu aplicación JOLUB estará en producción 🚀

