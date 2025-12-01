# Instrucciones de Redespliegue

He corregido un error crítico en el backend (`server/src/app.ts`) donde faltaba la librería `cookie-parser`. Esto impedía que el servidor leyera la cookie de sesión, causando los errores 401 (Unauthorized) que estabas viendo.

## Pasos a seguir:

1.  **Subir los cambios a GitHub:**
    He intentado subir los cambios automáticamente, pero hubo un error de conexión ("Connection was reset"). Por favor, intenta subir los cambios manualmente desde tu terminal:

    ```bash
    git push -u origin main
    ```

    Si esto falla, verifica tu conexión a internet o tus credenciales de GitHub.

2.  **Redesplegar en Render:**
    Una vez que el código esté en GitHub, Render debería detectar el cambio y redesplegar automáticamente.
    Si no tienes auto-deploy activado, ve a tu dashboard de Render y haz clic en "Manual Deploy" -> "Deploy latest commit".

3.  **Verificar:**
    Una vez redesplegado el backend, recarga la página en tu navegador.
    - Intenta iniciar sesión de nuevo.
    - Los errores 401 deberían desaparecer.
    - El estado "Online" y los chats deberían cargar correctamente.

## Explicación Técnica
El frontend estaba enviando correctamente la cookie de sesión (`credentials: 'include'`), pero el backend no tenía configurado el `cookie-parser`, por lo que no podía leer la cookie y rechazaba las peticiones como no autorizadas.
