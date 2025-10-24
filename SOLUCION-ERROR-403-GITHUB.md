# 🔧 Solución: Error 403 al subir a GitHub

## ❌ Error recibido:

```
remote: Write access to repository not granted.
fatal: The requested URL returned error: 403
```

## 🔍 Causas posibles:

### 1. El repositorio no existe en GitHub

**Solución:**
1. Ve a: https://github.com/nicjespinoza
2. Verifica si el repositorio "anuncios" existe
3. Si NO existe, créalo:
   - Click en "New repository"
   - Nombre: `anuncios`
   - Descripción: "Marketplace JOLUB con OAuth y Chat IA"
   - **IMPORTANTE**: Déjalo **VACÍO** (sin README, sin .gitignore, sin licencia)
   - Click en "Create repository"

### 2. El token no tiene los permisos correctos

**Solución:**
1. Ve a: https://github.com/settings/tokens
2. Busca tu token o crea uno nuevo
3. Asegúrate de que tenga el permiso `repo` (acceso completo a repositorios)
4. Si creaste uno nuevo, copia el token y úsalo

### 3. El token expiró

**Solución:**
1. Ve a: https://github.com/settings/tokens
2. Verifica la fecha de expiración
3. Si expiró, genera un nuevo token con el permiso `repo`

## ✅ Pasos a seguir:

### Paso 1: Verificar/Crear el repositorio

Ve a: https://github.com/new

- **Repository name**: `anuncios`
- **Description**: "Marketplace JOLUB - Anuncios clasificados con OAuth y Chat IA"
- **Public** o **Private** (tu elección)
- **❌ NO marques** "Add a README file"
- **❌ NO agregues** .gitignore
- **❌ NO agregues** license

Click en **"Create repository"**

### Paso 2: Verificar el token

Ve a: https://github.com/settings/tokens

- Verifica que tu token tenga el **permiso `repo`** marcado
- Verifica que no esté expirado
- Si tienes dudas, **genera un nuevo token**:
  1. Click en "Generate new token" → "Generate new token (classic)"
  2. Nombre: "Marketplace JOLUB"
  3. Expiration: 90 días
  4. **Marca solo `repo`** (acceso completo a repositorios)
  5. Click en "Generate token"
  6. **COPIA EL TOKEN** (no podrás verlo de nuevo)

### Paso 3: Intentar de nuevo

Con el repositorio creado y un token válido:

```powershell
# Configurar la URL con el nuevo token
git remote set-url origin https://nicjespinoza:TU_NUEVO_TOKEN@github.com/nicjespinoza/anuncios.git

# Subir el código
git push -u origin main
```

## 🔐 Formato del token

Tu token debe verse así:
```
github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Y debe tener aproximadamente 93 caracteres.

## 💡 Alternativa: Usar GitHub CLI

Si sigues teniendo problemas, usa GitHub CLI:

```powershell
# Instalar GitHub CLI
winget install --id GitHub.cli

# Cerrar y volver a abrir PowerShell

# Autenticarte
gh auth login

# Seguir las instrucciones en pantalla

# Subir el código
git push -u origin main
```

## 📝 Comandos útiles

```powershell
# Ver la URL remota actual
git remote -v

# Cambiar la URL remota (sin token visible)
git remote set-url origin https://github.com/nicjespinoza/anuncios.git

# Subir usando credenciales guardadas
git push -u origin main
```

## ❓ ¿Aún no funciona?

1. **Verifica tu usuario de GitHub**: ¿Es realmente `nicjespinoza`?
2. **Verifica el nombre del repositorio**: ¿Se llama exactamente `anuncios`?
3. **Verifica que el repositorio esté vacío**: Si ya tiene archivos, necesitas hacer `pull` primero
4. **Prueba con HTTPS** en lugar de SSH

---

**¿Necesitas ayuda?** Comparte el mensaje de error exacto que recibes.


