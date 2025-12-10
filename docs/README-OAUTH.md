# Marketplace con Chat IA

Un marketplace moderno con autenticación OAuth (Google y Apple), sistema de chat con IA, y búsqueda avanzada de anuncios.

## 🚀 Características Implementadas

### ✅ Autenticación OAuth
- **Google Sign-In**: Integración completa con Google OAuth 2.0
- **Apple Sign-In**: Soporte para Apple ID
- **Tokens de sesión**: Detección automática de usuarios logueados
- **Persistencia**: Los usuarios permanecen logueados entre sesiones

### ✅ Página Home Rediseñada
- **Dashboard integrado**: Acceso rápido al panel de usuario
- **Estado de conexión**: Indicador visual verde cuando el usuario está en línea
- **Imagen de perfil**: Avatar del usuario en el header
- **Navegación intuitiva**: Botones de acceso rápido

### ✅ Sistema de Búsqueda Avanzado
- **Input de búsqueda**: Campo de búsqueda prominente en la página home
- **Análisis de base de datos**: Búsqueda en tiempo real
- **Múltiples criterios**: Busca por título, descripción, detalles, código único y vendedor
- **Indicador de carga**: Feedback visual durante la búsqueda

### ✅ Anuncios Mejorados
- **Códigos únicos**: Cada anuncio tiene un identificador único
- **Detalles adicionales**: Campo para especificaciones técnicas y condiciones
- **Información del vendedor**: Avatar y estado de conexión
- **Vista mejorada**: Diseño más informativo y atractivo

## 🛠️ Configuración

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar OAuth

#### Google OAuth:
1. Ve a [Google Cloud Console](https://console.developers.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a "Credenciales" y crea un "ID de cliente OAuth 2.0"
5. Agrega tu dominio a los orígenes autorizados
6. Copia el Client ID

#### Apple Sign-In:
1. Ve a [Apple Developer](https://developer.apple.com/account/)
2. Crea un nuevo App ID
3. Habilita "Sign In with Apple"
4. Crea un Service ID
5. Configura los dominios y URLs de redirección

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
REACT_APP_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
REACT_APP_APPLE_CLIENT_ID=tu_apple_client_id_aqui
```

### 4. Configurar Base de Datos
```bash
# Generar cliente de Prisma
npx prisma generate

# Aplicar cambios a la base de datos
npx prisma db push

# (Opcional) Ver la base de datos
npx prisma studio
```

### 5. Ejecutar la Aplicación
```bash
# Servidor de desarrollo (puerto 3000)
npm run dev

# Servidor de API (puerto 4000)
npm run server

# Ambos simultáneamente
npm run dev:all
```

## 📁 Estructura del Proyecto

```
marketplace-con-chat-ia/
├── components/
│   ├── OAuthLogin.tsx      # Autenticación OAuth
│   ├── HomePage.tsx        # Página principal rediseñada
│   ├── AdCard.tsx          # Tarjeta de anuncio mejorada
│   ├── AdForm.tsx          # Formulario con campo de detalles
│   └── ...
├── config/
│   └── oauth.ts            # Configuración OAuth
├── services/
│   └── apiService.ts       # Servicio API actualizado
├── server/
│   ├── index.js            # Servidor con nuevos endpoints
│   └── database.js         # Utilidades de BD actualizadas
├── prisma/
│   └── schema.prisma       # Esquema actualizado
└── types.ts               # Tipos TypeScript actualizados
```

## 🔧 Nuevos Endpoints API

### Autenticación
- `POST /api/auth/token` - Autenticación con token de sesión
- `POST /api/users/:id/session-token` - Generar token de sesión

### Búsqueda
- `GET /api/ads/search?q=query` - Búsqueda de anuncios

### Usuarios (actualizados)
- `POST /api/users` - Crear usuario con datos OAuth

## 🎨 Características de UI/UX

### Página Home
- **Header inteligente**: Muestra información del usuario logueado
- **Búsqueda prominente**: Campo de búsqueda con análisis en tiempo real
- **Estado de conexión**: Indicador visual del estado del usuario
- **Navegación fluida**: Transiciones suaves entre vistas

### Tarjetas de Anuncios
- **Código único visible**: Identificador único en cada tarjeta
- **Información del vendedor**: Avatar y estado de conexión
- **Detalles expandidos**: Descripción y detalles adicionales
- **Diseño responsivo**: Adaptable a diferentes tamaños de pantalla

### Autenticación
- **Botones OAuth**: Diseño moderno para Google y Apple
- **Manejo de errores**: Mensajes claros para el usuario
- **Carga visual**: Indicadores de progreso durante la autenticación

## 🔒 Seguridad

- **Tokens de sesión seguros**: Generación con crypto.randomBytes
- **Validación de tokens**: Verificación en cada request
- **Limpieza automática**: Tokens expirados se eliminan automáticamente
- **Rate limiting**: Protección contra ataques de fuerza bruta

## 📱 Responsive Design

- **Mobile-first**: Diseño optimizado para móviles
- **Breakpoints**: Adaptación a tablet y desktop
- **Touch-friendly**: Botones y elementos táctiles optimizados
- **Navegación móvil**: Menús adaptados para pantallas pequeñas

## 🚀 Próximos Pasos

1. **Configurar credenciales OAuth** según las instrucciones
2. **Personalizar el diseño** según tus necesidades
3. **Agregar más proveedores OAuth** (Facebook, Twitter, etc.)
4. **Implementar notificaciones push** para mensajes
5. **Agregar sistema de calificaciones** para vendedores

## 📞 Soporte

Si tienes problemas con la configuración OAuth o cualquier otra funcionalidad, revisa:

1. Las credenciales OAuth están correctamente configuradas
2. Los dominios están autorizados en las consolas de desarrollador
3. Las variables de entorno están definidas correctamente
4. La base de datos está sincronizada con el esquema

¡Tu marketplace con chat IA está listo para usar! 🎉

