# 🌐 Configurar Dominio Personalizado: www.jolub.com

## Guía Completa para Conectar tu Dominio de Wix con Vercel

---

## 📋 PARTE 1: Agregar Dominio en Vercel (5 minutos)

### Paso 1: Ir a Vercel Dashboard
1. Ve a: https://vercel.com/dashboard
2. Click en tu proyecto **"anuncios"**
3. Click en **"Settings"** (arriba)
4. En el menú lateral, click en **"Domains"**

### Paso 2: Agregar el Dominio
1. En el campo de texto, escribe: `www.jolub.com`
2. Click en **"Add"**
3. Vercel te mostrará los registros DNS que necesitas configurar

**IMPORTANTE**: No cierres esta página, necesitarás copiar los valores que Vercel te muestra.

---

## 📋 PARTE 2: Configurar DNS en Wix (10 minutos)

### Paso 1: Acceder al Panel de Wix
1. Ve a: https://manage.wix.com
2. Inicia sesión con tu cuenta de Wix
3. En el menú principal, ve a **"Dominios"**
4. Click en el dominio **"jolub.com"**

### Paso 2: Ir a Configuración DNS
1. Click en **"Administrar DNS"** o **"DNS Settings"**
2. Busca la sección de registros DNS

### Paso 3: Agregar Registro CNAME para www

**Vercel te habrá mostrado algo como esto:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**En Wix, agrega el registro:**

1. Click en **"+ Agregar registro"** o **"Add Record"**
2. Selecciona tipo: **CNAME**
3. **Host/Name**: `www`
4. **Valor/Points to**: `cname.vercel-dns.com` (o el valor exacto que te dio Vercel)
5. **TTL**: 3600 (o déjalo en automático)
6. Click en **"Guardar"** o **"Save"**

### Paso 4: (Opcional) Agregar Registro A para el dominio raíz

Si quieres que `jolub.com` (sin www) también funcione:

**Vercel te habrá mostrado algo como esto:**

```
Type: A
Name: @
Value: 76.76.21.21
```

**En Wix, agrega el registro:**

1. Click en **"+ Agregar registro"** o **"Add Record"**
2. Selecciona tipo: **A**
3. **Host/Name**: `@` (representa el dominio raíz)
4. **Valor/Points to**: `76.76.21.21` (o la IP exacta que te dio Vercel)
5. **TTL**: 3600 (o déjalo en automático)
6. Click en **"Guardar"** o **"Save"**

### Paso 5: Guardar Cambios
1. Asegúrate de guardar todos los cambios
2. Wix puede tardar unos minutos en aplicar los cambios

---

## 📋 PARTE 3: Verificar en Vercel (5-30 minutos)

### Verificación Automática
1. Vuelve a Vercel (https://vercel.com/dashboard)
2. Ve a tu proyecto → **Settings** → **Domains**
3. Vercel intentará verificar el dominio automáticamente
4. Cuando veas un **checkmark verde ✓**, ¡está listo!

### Tiempos de Propagación
- **Mínimo**: 5-10 minutos
- **Máximo**: 48 horas (pero usualmente es rápido)
- **Normal**: 15-30 minutos

### Verificar Manualmente
Puedes verificar si está funcionando visitando:
- https://www.jolub.com

---

## 🔧 IMPORTANTE: Configurar Variable de Entorno

**NO OLVIDES HACER ESTO** (si aún no lo hiciste):

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Agrega:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://jolub-backend.onrender.com/api`
   - **Environments**: Marca los 3 (Production, Preview, Development)
3. **Save** y luego **Redeploy**

---

## ✅ Verificación Final

Cuando el dominio esté activo, verifica que:
- ✅ `https://www.jolub.com` carga tu aplicación
- ✅ Los anuncios se cargan correctamente
- ✅ Puedes hacer login con Google o modo demo
- ✅ El SSL (candado 🔒) está activo (Vercel lo configura automáticamente)

---

## ❌ Solución de Problemas

### Problema 1: "Domain not verified" después de 30 minutos
**Solución:**
- Verifica que los registros DNS estén correctos en Wix
- Espera un poco más (puede tardar hasta 48 horas)
- En Vercel, intenta **"Refresh"** o **"Retry Verification"**

### Problema 2: El dominio carga pero no muestra los anuncios
**Solución:**
- Verifica que agregaste la variable `VITE_API_URL` en Vercel
- Haz un **Redeploy** del proyecto

### Problema 3: Wix dice "This record already exists"
**Solución:**
- Wix puede tener registros predeterminados
- Elimina o edita el registro existente con el mismo nombre
- Luego agrega el nuevo registro de Vercel

---

## 🎉 ¡Listo!

Cuando todo funcione, tu marketplace estará disponible en:
- **https://www.jolub.com** 🚀

---

## 📞 Necesitas Ayuda?

Si tienes algún problema, dime en qué paso te quedaste y te ayudo.

