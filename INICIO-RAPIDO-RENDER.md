# 🚀 Inicio Rápido: Desplegar en Render

## ⚡ 5 Pasos Rápidos

### 1️⃣ Crear Cuenta en Render
```
👉 https://render.com
✅ Regístrate con tu cuenta de GitHub
```

---

### 2️⃣ Crear Base de Datos PostgreSQL

1. **Dashboard** → **New +** → **PostgreSQL**
2. Configurar:
   - **Name:** `jolub-db`
   - **Plan:** **Free**
3. **Create Database**
4. **Copiar "Internal Database URL"** (se ve así):
   ```
   postgresql://jolub:XXXXXXXX@dpg-XXXXXX.oregon-postgres.render.com/jolub
   ```

⚠️ **Guarda esta URL, la necesitarás en el paso 3**

---

### 3️⃣ Crear Backend (Web Service)

1. **Dashboard** → **New +** → **Web Service**
2. **Conectar repositorio:** `nicjespinoza/anuncios`
3. Configurar:
   
   **Name:** `jolub-backend`
   
   **Build Command:**
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
   
   **Start Command:**
   ```bash
   npm start
   ```
   
   **Plan:** **Free**

4. **Environment Variables** (agregar estas):
   
   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | La URL que copiaste en el paso 2 |
   | `NODE_ENV` | `production` |
   | `GOOGLE_CLIENT_ID` | `780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com` |

5. **Create Web Service**

⏳ **Espera 5-10 minutos para el primer despliegue**

---

### 4️⃣ Verificar que Funciona

Abre en tu navegador:

✅ **Tu backend:**
```
https://jolub-backend.onrender.com/api/users
```

Deberías ver: `[]` o datos

✅ **Si funciona, continúa al paso 5**

---

### 5️⃣ Poblar la Base de Datos

**Desde tu computadora:**

1. Abre tu archivo `.env` local
2. Agrega la **DATABASE_URL** de Render (la del paso 2):
   ```env
   DATABASE_URL="postgresql://jolub:XXXXXXXX@dpg-XXXXXX.oregon-postgres.render.com/jolub"
   ```

3. Ejecuta en PowerShell:
   ```powershell
   npm run db:seed
   ```

4. **Recarga tu backend:**
   ```
   https://jolub-backend.onrender.com/api/ads
   ```

✅ **Deberías ver anuncios de prueba**

---

## 🎉 ¡Listo!

Tu backend ya está en producción:

✅ **Backend:** https://jolub-backend.onrender.com
✅ **Base de Datos:** PostgreSQL en Render
✅ **Despliegues:** Automáticos desde GitHub

---

## 📚 Próximos Pasos

### A. Conectar con Vercel (Frontend)

1. Ve a: https://vercel.com
2. Importa tu repo `nicjespinoza/anuncios`
3. Agrega variable de entorno:
   ```
   VITE_API_URL = https://jolub-backend.onrender.com
   ```
4. Deploy

### B. Actualizar Google OAuth

1. Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Agregar orígenes:
   ```
   https://jolub-backend.onrender.com
   https://tu-proyecto.vercel.app
   ```

---

## 🆘 ¿Problemas?

- 📖 **Guía Completa:** Lee `GUIA-RENDER.md`
- 📋 **Resumen:** Lee `RESUMEN-DEPLOYMENT.md`
- 💬 **Soporte Render:** https://render.com/support

---

## ⚠️ Recuerda

- **El backend se duerme** tras 15 min de inactividad (plan Free)
- **Primera petición** después de dormir tarda ~30 segundos
- **Base de datos** se borra después de 90 días (plan Free)

Para producción real, considera el **plan Starter ($7/mes)**

---

**¡Éxito con tu despliegue! 🚀**


