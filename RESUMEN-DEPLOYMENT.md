# 📦 Resumen: Despliegue de JOLUB

## 🏗️ Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Usuario → Vercel (Frontend) → Render (Backend) → PostgreSQL │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Componentes

### 1. **Frontend (Vercel)**
- **Plataforma:** Vercel
- **Tecnología:** React + Vite
- **Plan:** Free (Hobby)
- **URL:** `https://tu-proyecto.vercel.app`
- **Repositorio:** GitHub → Deploy automático

### 2. **Backend (Render)**
- **Plataforma:** Render
- **Tecnología:** Node.js + Express
- **Plan:** Free (750 horas/mes)
- **URL:** `https://jolub-backend.onrender.com`
- **Repositorio:** GitHub → Deploy automático

### 3. **Base de Datos (Render PostgreSQL)**
- **Plataforma:** Render
- **Tecnología:** PostgreSQL 15
- **Plan:** Free (1GB, 90 días)
- **ORM:** Prisma

---

## 📝 Pasos de Despliegue

### ✅ Preparación (Ya Hecho)

1. ✅ Schema de Prisma actualizado a PostgreSQL
2. ✅ Scripts de deployment agregados a `package.json`
3. ✅ Archivo `render.yaml` creado
4. ✅ Migraciones de PostgreSQL creadas
5. ✅ Guía completa documentada

### 🚀 Próximos Pasos (Tu turno)

#### **A. Desplegar en Render (Backend + DB)**

1. **Crear Cuenta en Render**
   - Ve a: https://render.com
   - Registrate con GitHub

2. **Crear Base de Datos PostgreSQL**
   - Dashboard → New + → PostgreSQL
   - Name: `jolub-db`
   - Plan: Free
   - **Copia la "Internal Database URL"**

3. **Crear Web Service (Backend)**
   - Dashboard → New + → Web Service
   - Conecta tu repo: `nicjespinoza/anuncios`
   - Name: `jolub-backend`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Plan: Free
   
4. **Configurar Variables de Entorno**
   ```
   DATABASE_URL = <la URL que copiaste>
   NODE_ENV = production
   GOOGLE_CLIENT_ID = 780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com
   ```

5. **Deploy** → Espera 5-10 minutos

#### **B. Verificar Backend**

1. Abre: `https://jolub-backend.onrender.com/api/users`
2. Deberías ver: `[]` o datos

#### **C. Poblar Base de Datos**

Desde tu computadora:

```powershell
# 1. Actualiza tu .env local con la DATABASE_URL de Render
DATABASE_URL="postgresql://jolub:XXXXXXXX@dpg-XXXXXX.render.com/jolub"

# 2. Ejecuta el seed
npm run db:seed
```

#### **D. Configurar Vercel (Frontend)**

1. Ve a: https://vercel.com/dashboard
2. Importa tu repo desde GitHub
3. Configurar:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   
4. **Variables de Entorno:**
   ```
   VITE_API_URL = https://jolub-backend.onrender.com
   VITE_GOOGLE_CLIENT_ID = 780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com
   ```

5. Deploy

#### **E. Actualizar Google OAuth**

1. Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Agregar orígenes autorizados:
   ```
   https://tu-proyecto.vercel.app
   https://jolub-backend.onrender.com
   ```

---

## 🔍 Checklist de Verificación

### Backend (Render)
- [ ] Base de datos PostgreSQL creada
- [ ] Web Service desplegado
- [ ] Variables de entorno configuradas
- [ ] `/api/users` responde correctamente
- [ ] `/api/ads` responde correctamente
- [ ] Base de datos poblada con datos de prueba

### Frontend (Vercel)
- [ ] Proyecto importado desde GitHub
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Página carga correctamente
- [ ] Anuncios se muestran
- [ ] Google OAuth funciona

### OAuth
- [ ] Orígenes autorizados actualizados
- [ ] Login con Google funciona
- [ ] Redirect URIs configuradas

---

## 📚 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Schema actualizado para PostgreSQL |
| `prisma/migrations/` | Migraciones para producción |
| `render.yaml` | Configuración de Render (Blueprint) |
| `GUIA-RENDER.md` | Guía completa paso a paso |
| `.env.production` | Template de variables de entorno |
| `package.json` | Scripts de deployment |

---

## ⚠️ Notas Importantes

### Plan Free de Render

✅ **Ventajas:**
- 750 horas/mes de backend
- Base de datos PostgreSQL incluida
- Despliegues automáticos desde GitHub
- SSL/HTTPS gratis

⚠️ **Limitaciones:**
- Backend se duerme tras 15 min de inactividad
- Primera petición tarda ~30 segundos
- Base de datos se borra después de 90 días

### Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel Frontend | Hobby | $0/mes |
| Render Backend | Free | $0/mes |
| Render PostgreSQL | Free | $0/mes |
| **TOTAL** | | **$0/mes** |

**Para Producción Real:**
- Render Starter: $7/mes (backend siempre activo)
- Render PostgreSQL: $7/mes (persistente)

---

## 🆘 ¿Necesitas Ayuda?

### Recursos
- **Guía Detallada:** Lee `GUIA-RENDER.md`
- **Documentación Render:** https://render.com/docs
- **Dashboard Render:** https://dashboard.render.com
- **Soporte Render:** https://render.com/support

### Errores Comunes

1. **"Build failed"**
   - Verifica que `package.json` tenga `"type": "module"`
   - Revisa los logs de build

2. **"Database connection failed"**
   - Verifica DATABASE_URL
   - Asegúrate que la DB esté activa

3. **"OAuth error"**
   - Actualiza los orígenes autorizados en Google Cloud Console

---

## 🎉 ¡Todo Listo!

Una vez completados los pasos anteriores, tu aplicación JOLUB estará en producción:

✅ **Backend:** https://jolub-backend.onrender.com
✅ **Frontend:** https://tu-proyecto.vercel.app
✅ **Base de Datos:** PostgreSQL en Render
✅ **Despliegues:** Automáticos desde GitHub

---

**Fecha de Preparación:** Enero 2025
**Última Actualización:** Schema PostgreSQL + Migraciones

