# 📊 Resumen del Proyecto - Marketplace JOLUB

## 🎯 ¿Qué es este proyecto?

**JOLUB** es un marketplace moderno con las siguientes características:

- 🛍️ **Anuncios clasificados**: Los usuarios pueden publicar y buscar productos
- 💬 **Chat Directo**: Comunicación directa entre usuarios (solo cuando están en línea)
- 🔐 **Autenticación OAuth**: Login con Google (y modo demo)
- 📱 **Verificación SMS**: Usando Twilio
- 🎨 **UI Moderna**: Diseño blanco y azul con Tailwind CSS
- ⚡ **Monitoreo de rendimiento**: Prisma Optimize (opcional)

---

## 🏗️ Arquitectura del Proyecto

```
marketplace-con-chat-ia/
├── 📱 Frontend (React + Vite + TypeScript)
│   ├── components/          # Componentes React
│   │   ├── HomePage.tsx     # Página principal con anuncios
│   │   ├── AdCard.tsx       # Tarjeta de anuncio
│   │   ├── AdDetail.tsx     # Detalle del anuncio
│   │   ├── Dashboard.tsx    # Panel del usuario
│   │   ├── Chat.tsx         # Chat con IA
│   │   ├── Register.tsx     # Página de registro
│   │   └── OAuthLogin.tsx   # Login con Google
│   ├── App.tsx              # Componente principal
│   ├── apiService.ts        # Llamadas al backend
│   └── types.ts             # Tipos de TypeScript
│
├── 🔧 Backend (Node.js + Express)
│   ├── server/
│   │   ├── index.js         # Servidor Express
│   │   ├── database.js      # Funciones de Prisma
│   │   └── seed.js          # Datos iniciales
│   └── prisma/
│       ├── schema.prisma    # Esquema de base de datos
│       └── dev.db           # Base de datos SQLite
│
├── 📚 Documentación
│   ├── README.md                          # Documentación principal
│   ├── GUIA-SUBIR-A-GITHUB.md            # Cómo subir a GitHub
│   ├── SOLUCION-ERROR-GOOGLE-403.md      # Solución OAuth
│   ├── CONFIGURACION-PRISMA-OPTIMIZE.md  # Setup de Prisma
│   └── SISTEMA-NAVEGACION-ANUNCIOS.md    # Cómo funciona
│
└── ⚙️ Configuración
    ├── package.json         # Dependencias
    ├── .env                 # Variables de entorno
    ├── .gitignore          # Archivos a ignorar
    └── tsconfig.json       # Configuración TypeScript
```

---

## 🗄️ Base de Datos

### Modelos principales:

1. **User** - Usuarios del sistema
   - ID único
   - Nombre, avatar, email
   - Provider OAuth (Google)
   - Session token para auto-login
   - Teléfono verificado

2. **Ad** - Anuncios publicados
   - ID único
   - Código único (AD-timestamp-random)
   - Título, descripción, precio
   - Contador de vistas
   - Relación con User (vendedor)
   - Media (imágenes/videos)

3. **ChatLog** - Conversaciones
   - ID único
   - Participantes (usuarios)
   - Mensajes
   - Relación con anuncios

4. **Message** - Mensajes del chat
   - Texto del mensaje
   - Usuario que envió
   - Tipo (user/seller/buyer)

---

## 🚀 Tecnologías Usadas

### Frontend:
- ⚛️ **React 18.3** - Framework UI
- 📘 **TypeScript 5.6** - Tipado estático
- 🎨 **Tailwind CSS** - Estilos
- ⚡ **Vite 6.3** - Build tool
- 🔐 **@react-oauth/google** - Autenticación Google

### Backend:
- 🟢 **Node.js 18+** - Runtime
- 🚂 **Express 4.21** - Framework web
- 🔷 **Prisma 5.22** - ORM
- 💾 **SQLite** - Base de datos
- 📱 **Twilio** - SMS
- 🤖 **Gemini AI** - Chat inteligente

### DevOps & Tools:
- 📦 **npm** - Gestor de paquetes
- 🔀 **Git** - Control de versiones
- 📊 **Prisma Studio** - Visualizador de DB
- 🔍 **Prisma Optimize** - Monitoreo (opcional)

---

## 🎨 Diseño UI/UX

### Paleta de Colores:
- **Principal**: `#0066ff` (jolub-blue)
- **Oscuro**: `#0052cc` (jolub-dark)
- **Fondo**: `#ffffff` (blanco)
- **Texto**: `#1f2937` (gris oscuro)

### Características del Diseño:
- ✨ **Bordes redondeados** (`rounded-2xl`, `rounded-full`)
- 🖤 **Sombras negras** para las tarjetas de anuncios
- 🎭 **Efectos hover** con escalado y transiciones
- 📱 **Responsive** para móviles, tablets y desktop
- 🌟 **Grid layout** de 3 columnas en desktop

---

## 🔐 Sistema de Autenticación

1. **Google OAuth**
   - Client ID configurado
   - Redirect URIs: localhost:3000, localhost:3001
   - Tokens JWT decodificados en el cliente

2. **Session Tokens**
   - Generados en el servidor con crypto
   - Guardados en localStorage
   - Detección automática de login

3. **Modo Demo**
   - Fallback cuando OAuth falla
   - Login manual con nombre y email
   - IDs generados automáticamente

---

## 📊 Flujo de Datos

### 1. Carga Inicial:
```
Usuario → http://localhost:3000
  ↓
App.tsx carga datos
  ↓
apiService.ts → GET /api/users, /api/ads
  ↓
Backend consulta Prisma
  ↓
SQLite devuelve datos
  ↓
HomePage muestra anuncios
```

### 2. Crear Anuncio:
```
Usuario autenticado → "Publicar Anuncio"
  ↓
Formulario con título, precio, imágenes
  ↓
POST /api/ads
  ↓
Backend valida y guarda en DB
  ↓
Genera código único (AD-timestamp-random)
  ↓
Devuelve anuncio con ID
```

### 3. Ver Detalle:
```
Click en tarjeta de anuncio
  ↓
App.tsx cambia view a Detail
  ↓
Incrementa contador de vistas
  ↓
Muestra AdDetail.tsx con toda la info
```

---

## 🔧 Variables de Entorno

El archivo `.env` contiene:

```env
# Prisma Optimize (opcional)
OPTIMIZE_API_KEY="tu-api-key"

# Twilio (opcional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Gemini AI (opcional)
GEMINI_API_KEY=""
```

**⚠️ Este archivo NO se sube a GitHub** (está en `.gitignore`)

---

## 📈 Estadísticas del Proyecto

- **Líneas de código**: ~5,000+
- **Componentes React**: 15+
- **Endpoints API**: 20+
- **Modelos de base de datos**: 7
- **Archivos de documentación**: 10+

---

## 🚦 Estado Actual

### ✅ Funcionalidades Completadas:
- [x] Autenticación con Google OAuth
- [x] Modo demo alternativo
- [x] Sistema de sesiones persistentes
- [x] CRUD de anuncios
- [x] Búsqueda de anuncios
- [x] Vista de detalle con contador de vistas
- [x] Dashboard de usuario
- [x] Chat directo entre usuarios
- [x] Verificación de teléfono (Twilio)
- [x] UI moderna blanco/azul
- [x] Grid de 3 columnas para anuncios
- [x] Prisma Optimize configurado (opcional)

### 🔄 En Progreso:
- [ ] Subir a GitHub
- [ ] Configurar orígenes OAuth en Google Cloud

### 📋 Por Hacer (Futuro):
- [ ] Deploy en producción
- [ ] Sistema de favoritos
- [ ] Filtros avanzados
- [ ] Notificaciones
- [ ] Sistema de valoraciones

---

## 📞 Contacto y Soporte

- **GitHub**: https://github.com/nicjespinoza/anuncios
- **Usuario**: @nicjespinoza

---

## 📄 Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

---

**Última actualización**: Octubre 2024  
**Versión**: 1.0.0  
**Estado**: Desarrollo activo 🚀

