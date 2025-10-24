# 🚀 Guía Completa: Desplegar JOLUB en Render

## 📋 Requisitos Previos

✅ Cuenta en Render: https://render.com (puedes usar GitHub para registrarte)
✅ Proyecto ya subido a GitHub: https://github.com/nicjespinoza/anuncios

---

## 🎯 Paso 1: Crear la Base de Datos PostgreSQL

### 1.1 Ir a Render Dashboard

1. Ve a: https://dashboard.render.com/
2. Click en **"New +"** (arriba a la derecha)
3. Selecciona **"PostgreSQL"**

### 1.2 Configurar la Base de Datos

**Name:** `jolub-db`
**Database:** `jolub`
**User:** `jolub`
**Region:** Selecciona la región más cercana (ej: Oregon USA)
**Plan:** **Free** (0$/mes)

4. Click en **"Create Database"**

### 1.3 Guardar la URL de Conexión

Una vez creada la base de datos:

1. Ve a la sección **"Info"**
2. Copia el **"Internal Database URL"** (se ve así):
```
postgresql://jolub:XXXXXXXX@dpg-XXXXXX-a.oregon-postgres.render.com/jolub
```

⚠️ **IMPORTANTE**: Guarda esta URL, la necesitarás después.

---

## 🎯 Paso 2: Crear el Backend (Web Service)

### 2.1 Crear Nuevo Web Service

1. Click en **"New +"** → **"Web Service"**
2. Selecciona **"Build and deploy from a Git repository"**
3. Click en **"Connect"** junto a tu repositorio `anuncios`

### 2.2 Configurar el Web Service

**Name:** `jolub-backend`
**Region:** La misma que elegiste para la base de datos
**Branch:** `main` (o `master`)
**Root Directory:** (dejar vacío)
**Runtime:** `Node`
**Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

**Start Command:**
```bash
npm start
```

**Plan:** **Free** (0$/mes)

---

## 🎯 Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes:

### Variables Obligatorias:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | La Internal Database URL que copiaste antes |
| `NODE_ENV` | `production` |
| `GOOGLE_CLIENT_ID` | `780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com` |

### Variables Opcionales:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `OPTIMIZE_API_KEY` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...` | Tu API Key de Prisma Optimize |
| `TWILIO_ACCOUNT_SID` | Tu Account SID | Para verificación SMS |
| `TWILIO_AUTH_TOKEN` | Tu Auth Token | Para verificación SMS |
| `TWILIO_PHONE_NUMBER` | Tu número de Twilio | Para verificación SMS |

**Nota:** Si no agregas las variables de Twilio, el sistema funcionará sin verificación por SMS.

---

## 🎯 Paso 4: Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a:
   - ✅ Clonar tu repositorio
   - ✅ Instalar dependencias
   - ✅ Generar Prisma Client
   - ✅ Ejecutar migraciones
   - ✅ Iniciar el servidor

3. **Espera 5-10 minutos** para el primer despliegue

---

## 🎯 Paso 5: Verificar el Despliegue

### 5.1 Verificar que el Backend Funciona

Tu backend estará disponible en una URL como:
```
https://jolub-backend.onrender.com
```

Prueba estas URLs:

✅ **Listar usuarios:**
```
https://jolub-backend.onrender.com/api/users
```

✅ **Listar anuncios:**
```
https://jolub-backend.onrender.com/api/ads
```

Si ves datos (aunque sea `[]`), ¡funciona! 🎉

---

## 🎯 Paso 6: Poblar la Base de Datos (Seed)

### Opción A: Desde tu Computadora (Recomendado)

1. Copia la **Internal Database URL** de Render
2. En tu computadora, crea/actualiza `.env`:

```env
DATABASE_URL="postgresql://jolub:XXXXXXXX@dpg-XXXXXX-a.oregon-postgres.render.com/jolub"
```

3. Ejecuta:
```powershell
npm run db:push
npm run db:seed
```

### Opción B: Desde Render Shell

1. Ve a tu Web Service en Render
2. Click en **"Shell"** (en el menú lateral)
3. Ejecuta:
```bash
npm run db:seed
```

---

## 🎯 Paso 7: Conectar con Vercel (Frontend)

### 7.1 Actualizar Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Ve a **"Settings"** → **"Environment Variables"**
3. Agrega/actualiza:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://jolub-backend.onrender.com` |

4. **Redeploy** tu frontend

---

## 🎯 Paso 8: Actualizar Google OAuth

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu Client ID
3. En **"Authorized JavaScript origins"**, agrega:

```
https://tu-proyecto.vercel.app
https://jolub-backend.onrender.com
```

4. En **"Authorized redirect URIs"**, agrega:

```
https://tu-proyecto.vercel.app
https://jolub-backend.onrender.com/api/auth/callback
```

5. Click en **"Save"**

---

## ✅ Verificación Final

### Backend
✅ `https://jolub-backend.onrender.com/api/users` → Devuelve datos
✅ `https://jolub-backend.onrender.com/api/ads` → Devuelve datos

### Frontend
✅ La página carga correctamente
✅ Los anuncios se muestran
✅ Google OAuth funciona
✅ Puedes crear anuncios

---

## 🔧 Comandos Útiles

### Ver Logs del Backend
```
1. Ve a tu Web Service en Render
2. Click en "Logs" (en el menú lateral)
```

### Reiniciar el Backend
```
1. Ve a tu Web Service
2. Click en "Manual Deploy" → "Clear build cache & deploy"
```

### Acceder a la Base de Datos
```
1. Ve a tu Database en Render
2. Click en "Connect"
3. Copia el comando de conexión
```

### Ver la Base de Datos con Prisma Studio
```powershell
# En tu computadora, con DATABASE_URL configurada
npm run db:studio
```

---

## ⚠️ Limitaciones del Plan Free

### Backend (Web Service Free)
- ✅ 750 horas/mes (suficiente para 1 mes completo)
- ⚠️ Se duerme después de 15 minutos de inactividad
- ⚠️ Primera petición después de dormir tarda ~30 segundos
- ✅ Despliegues automáticos desde GitHub

### Base de Datos (PostgreSQL Free)
- ✅ 90 días de vida (después se borra)
- ✅ 1 GB de almacenamiento
- ✅ Ideal para desarrollo/pruebas

**💡 Tip:** Para producción real, considera el plan Starter ($7/mes)

---

## 🐛 Solución de Problemas

### Error: "Build failed"
**Solución:**
1. Verifica que `package.json` tenga `"type": "module"`
2. Asegúrate que el Build Command sea correcto
3. Revisa los logs de build

### Error: "Database connection failed"
**Solución:**
1. Verifica que DATABASE_URL esté correcta
2. Asegúrate que la base de datos esté activa
3. Prueba la conexión desde tu computadora

### Error: "prisma:error"
**Solución:**
1. Ejecuta `npx prisma migrate deploy` manualmente
2. Verifica que el schema de Prisma sea compatible con PostgreSQL

### El backend se duerme
**Solución:**
- Es normal en el plan Free
- La primera petición lo despierta (tarda ~30 segundos)
- Para evitarlo: usa un servicio de ping (ej: UptimeRobot)

---

## 📚 Recursos Adicionales

- **Documentación de Render:** https://render.com/docs
- **Dashboard de Render:** https://dashboard.render.com
- **Soporte de Render:** https://render.com/support
- **Prisma con PostgreSQL:** https://www.prisma.io/docs/concepts/database-connectors/postgresql

---

## 🎉 ¡Felicidades!

Tu aplicación JOLUB está ahora en producción con:

✅ Backend en Render
✅ Frontend en Vercel  
✅ Base de Datos PostgreSQL en Render
✅ Google OAuth funcionando
✅ Despliegues automáticos desde GitHub

**URL del Backend:** https://jolub-backend.onrender.com
**URL del Frontend:** https://tu-proyecto.vercel.app

---

¿Tienes problemas? Revisa la sección **"Solución de Problemas"** o contacta al soporte de Render.

