# 🛍️ JOLUB Platform

Marketplace moderno con autenticación OAuth, chat en tiempo real, y gestión de anuncios.

🌐 **Demo en vivo**: https://www.jolub.com

## ✨ Características

- 🔐 **Autenticación completa** (Email/Password + Google OAuth)
- 💬 **Chat en tiempo real** entre usuarios (Socket.io)
- 📱 **Gestión de anuncios** con multimedia (Cloudflare R2)
- 👥 **Sistema de usuarios** y perfiles
- 📊 **Dashboard** de usuario con métricas
- 🔔 **Verificación de teléfono** con Twilio
- 📧 **Notificaciones** por email con Nodemailer
- ⚡ **Prisma Optimize** para monitoreo de rendimiento

## 🚀 Inicio Rápido (Desarrollo Local)

### Opción 1: Usar el script automático
```bash
# Windows
dev-local.bat
```

### Opción 2: Comandos manuales

**Prerequisitos:** Node.js 20+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
copy env.example .env
# Edita .env con tus credenciales

# 3. Generar cliente Prisma
npx prisma generate

# 4. Inicializar base de datos
npm run db:push
npm run db:seed  # (Opcional) Datos de prueba

# 5. Ejecutar en desarrollo
npm run dev:all
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Solo frontend (Vite) |
| `npm run server:dev` | Solo backend con hot-reload |
| `npm run dev:all` | **Frontend + Backend simultáneamente** |
| `npm run build` | Compilar para producción |
| `npm run start` | Ejecutar en producción |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:push` | Aplicar cambios al esquema |
| `npm run db:studio` | Abrir Prisma Studio (GUI) |
| `npm run db:seed` | Poblar base de datos con datos demo |

## 📁 Estructura del Proyecto

```
jolub-platform/
├── components/          # Componentes React
│   ├── icons/           # Iconos SVG
│   ├── AdCard.tsx       # Tarjeta de anuncio
│   ├── ChatView.tsx     # Vista de chat
│   ├── Dashboard.tsx    # Panel de usuario
│   └── ...
├── server/              # Backend Express (TypeScript)
│   └── src/
│       ├── controllers/ # Controladores de rutas
│       ├── middleware/  # Middlewares (auth, validation)
│       ├── routes/      # Definición de rutas API
│       ├── services/    # Servicios externos
│       └── index.ts     # Entrada del servidor
├── services/            # Servicios del frontend
│   ├── apiService.ts    # Cliente API
│   └── geminiService.ts # Integración Gemini AI
├── prisma/              # Base de datos
│   ├── schema.prisma    # Esquema de DB
│   └── migrations/      # Migraciones
├── docs/                # Documentación adicional
└── dev-local.bat        # Script de desarrollo Windows
```

## 🔧 Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/jolub"

# JWT
JWT_SECRET="tu_secreto_jwt"

# Cloudflare R2 (Almacenamiento)
R2_ACCOUNT_ID="tu_account_id"
R2_ACCESS_KEY_ID="tu_access_key"
R2_SECRET_ACCESS_KEY="tu_secret_key"
R2_BUCKET_NAME="tu_bucket"
R2_PUBLIC_DOMAIN="tu_dominio_publico"

# Email (Nodemailer)
EMAIL_USER="tu@email.com"
EMAIL_PASS="tu_app_password"

# Twilio (SMS)
TWILIO_ACCOUNT_SID="tu_sid"
TWILIO_AUTH_TOKEN="tu_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Google OAuth
GOOGLE_CLIENT_ID="tu_google_client_id"
```

## 📖 Documentación Adicional

Ver la carpeta [`/docs`](./docs) para:
- Configuración de OAuth (Google/Apple)
- Sistema de autenticación
- Sistema de chat
- Configuración de Prisma Optimize
- Guía de personalización UI

## 🚀 Despliegue

Este proyecto está configurado para desplegarse en **Vercel**:

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push a `main`

## 📝 Licencia

MIT © JOLUB
