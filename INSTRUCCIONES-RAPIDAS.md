# ⚡ Instrucciones Rápidas - Prisma Optimize

**⚠️ IMPORTANTE:** Prisma Optimize es **completamente opcional**. La aplicación funciona perfectamente sin él. Solo configúralo si deseas monitoreo avanzado de rendimiento.

## 🚀 Configuración en 3 pasos

### Opción 1: Usando el script automático (Recomendado)

Ejecuta este comando en PowerShell:

```powershell
.\crear-env.ps1
```

### Opción 2: Manual

1. **Crea un archivo llamado `.env`** en la raíz del proyecto
2. **Copia y pega** este contenido:

```env
OPTIMIZE_API_KEY="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ3aWQiOiJjbWg1Nm4zamwxM3V5NWZlYWpmOG03bXg3IiwidWlkIjoiY21oNTZuM2xnMTN2MTVmZWEwa3lwdDZheiIsInRzIjoxNzYxMzMzNTEzMTYzfQ.kJYl_LTM4rfEWa_MVs4t7R4M8v5bEoaLPVgNHMNnpjqP6Vkprux8m1rZEhbGqBGKa9B4o6Gz9gzWciVXjfPhBA"
DATABASE_URL="file:./prisma/dev.db"
```

3. **Guarda** el archivo

## ▶️ Iniciar la aplicación

```bash
npm run dev:all
```

## ✅ Verificar que funciona

Cuando el servidor arranque, deberías ver:

```
✅ Prisma Optimize habilitado
```

Si ves este mensaje, ¡todo está funcionando correctamente! 🎉

## 📊 Ver las métricas

1. Ve a: https://console.prisma.io/
2. Inicia sesión
3. Selecciona tu proyecto
4. Ve a la sección "Optimize"
5. ¡Verás todas tus consultas en tiempo real!

---

## ❓ ¿Problemas?

### No veo el mensaje "Prisma Optimize habilitado"

- Asegúrate de que el archivo se llame exactamente `.env` (con el punto al inicio)
- Verifica que esté en la carpeta raíz del proyecto (junto a `package.json`)
- Reinicia el servidor completamente

### ¿Dónde va el archivo `.env`?

```
marketplace-con-chat-ia/
├── .env                  ← AQUÍ (raíz del proyecto)
├── package.json
├── prisma/
├── server/
└── components/
```

---

📚 Para más detalles, lee: `CONFIGURACION-PRISMA-OPTIMIZE.md`

