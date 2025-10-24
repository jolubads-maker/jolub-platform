# 💬 Sistema de Chat Directo

## Descripción General

El sistema de chat de JOLUB permite la **comunicación directa entre usuarios** (comprador y vendedor) en tiempo real. Los mensajes solo se pueden enviar cuando **ambos usuarios están en línea**.

---

## 🎯 Características Principales

### ✅ Chat Directo entre Usuarios
- **No hay IA**: Los mensajes se envían directamente entre usuarios reales
- **Tiempo real**: Comunicación instantánea cuando ambos están conectados
- **Estado en línea**: Indicador visual del estado de conexión
- **Historial guardado**: Todas las conversaciones se guardan en la base de datos

### 🔒 Restricciones de Seguridad
- ✅ Solo se puede chatear cuando el vendedor está en línea
- ✅ El botón de enviar se deshabilita si el otro usuario no está disponible
- ✅ Mensaje claro de advertencia cuando el usuario no está conectado
- ✅ Historial de mensajes persistente

---

## 🏗️ Arquitectura del Chat

### Base de Datos (Prisma)

```prisma
model Chat {
  id            Int      @id @default(autoincrement())
  createdAt     DateTime @default(now())
  participants  ChatParticipant[]
  messages      Message[]
}

model ChatParticipant {
  id        Int      @id @default(autoincrement())
  chatId    String
  userId    Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Message {
  id        Int      @id @default(autoincrement())
  chatId    String
  userId    Int
  text      String
  role      String   // 'buyer' or 'seller'
  timestamp DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

### Frontend (React)

**ChatView.tsx**
- Componente principal del chat
- Muestra mensajes en tiempo real
- Deshabilita el input si el vendedor no está en línea
- Scroll automático a nuevos mensajes

**App.tsx**
- Maneja el estado global del chat
- Gestiona los logs de conversaciones
- API calls para enviar/recibir mensajes

---

## 🔄 Flujo de Comunicación

### 1. Inicio del Chat

```typescript
// Usuario hace clic en "Chatear con el vendedor"
handleStartChat(sellerId: number)
  ↓
// Verifica si el vendedor está en línea
if (seller.isOnline) {
  // Crea o recupera el chat existente
  const chatId = generateChatId(buyerId, sellerId);
  
  // Navega a la vista de chat
  setViewState({ 
    view: View.Chat, 
    sellerId, 
    buyerId, 
    chatId 
  });
}
```

### 2. Envío de Mensaje

```typescript
onSendMessage(async (message: string) => {
  // 1. Enviar mensaje a la base de datos
  const newMessage = await apiService.sendMessage(
    chatId,
    currentUser.id,
    message,
    role
  );

  // 2. Actualizar estado local
  setChatLogs(prev => {
    const updated = new Map(prev);
    const currentChat = updated.get(chatId);
    
    if (currentChat) {
      updated.set(chatId, {
        ...currentChat,
        messages: [...currentChat.messages, newMessage]
      });
    }
    
    return updated;
  });
});
```

### 3. Verificación de Estado

```typescript
// El chat verifica constantemente el estado del vendedor
{!seller.isOnline && (
  <p className="text-xs text-red-400 mt-2 text-center font-medium">
    ⚠️ El vendedor no está en línea. 
    Espera a que se conecte para chatear.
  </p>
)}
```

---

## 🛡️ Validaciones y Seguridad

### Frontend
- ✅ Input deshabilitado si el usuario no está en línea
- ✅ Botón de envío deshabilitado si no hay texto
- ✅ Placeholder dinámico según estado
- ✅ Mensaje de advertencia visible

### Backend (API)
```javascript
// POST /api/messages/:chatId
app.post('/api/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, text, role } = req.body;

    // Validar que el chat existe
    const chat = await dbUtils.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // Validar que el usuario es parte del chat
    const isParticipant = await dbUtils.isUserInChat(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Crear el mensaje
    const message = await dbUtils.createMessage(chatId, userId, text, role);
    
    res.json(message);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});
```

---

## 📱 Interfaz de Usuario

### Estados del Chat

#### 1. Usuario en Línea 🟢
```
┌─────────────────────────────────────┐
│  ← Juan Pérez              🟢 En línea │
├─────────────────────────────────────┤
│                                     │
│  👤 Hola, ¿el producto está         │
│     disponible?                     │
│                            10:30 AM │
│                                     │
│                        Sí, claro! 👤│
│  10:31 AM                           │
│                                     │
├─────────────────────────────────────┤
│ [Escribe tu mensaje...    ] [Enviar]│
└─────────────────────────────────────┘
```

#### 2. Usuario Desconectado ⚫
```
┌─────────────────────────────────────┐
│  ← Juan Pérez          ⚫ Desconectado│
├─────────────────────────────────────┤
│                                     │
│  👤 Hola, ¿el producto está         │
│     disponible?                     │
│                            10:30 AM │
│                                     │
├─────────────────────────────────────┤
│ [El vendedor no está...]  [❌]      │
│ ⚠️ El vendedor no está en línea.    │
│    Espera a que se conecte...       │
└─────────────────────────────────────┘
```

---

## 🔧 Configuración y Personalización

### Modificar Apariencia del Chat

**Colores de Mensajes**

```typescript
// components/ChatView.tsx
const messageClass = isCurrentUser
  ? 'bg-jolub-blue text-white rounded-br-none'  // Mensajes propios
  : 'bg-gray-700 text-gray-200 rounded-bl-none'; // Mensajes del otro usuario
```

**Mensajes de Estado**

```typescript
// Modificar el mensaje cuando el usuario no está en línea
{!seller.isOnline && (
  <p className="text-xs text-red-400 mt-2 text-center font-medium">
    ⚠️ Tu mensaje personalizado aquí
  </p>
)}
```

---

## 📊 Base de Datos: Estructura del Chat

### Tablas Involucradas

1. **User** - Información de usuarios
   - `isOnline`: Estado de conexión
   - `lastSeen`: Última vez en línea

2. **Chat** - Conversaciones
   - `id`: ID único del chat

3. **ChatParticipant** - Relación usuario-chat
   - `chatId`: ID del chat
   - `userId`: ID del usuario

4. **Message** - Mensajes
   - `chatId`: ID del chat
   - `userId`: Quién envió el mensaje
   - `text`: Contenido del mensaje
   - `role`: 'buyer' o 'seller'
   - `timestamp`: Cuándo se envió

---

## 🚀 Mejoras Futuras Posibles

### Funcionalidades Opcionales
- 📸 Envío de imágenes en el chat
- 📎 Adjuntar archivos
- ✅ Confirmación de lectura
- 🔔 Notificaciones push
- 🎙️ Mensajes de voz
- 💬 Respuestas rápidas predefinidas

### Optimizaciones
- WebSockets para actualizaciones en tiempo real
- Paginación de mensajes antiguos
- Cache de conversaciones
- Búsqueda en mensajes

---

## 🎯 Conclusión

El sistema de chat directo de JOLUB permite:
- ✅ Comunicación segura entre usuarios
- ✅ Control de disponibilidad
- ✅ Historial persistente
- ✅ Interfaz clara e intuitiva
- ✅ Sin dependencia de servicios externos de IA

**¡El chat es simple, directo y efectivo!** 🚀

