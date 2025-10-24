# 🔧 Solución: Error 403 de Google OAuth

## ❌ Error que estás viendo:

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
Failed to load resource: the server responded with a status of 403
```

## ✅ Solución Rápida

El error significa que **`http://localhost:3000`** no está autorizado en tu configuración de Google OAuth.

### Pasos para corregir:

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Selecciona tu proyecto** (o crea uno si no existe)

3. **Haz clic en tu Client ID** que termina en `...g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com`

4. **En la sección "Orígenes autorizados de JavaScript", agrega:**
   ```
   http://localhost:3000
   http://localhost:3001
   http://127.0.0.1:3000
   ```

5. **En la sección "URI de redireccionamiento autorizados", agrega:**
   ```
   http://localhost:3000
   http://localhost:3001
   http://127.0.0.1:3000
   ```

6. **Haz clic en "Guardar"**

7. **Espera 5 minutos** para que los cambios se propaguen

8. **Recarga la página** en tu navegador

## 🎯 Capturas de pantalla de referencia

Deberías ver algo como esto en la consola de Google:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Orígenes de JavaScript autorizados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http://localhost:3000
  http://localhost:3001
  http://127.0.0.1:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URI de redireccionamiento autorizados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  http://localhost:3000
  http://localhost:3001
  http://127.0.0.1:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 💡 Alternativa: Usar Modo Demo

Si no quieres configurar Google OAuth ahora, puedes usar el **Modo Demo**:

1. En la página de login, verás un botón **"Usar Modo Demo"**
2. Haz clic en ese botón
3. Ingresa cualquier nombre y email
4. ¡Listo! Podrás usar la aplicación sin OAuth

## 🔍 Verificar que funciona

Después de configurar Google OAuth:

1. Abre tu navegador en **http://localhost:3000**
2. Haz clic en **"Acceder"** o **"Registrarse"**
3. Haz clic en el botón de Google
4. Deberías ver la ventana de selección de cuenta de Google
5. Si ves el error 403, **espera 5 minutos más** y recarga

## ⚠️ Problemas comunes

### "Ya agregué localhost:3000 pero sigue sin funcionar"

- **Espera 5-10 minutos** - Google tarda en propagar los cambios
- **Borra el caché del navegador** - Presiona `Ctrl+Shift+Delete` y borra cookies
- **Verifica que no haya espacios** en las URLs que agregaste
- **Usa exactamente** `http://localhost:3000` (con `http://`, no `https://`)

### "No encuentro dónde agregar los orígenes"

1. Ve a: https://console.cloud.google.com/apis/credentials
2. En la lista de "IDs de cliente de OAuth 2.0", haz clic en tu Client ID
3. Baja hasta "Orígenes de JavaScript autorizados"
4. Haz clic en "+ AGREGAR URI"
5. Pega `http://localhost:3000`
6. Haz clic en "Guardar" al final de la página

### "Me dice que el puerto 3000 no es válido"

Agrega también:
```
http://localhost:3001
http://localhost:5173
```

A veces Vite usa puertos diferentes.

## 📚 Documentación oficial

- [Google OAuth - Configurar orígenes autorizados](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#creatingcred)
- [Solución de problemas de OAuth](https://developers.google.com/identity/sign-in/web/troubleshooting)

---

**¿Sigue sin funcionar?** Usa el **Modo Demo** mientras esperas que se propaguen los cambios de Google. ¡La aplicación funciona perfectamente con el Modo Demo!


