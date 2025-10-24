# 📤 Guía Completa para Subir el Proyecto a GitHub

## ✅ Paso 1: Instalar Git

### Opción A: Descargar Git para Windows (Recomendado)

1. **Descarga Git:**
   - Ve a: https://git-scm.com/download/win
   - Haz clic en "64-bit Git for Windows Setup"
   - Espera a que termine la descarga

2. **Instala Git:**
   - Ejecuta el instalador descargado
   - Acepta todos los valores por defecto
   - Haz clic en "Next" hasta que termine
   - Haz clic en "Finish"

3. **Verifica la instalación:**
   - **Cierra y vuelve a abrir PowerShell**
   - Ejecuta: `git --version`
   - Deberías ver algo como: `git version 2.43.0`

### Opción B: Instalar con winget (Si tienes Windows 10/11 actualizado)

```powershell
winget install --id Git.Git -e --source winget
```

Luego **cierra y vuelve a abrir PowerShell**.

---

## ✅ Paso 2: Configurar Git (Primera vez)

Abre PowerShell y ejecuta estos comandos (reemplaza con tus datos):

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

**Ejemplo:**
```powershell
git config --global user.name "Nicolas Espinoza"
git config --global user.email "nicjespinoza@gmail.com"
```

---

## ✅ Paso 3: Inicializar el Repositorio Git

En PowerShell, dentro de la carpeta del proyecto:

```powershell
# Asegúrate de estar en la carpeta del proyecto
cd C:\Users\HP\Downloads\marketplace-con-chat-ia

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: Marketplace JOLUB con OAuth y Chat IA"
```

---

## ✅ Paso 4: Conectar con tu Repositorio de GitHub

```powershell
# Agregar el repositorio remoto
git remote add origin https://github.com/nicjespinoza/anuncios.git

# Cambiar a la rama main (GitHub usa 'main' por defecto ahora)
git branch -M main

# Subir el código a GitHub
git push -u origin main
```

---

## 🔐 Autenticación con GitHub

Cuando ejecutes `git push`, GitHub te pedirá autenticarte. Tienes 2 opciones:

### Opción 1: Personal Access Token (Recomendado)

1. **Genera un token en GitHub:**
   - Ve a: https://github.com/settings/tokens
   - Haz clic en "Generate new token" → "Generate new token (classic)"
   - **Nombre:** "Marketplace JOLUB"
   - **Expiration:** 90 días (o "No expiration")
   - **Permisos:** Marca solo **`repo`** (acceso completo a repositorios)
   - Haz clic en "Generate token"
   - **¡COPIA EL TOKEN!** (No podrás verlo de nuevo)

2. **Usa el token como contraseña:**
   - Cuando Git te pida el **username**: `nicjespinoza`
   - Cuando Git te pida la **password**: Pega tu token (no tu contraseña de GitHub)

### Opción 2: GitHub CLI (Más fácil)

```powershell
# Instalar GitHub CLI
winget install --id GitHub.cli

# Cerrar y volver a abrir PowerShell

# Autenticarte
gh auth login
```

Sigue las instrucciones en pantalla y elige:
- GitHub.com
- HTTPS
- Yes (authenticate Git)
- Login with a web browser

---

## ✅ Paso 5: Verificar que se subió correctamente

Ve a tu repositorio en GitHub:
```
https://github.com/nicjespinoza/anuncios
```

Deberías ver todos tus archivos allí! 🎉

---

## 📋 Comandos Útiles para el Futuro

### Guardar cambios y subirlos a GitHub:

```powershell
# Ver qué archivos cambiaron
git status

# Agregar todos los cambios
git add .

# Hacer commit con un mensaje descriptivo
git commit -m "Descripción de los cambios"

# Subir los cambios a GitHub
git push
```

### Ver el historial de commits:

```powershell
git log --oneline
```

### Ver diferencias antes de hacer commit:

```powershell
git diff
```

---

## 🔒 Archivos que NO se subirán a GitHub

El archivo `.gitignore` ya está configurado para **NO** subir:

✅ `node_modules/` - Dependencias (se instalan con `npm install`)  
✅ `prisma/dev.db` - Base de datos local  
✅ `.env` - Variables de entorno (contraseñas, API keys)  
✅ `dist/` - Archivos compilados  

**⚠️ IMPORTANTE:** Nunca subas el archivo `.env` a GitHub porque contiene tu API Key de Prisma Optimize y otras credenciales sensibles.

---

## 📝 Crear un README atractivo en GitHub

Tu proyecto ya tiene un README, pero puedes mejorarlo:

1. Ve a tu repositorio en GitHub
2. Edita el archivo `README.md`
3. Agrega badges, capturas de pantalla, demos, etc.

### Ejemplo de badges para tu README:

```markdown
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue?logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
```

---

## ❓ Solución de Problemas

### "Permission denied (publickey)"

Necesitas configurar SSH o usar HTTPS con un token. La Opción 1 (Personal Access Token) es más fácil.

### "Git is not recognized"

Cierra y vuelve a abrir PowerShell después de instalar Git.

### "Failed to push some refs"

Si el repositorio en GitHub ya tiene archivos:

```powershell
git pull origin main --allow-unrelated-histories
git push origin main
```

### "Large files detected"

Si tienes archivos muy grandes (>100MB), usa Git LFS:

```powershell
git lfs install
git lfs track "*.db"
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

---

## 🎯 Siguiente Paso: GitHub Pages (Opcional)

Si quieres publicar tu aplicación en línea:

1. Configura el backend en Render/Railway/Vercel
2. Configura el frontend en Vercel/Netlify
3. Actualiza las URLs en tu código

---

## 📚 Recursos Útiles

- [GitHub Docs - Primeros pasos](https://docs.github.com/es/get-started)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Learn Git Branching](https://learngitbranching.js.org/?locale=es_ES) - Tutorial interactivo

---

**¿Necesitas ayuda?** Abre un issue en tu repositorio o contacta con el equipo. 🚀

