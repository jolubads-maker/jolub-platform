# 📦 Sistema Completo de Anuncios - JOLUB

## ✅ Cambios Realizados

### 1. **📐 Tamaño de Tarjetas Optimizado**
   - ✅ Imágenes más compactas con proporción **4:3** (antes eran cuadradas)
   - ✅ Se muestran **3 anuncios por línea** en pantallas grandes
   - ✅ **2 por línea** en tablets
   - ✅ **1 por línea** en móviles
   - ✅ Espaciado reducido para mejor visualización

### 2. **🔗 Sistema de IDs Únicos**

Cada anuncio tiene **DOS IDs únicos**:

#### A) **ID de Base de Datos** (Numérico)
```javascript
id: 1, 2, 3, 4...  // Autoincremental
```

#### B) **Código Único Alfanumérico** (uniqueCode)
```javascript
uniqueCode: "AD-1729797234567-k3h8j2m9a"
```

**Formato del código:**
- `AD-` = Prefijo para identificar que es un anuncio
- `1729797234567` = Timestamp (fecha/hora de creación)
- `k3h8j2m9a` = Cadena aleatoria única

## 🗄️ Base de Datos - Tabla Ad (Anuncios)

Cuando un usuario registrado crea un anuncio, se guarda:

```javascript
{
  // IDs
  id: 1,                           // ID único numérico (auto)
  uniqueCode: "AD-1729797-k3h8j",  // Código único alfanumérico
  
  // Datos del anuncio
  title: "iPhone 15 Pro",          // Título
  description: "Nuevo en caja",    // Descripción
  details: "256GB, Color azul",    // Detalles adicionales (opcional)
  price: 1200,                     // Valor/Precio
  
  // Relación con usuario
  sellerId: 5,                     // ID del usuario que creó el anuncio
  
  // Estadísticas
  views: 0,                        // Contador de vistas
  
  // Multimedia
  media: [                         // Array de imágenes/videos
    {
      type: "image",
      url: "https://..."
    }
  ],
  
  // Timestamps
  createdAt: "2024-10-24...",      // Fecha de creación
  updatedAt: "2024-10-24..."       // Última actualización
}
```

## 🔄 Flujo Completo de Creación de Anuncio

### 1. **Usuario Registrado hace clic en "Publicar Anuncio"**
```
Usuario → Click "Publicar Anuncio"
```

### 2. **Verificación de teléfono**
```
Sistema verifica:
  ¿Teléfono verificado?
  ├─ SÍ → Continúa al formulario
  └─ NO → Redirige a Dashboard para verificar
```

### 3. **Usuario llena el formulario**
```
Formulario de Anuncio:
- Título: "iPhone 15 Pro"
- Descripción: "Nuevo en caja sellada"
- Detalles: "256GB, Color azul titanio"
- Precio: 1200
- Imágenes/Videos: (subir archivos)
```

### 4. **Sistema procesa y guarda**
```javascript
// En App.tsx - handleCreateAd
const newAd = await apiService.createAd({
  title: formData.title,
  description: formData.description,
  details: formData.details,
  price: formData.price,
  sellerId: currentUser.id,  // ← ID del usuario actual
  media: formData.media
});
```

### 5. **Backend genera código único**
```javascript
// En server/database.js
const uniqueCode = `AD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

await prisma.ad.create({
  data: {
    uniqueCode: uniqueCode,
    title: adData.title,
    description: adData.description,
    details: adData.details,
    price: adData.price,
    sellerId: adData.sellerId,  // ← ID del usuario
    media: { ... }
  }
});
```

### 6. **Anuncio guardado con éxito ✅**

## 🎯 Cómo Funciona el Click en un Anuncio

### Actualmente:
```javascript
// En HomePage.tsx
<AdCard
  ad={ad}
  seller={seller}
  onSelect={() => onSelectAd(ad.id)}  // ← Pasa el ID del anuncio
  currentUser={currentUser}
/>

// En App.tsx
const handleSelectAd = async (adId: number) => {
  // Incrementa vistas en BD
  const updatedAd = await apiService.incrementAdViews(adId);
  
  // Cambia a vista de detalle
  setViewState({ view: View.Detail, adId });
};
```

### Vista de Detalle (AdDetail.tsx):
```
Muestra:
- Todas las imágenes/videos
- Título completo
- Descripción completa
- Detalles
- Precio
- Información del vendedor
- Botón para chatear
- Contador de vistas actualizado
```

## 📊 Ejemplo Real

### Usuario María (ID: 5) crea un anuncio:

**1. María llena el formulario:**
- Título: "MacBook Pro 2023"
- Descripción: "Laptop en perfectas condiciones"
- Detalles: "M2 Pro, 16GB RAM, 512GB SSD"
- Precio: 2500
- Imágenes: 3 fotos

**2. Sistema guarda en base de datos:**
```sql
INSERT INTO ads (
  id,
  uniqueCode,
  title,
  description,
  details,
  price,
  sellerId,
  views,
  createdAt
) VALUES (
  12,                              -- ID auto
  'AD-1729797234567-k3h8j2m9a',  -- Código único
  'MacBook Pro 2023',
  'Laptop en perfectas condiciones',
  'M2 Pro, 16GB RAM, 512GB SSD',
  2500,
  5,                               -- ID de María
  0,
  '2024-10-24 12:30:00'
);
```

**3. Sistema guarda las imágenes:**
```sql
INSERT INTO media (adId, type, url) VALUES
(12, 'image', 'https://...foto1.jpg'),
(12, 'image', 'https://...foto2.jpg'),
(12, 'image', 'https://...foto3.jpg');
```

**4. Anuncio aparece en la página principal:**
```
Home → Grid de anuncios → Tarjeta con:
- Imagen principal
- Título: "MacBook Pro 2023"
- Precio: $2,500
- Vendedor: María (avatar + nombre)
- Código: AD-1729797
- Vistas: 0
```

**5. Juan hace clic en el anuncio:**
```
Click → Incrementa vistas (1)
      → Muestra página de detalle
      → Juan puede ver:
          - Todas las 3 fotos
          - Descripción completa
          - Detalles técnicos
          - Información de María
          - Botón para chatear con María
```

## 🔍 Verificar en Prisma Studio

**URL:** http://localhost:5555

### Ver todos los anuncios:
1. Click en tabla **"Ad"**
2. Verás todos los anuncios con:
   - `id` - ID numérico
   - `uniqueCode` - Código único
   - `title` - Título
   - `description` - Descripción
   - `price` - Precio
   - `sellerId` - ID del usuario que lo creó
   - `views` - Número de vistas

### Ver las imágenes de un anuncio:
1. Click en tabla **"Media"**
2. Filtra por `adId`
3. Verás todas las imágenes/videos de ese anuncio

### Ver quién creó cada anuncio:
1. En tabla **"Ad"**, mira el `sellerId`
2. Ve a tabla **"User"**
3. Busca el usuario con ese `id`
4. Verás: nombre, email, avatar, etc.

## 📱 Tamaños de Visualización

### Escritorio Grande (>1024px):
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Anuncio │ │ Anuncio │ │ Anuncio │
│    1    │ │    2    │ │    3    │
└─────────┘ └─────────┘ └─────────┘
```

### Tablet (768px - 1024px):
```
┌─────────┐ ┌─────────┐
│ Anuncio │ │ Anuncio │
│    1    │ │    2    │
└─────────┘ └─────────┘
```

### Móvil (<768px):
```
┌─────────┐
│ Anuncio │
│    1    │
└─────────┘
```

## 🎨 Diseño de Tarjetas

### Proporciones actualizadas:
- **Antes:** Cuadrada (1:1) - muy grandes
- **Ahora:** 4:3 (landscape) - más compactas ✅

### Elementos de cada tarjeta:
1. **Imagen principal** (4:3)
2. **Badge azul** (código único - top-left)
3. **Badge blanco** (vistas - top-right)
4. **Overlay oscuro** con:
   - Título
   - Precio
   - Avatar + nombre vendedor
5. **Sección blanca** con:
   - Descripción corta
   - Link "Ver detalles"

## 🚀 Mejoras Implementadas

✅ **Tarjetas más compactas** - Mejor uso del espacio
✅ **3 por línea** - Visualización óptima
✅ **ID único por anuncio** - Código alfanumérico
✅ **Relación User-Ad** - sellerId conecta usuario con anuncio
✅ **Guardado completo** - Título, descripción, precio, detalles
✅ **Sistema de vistas** - Contador automático
✅ **Click funcional** - Va a página de detalle
✅ **Sombras negras** - Diseño moderno con profundidad

## 📝 Resumen

El sistema JOLUB ahora tiene:

1. ✅ Tarjetas de anuncio optimizadas (3 por línea)
2. ✅ Cada anuncio con ID único en base de datos
3. ✅ Código alfanumérico único visible
4. ✅ Relación directa usuario-anuncio (sellerId)
5. ✅ Guardado de: título, descripción, detalles, precio
6. ✅ Click lleva a página de detalle del anuncio
7. ✅ Sistema de vistas funcionando
8. ✅ Diseño moderno blanco y azul

¡Todo funcionando perfectamente! 🎉


