# 🔐 Configuración de Google OAuth

Tu Client ID de Google ya está configurado: `780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq.apps.googleusercontent.com`

## ⚠️ Solución al Error 400

El error 400 de Google OAuth ocurre porque **falta autorizar los URIs de redirección** en Google Cloud Console.

## 📋 Pasos para Configurar (5 minutos)

### 1. Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con la cuenta que creó las credenciales

### 2. Seleccionar tu Proyecto
- En la parte superior, selecciona el proyecto asociado a tu Client ID
- (Si no lo encuentras, busca por el número: `780600596679`)

### 3. Ir a Credenciales
- En el menú lateral izquierdo, ve a **"APIs y servicios"** > **"Credenciales"**
- Busca tu Client ID: `780600596679-g31b2hp2vgg0j360gpb4233bvgspk5eq`
- Haz clic en el nombre para editarlo

### 4. Agregar URIs Autorizados

#### A) **Orígenes de JavaScript autorizados**
Agrega estas URLs (ambas son necesarias):
```
http://localhost:3000
http://localhost:5173
```

#### B) **URIs de redirección autorizados**
Agrega estas URLs:
```
http://localhost:3000
http://localhost:5173
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
```

### 5. Guardar Cambios
- Haz clic en **"GUARDAR"** en la parte inferior
- Espera 1-2 minutos para que los cambios se propaguen

### 6. Probar la Aplicación
- Recarga tu aplicación en el navegador: http://localhost:3000
- Haz clic en **"Registrarse"**
- Prueba el botón de Google
- ¡Ahora debería funcionar! ✅

## 🔄 Si Aún Tienes Problemas

### Opción 1: Usar Modo Demo (Temporal)
- La aplicación ahora incluye un **Modo Demo** automático
- Cuando falla OAuth, se muestra automáticamente
- Puedes ingresar tu nombre y email para probar la app

### Opción 2: Verificar Configuración
Revisa que:
- ✅ Los URIs estén escritos **exactamente** como se muestran arriba
- ✅ No haya espacios adicionales
- ✅ Hayas guardado los cambios
- ✅ Hayas esperado 1-2 minutos después de guardar

### Opción 3: Limpiar Caché del Navegador
```
1. Presiona Ctrl + Shift + Delete
2. Selecciona "Cookies y datos de sitios"
3. Borra solo para "localhost"
4. Recarga la página
```

## 🚀 Para Producción (Después de Desarrollo)

Cuando subas tu app a producción, deberás agregar tu dominio real:

```
https://tudominio.com
https://www.tudominio.com
```

## 📝 Notas Importantes

- 🔒 **Nunca compartas** tu Client Secret (si tienes uno)
- 🌐 Los URIs deben coincidir **exactamente** con la URL donde corre tu app
- ⏱️ Los cambios pueden tardar hasta 2 minutos en aplicarse
- 🔄 Si cambias el puerto (ej: 3000 a 8080), actualiza los URIs

## 💡 Recursos Útiles

- [Documentación oficial de Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Solución de problemas comunes](https://developers.google.com/identity/sign-in/web/troubleshooting)

---

**¿Todo funcionando?** ¡Perfecto! Ya puedes usar Google Sign-In en tu marketplace. 🎉

**¿Sigues con problemas?** Usa el Modo Demo mientras configuras OAuth correctamente.

