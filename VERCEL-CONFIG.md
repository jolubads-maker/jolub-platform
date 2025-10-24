# 🔧 Configuración de Vercel

## Variables de Entorno Requeridas

Para que tu aplicación en Vercel se conecte correctamente con el backend de Render, necesitas configurar la siguiente variable de entorno:

### Pasos para Configurar

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **"anuncios"**
3. Ve a **Settings** (Configuración)
4. En el menú lateral, click en **Environment Variables**
5. Agrega la siguiente variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://jolub-backend.onrender.com/api` |

6. **IMPORTANTE**: Selecciona los 3 ambientes: **Production**, **Preview**, y **Development**
7. Click en **Save**
8. Ve a la pestaña **Deployments**
9. En el último deployment exitoso, click en los **3 puntos** (⋯)
10. Selecciona **Redeploy**
11. Espera 1-2 minutos

---

## ✅ Verificar que Funcione

Después del redeploy, abre:
- https://anuncios-omega.vercel.app/

Deberías ver los anuncios cargados desde la base de datos de Render.

---

## 🔄 Configuración Automática (Alternativa)

Si prefieres, puedo crear un archivo `vercel.json` con la configuración automática para que no tengas que hacer esto manualmente cada vez.

