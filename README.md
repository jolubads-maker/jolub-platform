

# 🛍️ Marketplace JOLUB

Marketplace moderno con autenticación OAuth, chat directo entre usuarios, y gestión de anuncios.

🌐 **Demo en vivo**: https://www.jolub.com

## ✨ Características

- 🔐 Autenticación 
- 💬 Chat directo entre usuarios (solo cuando están en línea)
- 📱 Gestión de anuncios con multimedia
- 👥 Sistema de usuarios y perfiles
- 📊 Dashboard de usuario con métricas
- 🔔 Verificación de teléfono con Twilio
- ⚡ Prisma Optimize para monitoreo de rendimiento
-

## 🚀 Ejecutar Localmente

**Prerequisitos:**  Node.js 18+

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Prisma Optimize (Recomendado)

**Opción rápida:** Ejecuta el script automático
```bash
.\crear-env.ps1
```

**O manualmente:** Crea un archivo `.env` en la raíz con tu API Key de Prisma Optimize:
```env
OPTIMIZE_API_KEY="tu_api_key_de_prisma_optimize"
DATABASE_URL="file:./prisma/dev.db"
```

📚 Ver [`INSTRUCCIONES-RAPIDAS.md`](INSTRUCCIONES-RAPIDAS.md) para más detalles.

### 2.1 Variables adicionales (Opcional)
Puedes agregar al archivo `.env`:
```env
GEMINI_API_KEY=tu_api_key_aqui
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=tu_numero_twilio
```

### 3. Inicializar la base de datos
```bash
npm run db:push
npm run db:seed
```

### 4. Ejecutar la aplicación
```bash
npm run dev:all
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## 📖 Guías de Configuración

- **Google OAuth**: Ver [`CONFIGURACION-GOOGLE-OAUTH.md`](CONFIGURACION-GOOGLE-OAUTH.md)
- **Apple Sign-In**: Ver [`README-OAUTH.md`](README-OAUTH.md)

## 🎯 Características Principales

### Autenticación
- ✅ Google OAuth (Client ID ya configurado)
- ✅ Modo Demo (sin necesidad de configuración)
- ⏳ Apple Sign-In (requiere configuración adicional)

### Chat Directo entre Usuarios
- 💬 Comunicación en tiempo real entre comprador y vendedor
- 🟢 Indicador de estado en línea
- 🔒 Solo disponible cuando ambos usuarios están conectados
- 📝 Historial de conversaciones guardado

### Gestión de Anuncios
- Crear, editar y eliminar anuncios
- Subir imágenes y videos
- Códigos únicos por anuncio
- Sistema de vistas

### Dashboard de Usuario
- Ver tus anuncios publicados
- Gestionar conversaciones
- Verificar número de teléfono
- Ver estadísticas

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Solo frontend (Vite)
npm run server       # Solo backend (Express)
npm run dev:all      # Frontend + Backend simultáneamente
npm run build        # Compilar para producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar cambios al esquema
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar base de datos con datos demo
```

## 📁 Estructura del Proyecto

```
marketplace-jolub/
├── components/          # Componentes React
│   ├── icons/          # Iconos SVG
│   ├── AdCard.tsx      # Tarjeta de anuncio
│   ├── ChatView.tsx    # Vista de chat
│   ├── Dashboard.tsx   # Panel de usuario
│   ├── HomePage.tsx    # Página principal
│   ├── Register.tsx    # Página de registro
│   └── ...
├── server/             # Backend Express
│   ├── database.js     # Funciones de base de datos
│   ├── index.js        # Servidor principal
│   └── seed.js         # Datos de prueba
├── services/           # Servicios
│   ├── apiService.ts   # Cliente API
│   └── geminiService.ts # Integración Gemini AI
├── config/             # Configuración
│   └── oauth.ts        # Configuración OAuth
├── prisma/             # Base de datos
│   ├── schema.prisma   # Esquema de DB
│   └── dev.db         # SQLite database
└── ...
```

## 📝 Licencia


<!-- deployment trigger: 11/27/2025 09:11:35 -->
