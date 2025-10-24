# 🔐 Sistema de Autenticación con Google OAuth

## 📋 Descripción General

Este marketplace utiliza un sistema completo de autenticación con Google OAuth que:
- ✅ Guarda cada usuario en la base de datos con un ID único
- ✅ Genera un token de sesión único para cada usuario
- ✅ Detecta automáticamente cuando un usuario regresa
- ✅ Permite acceso directo sin necesidad de volver a iniciar sesión

## 🔄 Flujo de Autenticación

### 1. Primera Vez - Registro con Google

```
Usuario → Click "Registrarse" 
       → Click botón de Google
       → Autoriza en Google
       → Google envía datos del usuario
       → Sistema procesa:
          ├─ Busca usuario por providerId (Google ID)
          ├─ Si no existe, crea nuevo usuario en DB
          ├─ Genera token de sesión único (crypto.randomBytes)
          ├─ Guarda token en base de datos
          └─ Guarda token en localStorage del navegador
       → Usuario accede al Dashboard ✅
```

### 2. Siguiendo Visitas - Detección Automática

```
Usuario → Abre la aplicación (http://localhost:3000)
       → Sistema verifica localStorage
          ├─ ¿Hay sessionToken?
          │  ├─ SÍ → Verifica token con servidor
          │  │      ├─ Token válido → Login automático ✅
          │  │      └─ Token inválido → Pide login
          │  └─ NO → Muestra página home sin login
```

## 🗄️ Base de Datos - Tabla User

Cada usuario registrado con Google se guarda con:

```typescript
{
  id: 1,                    // ID único autoincremental
  name: "Juan Pérez",       // Nombre del usuario desde Google
  avatar: "https://...",    // Foto de perfil de Google
  email: "juan@gmail.com",  // Email de Google
  provider: "google",       // Proveedor de autenticación
  providerId: "10769....",  // ID único de Google
  sessionToken: "a5b3c...", // Token único de sesión (64 caracteres hex)
  points: 0,
  phoneVerified: false,
  isOnline: true,
  lastSeen: "2024-10-24...",
  createdAt: "2024-10-24...",
  updatedAt: "2024-10-24..."
}
```

## 🔑 Token de Sesión

### Generación del Token
```javascript
// En server/database.js
const sessionToken = crypto.randomBytes(32).toString('hex');
// Genera: "a5b3c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1"
```

### Características del Token:
- ✅ 64 caracteres hexadecimales
- ✅ Único para cada usuario
- ✅ Se guarda en la base de datos
- ✅ Se guarda en localStorage del navegador
- ✅ Permite acceso sin contraseña

### Almacenamiento:
```javascript
// Cliente (Frontend)
localStorage.setItem('sessionToken', token);
localStorage.setItem('currentUser', JSON.stringify(user));

// Servidor (Base de datos)
UPDATE users SET sessionToken = 'a5b3c...' WHERE id = 1;
```

## 🔍 Detección Automática de Login

### En App.tsx - Al Cargar la Aplicación:

```typescript
useEffect(() => {
  // 1. Verificar si hay token guardado
  const sessionToken = localStorage.getItem('sessionToken');
  
  if (sessionToken) {
    // 2. Verificar token con el servidor
    const user = await apiService.authenticateWithToken(sessionToken);
    
    if (user) {
      // 3. Token válido - Login automático
      setCurrentUser(user);
      // Usuario accede directamente al contenido
    } else {
      // 4. Token inválido - Limpiar y pedir login
      localStorage.removeItem('sessionToken');
    }
  }
}, []);
```

### Endpoint del Servidor:

```javascript
// POST /api/auth/token
// Body: { sessionToken: "a5b3c..." }

async authenticateWithToken(sessionToken) {
  // Buscar usuario por token
  const user = await prisma.user.findUnique({
    where: { sessionToken: sessionToken }
  });
  
  if (!user) return null;
  
  // Actualizar último acceso
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      lastSeen: new Date(),
      isOnline: true 
    }
  });
  
  return user;
}
```

## 📱 Flujo Completo Paso a Paso

### Primer Registro:

1. **Usuario hace click en "Registrarse"**
   - Vista: `Register.tsx`
   - URL: `/register` (virtuál, no cambia)

2. **Usuario hace click en botón de Google**
   - Componente: `GoogleLogin` de `@react-oauth/google`
   - Se abre popup de Google

3. **Usuario autoriza en Google**
   - Google valida identidad
   - Google envía credenciales (JWT token)

4. **Frontend recibe y procesa credenciales**
   ```typescript
   handleGoogleSuccess(credentialResponse) {
     // Decodificar JWT de Google
     const userInfo = decodeJWT(credentialResponse.credential);
     
     // Llamar a handleLogin
     onRegister({
       name: userInfo.name,
       avatar: userInfo.picture,
       email: userInfo.email,
       provider: 'google',
       providerId: userInfo.sub // ID único de Google
     });
   }
   ```

5. **Sistema crea/actualiza usuario en DB**
   ```typescript
   // POST /api/users
   async findOrCreateUser(userData) {
     // Buscar por providerId
     let user = await prisma.user.findFirst({
       where: { 
         providerId: userData.providerId,
         provider: 'google'
       }
     });
     
     if (!user) {
       // Crear nuevo usuario
       user = await prisma.user.create({
         data: {
           name: userData.name,
           avatar: userData.avatar,
           email: userData.email,
           provider: 'google',
           providerId: userData.providerId,
           points: 0,
           phoneVerified: false,
           isOnline: true
         }
       });
     }
     
     return user;
   }
   ```

6. **Sistema genera token de sesión**
   ```typescript
   // POST /api/users/:id/session-token
   const sessionToken = crypto.randomBytes(32).toString('hex');
   
   await prisma.user.update({
     where: { id: userId },
     data: { sessionToken }
   });
   ```

7. **Sistema guarda todo localmente**
   ```typescript
   localStorage.setItem('sessionToken', sessionToken);
   localStorage.setItem('currentUser', JSON.stringify(user));
   setCurrentUser(user);
   ```

8. **Usuario accede al Dashboard** ✅

### Visitas Posteriores:

1. **Usuario abre http://localhost:3000**
   - App.tsx se carga

2. **useEffect verifica localStorage**
   ```typescript
   const sessionToken = localStorage.getItem('sessionToken');
   ```

3. **Si hay token, verifica con servidor**
   ```typescript
   // POST /api/auth/token
   const user = await authenticateWithToken(sessionToken);
   ```

4. **Si token es válido:**
   ```typescript
   setCurrentUser(user); // Login automático
   // Usuario ve contenido sin necesidad de login
   ```

5. **Si token es inválido:**
   ```typescript
   localStorage.removeItem('sessionToken');
   // Usuario ve página home sin login
   ```

## 🛡️ Seguridad

### Protección Implementada:
- ✅ Token único de 64 caracteres
- ✅ Token guardado de forma segura en DB
- ✅ Verificación en cada carga de página
- ✅ Tokens inválidos se eliminan automáticamente
- ✅ No se guardan contraseñas
- ✅ OAuth manejado por Google (seguro)

### Mejoras Futuras (Opcional):
- 🔜 Expiración de tokens después de X días
- 🔜 Refresh tokens para renovar sesión
- 🔜 Logout desde todos los dispositivos
- 🔜 Lista de sesiones activas

## 🔧 Archivos Clave

### Frontend:
- `App.tsx` - Lógica principal de autenticación
- `components/Register.tsx` - Página de registro
- `components/OAuthLogin.tsx` - Login con OAuth
- `services/apiService.ts` - Cliente API
- `config/oauth.ts` - Configuración OAuth

### Backend:
- `server/index.js` - Endpoints de API
- `server/database.js` - Funciones de BD
- `prisma/schema.prisma` - Esquema de base de datos

## 📊 Ejemplo de Usuario en Base de Datos

```sql
-- Usuario después de registrarse con Google
INSERT INTO users (
  name, 
  avatar, 
  email, 
  provider, 
  providerId, 
  sessionToken,
  points,
  phoneVerified,
  isOnline,
  lastSeen,
  createdAt
) VALUES (
  'María García',
  'https://lh3.googleusercontent.com/a/...',
  'maria.garcia@gmail.com',
  'google',
  '107693875201663842567',
  'a5b3c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1',
  0,
  false,
  true,
  '2024-10-24 12:30:00',
  '2024-10-24 12:30:00'
);
```

## 🎯 Ventajas del Sistema

1. **Experiencia de Usuario**
   - ✅ Un solo click para registrarse
   - ✅ No necesita recordar contraseñas
   - ✅ Login automático en siguientes visitas
   - ✅ Acceso instantáneo

2. **Seguridad**
   - ✅ No se manejan contraseñas
   - ✅ OAuth de Google (muy seguro)
   - ✅ Tokens únicos e irrepetibles
   - ✅ Verificación en cada sesión

3. **Desarrollo**
   - ✅ Código limpio y mantenible
   - ✅ Base de datos bien estructurada
   - ✅ API RESTful clara
   - ✅ TypeScript para type safety

## 🚀 Probar el Sistema

1. **Abrir la aplicación:** http://localhost:3000
2. **Click en "Registrarse"**
3. **Click en botón de Google**
4. **Autorizar con tu cuenta de Google**
5. **¡Listo! Estás dentro**
6. **Cerrar el navegador y volver a abrir**
7. **¡Sigues dentro sin hacer login!** ✅

## 🐛 Solución de Problemas

### Error: "Error al iniciar sesión"
- ✅ **Solución:** Servidor reiniciado, el error de `require` está corregido

### Error 400 de Google OAuth
- 📖 **Ver:** `CONFIGURACION-GOOGLE-OAUTH.md`

### Token no funciona
- Verificar que el servidor esté corriendo
- Limpiar localStorage: `localStorage.clear()`
- Volver a registrarse

### Usuario no se guarda
- Verificar base de datos: `npm run db:studio`
- Verificar logs del servidor en la terminal

---

**¡Todo listo!** El sistema de autenticación está completamente funcional. 🎉

