/**
 * Firestore Seed Script
 * =====================
 * Pobla la base de datos Firestore con datos iniciales de prueba.
 * 
 * USO:
 * 1. Genera tu Service Account Key desde Firebase Console:
 *    - Ve a Firebase Console > Project Settings > Service accounts
 *    - Click en "Generate new private key"
 *    - Guarda el archivo JSON como: scripts/serviceAccountKey.json
 * 
 * 2. Ejecuta este script:
 *    npx tsx scripts/seedFirestore.ts
 * 
 * IMPORTANTE: NO subas serviceAccountKey.json a Git (ya está en .gitignore)
 */

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// ============================================
// CONFIGURACIÓN
// ============================================

// ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVICE_ACCOUNT_PATH = join(__dirname, 'serviceAccountKey.json');

// Verificar que existe el archivo de credenciales
if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('\n❌ ERROR: No se encontró el archivo de credenciales.');
    console.error('\n📋 INSTRUCCIONES PARA GENERAR LA SERVICE ACCOUNT KEY:');
    console.error('─'.repeat(60));
    console.error('1. Ve a la consola de Firebase: https://console.firebase.google.com');
    console.error('2. Selecciona tu proyecto');
    console.error('3. Click en ⚙️ (Settings) > "Project settings"');
    console.error('4. Ve a la pestaña "Service accounts"');
    console.error('5. Click en "Generate new private key"');
    console.error('6. Guarda el archivo descargado como:');
    console.error(`   ${SERVICE_ACCOUNT_PATH}`);
    console.error('─'.repeat(60));
    process.exit(1);
}

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============================================
// DATOS DE PRUEBA
// ============================================

// Usuarios de prueba
const SEED_USERS = [
    {
        uid: 'vendedor-demo-001',
        uniqueId: 'USER-VENDEDOR001',
        name: 'Vendedor Demo',
        email: 'vendedor@jolub.com',
        avatar: 'https://ui-avatars.com/api/?name=Vendedor+Demo&background=6e0ad6&color=fff&size=200',
        emailVerified: true,
        provider: 'manual',
        points: 25,
        isOnline: true,
        phone: '+1234567890',
        phoneVerified: true
    },
    {
        uid: 'comprador-demo-001',
        uniqueId: 'USER-COMPRADOR01',
        name: 'Comprador Demo',
        email: 'comprador@jolub.com',
        avatar: 'https://ui-avatars.com/api/?name=Comprador+Demo&background=ea580c&color=fff&size=200',
        emailVerified: true,
        provider: 'manual',
        points: 5,
        isOnline: false,
        phone: '+0987654321',
        phoneVerified: false
    }
];

// Anuncios de prueba
const SEED_ADS = [
    // VEHÍCULOS
    {
        title: 'Toyota Corolla 2022 - Excelente Estado',
        description: 'Vendo Toyota Corolla 2022, único dueño, mantenimiento al día en agencia. Llantas nuevas, aire acondicionado, bluetooth, cámara de reversa. Perfecto para ciudad o carretera. Consumo económico de combustible.',
        price: 22500,
        category: 'Vehículos',
        subcategory: 'Automóvil',
        location: 'Ciudad de Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 145,
        isFeatured: true,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800' }
        ]
    },
    {
        title: 'Honda CR-V 2021 4x4 Full Extras',
        description: 'Honda CR-V AWD 2021, versión full equipo. Asientos de cuero, techo panorámico, sensores de parqueo, Apple CarPlay. Solo 35,000 km recorridos. Financiamiento disponible.',
        price: 38000,
        category: 'Vehículos',
        subcategory: 'Camionetas / Sub',
        location: 'Mixco, Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 89,
        isFeatured: false,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1568844293986-8c2c5f8f0f93?w=800' }
        ]
    },

    // BIENES RAÍCES
    {
        title: 'Casa Moderna 3 Habitaciones - Zona 10',
        description: 'Hermosa casa en exclusiva zona residencial. 3 habitaciones, 2.5 baños, sala familiar, cocina equipada, jardín privado, 2 parqueos. Seguridad 24/7. Ideal para familias.',
        price: 285000,
        category: 'Bienes raíces',
        subcategory: 'Casa',
        location: 'Zona 10, Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 312,
        isFeatured: true,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' }
        ]
    },
    {
        title: 'Apartamento Céntrico Vista Panorámica',
        description: 'Apartamento de lujo en edificio nuevo. 2 habitaciones amplias, baño completo, cocina abierta con isla, balcón con vista a la ciudad. Gimnasio y piscina en área común.',
        price: 175000,
        category: 'Bienes raíces',
        subcategory: 'Apartamentos',
        location: 'Zona 14, Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 178,
        isFeatured: false,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' }
        ]
    },

    // ELECTRÓNICA
    {
        title: 'MacBook Pro M2 14" - Nuevo Sellado',
        description: 'MacBook Pro 14 pulgadas con chip M2 Pro, 16GB RAM, 512GB SSD. Nuevo en caja sellada con garantía Apple de 1 año. Incluye cargador original y accesorios.',
        price: 1899,
        category: 'Articulos Varios',
        subcategory: 'Computadoras',
        location: 'Zona 9, Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 256,
        isFeatured: true,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' }
        ]
    },
    {
        title: 'iPhone 15 Pro Max 256GB - Titanio Natural',
        description: 'iPhone 15 Pro Max en color Titanio Natural. 256GB de almacenamiento. Incluye caja original, cable y cargador. Estado 10/10, solo 2 meses de uso.',
        price: 1150,
        category: 'Articulos Varios',
        subcategory: 'Celulares/Tablet/SmartWatch',
        location: 'Zona 15, Guatemala',
        sellerId: 'vendedor-demo-001',
        views: 423,
        isFeatured: false,
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800' }
        ]
    }
];

// ============================================
// FUNCIONES DE SEED
// ============================================

async function seedUsers() {
    console.log('\n📤 Creando usuarios de prueba...');

    for (const user of SEED_USERS) {
        const userRef = db.collection('users').doc(user.uid);
        await userRef.set({
            ...user,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastSeen: FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Usuario creado: ${user.name} (${user.uid})`);
    }

    console.log(`   📊 Total: ${SEED_USERS.length} usuarios creados`);
}

async function seedAds() {
    console.log('\n📤 Creando anuncios de prueba...');

    // Obtener datos del vendedor para incluir en el anuncio
    const seller = SEED_USERS.find(u => u.uid === 'vendedor-demo-001')!;
    const sellerData = {
        id: seller.uid,
        name: seller.name,
        avatar: seller.avatar,
        isOnline: seller.isOnline,
        points: seller.points,
        phoneVerified: seller.phoneVerified
    };

    for (const ad of SEED_ADS) {
        const uniqueCode = `AD-${Date.now().toString().slice(-5)}${Math.random().toString(36).slice(-3).toUpperCase()}`;

        const adRef = db.collection('ads').doc();
        await adRef.set({
            ...ad,
            uniqueCode,
            seller: sellerData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Anuncio creado: ${ad.title.substring(0, 40)}...`);

        // Pequeña pausa para generar uniqueCodes diferentes
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`   📊 Total: ${SEED_ADS.length} anuncios creados`);
}

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🌱 FIRESTORE SEED - JOLUB MARKETPLACE');
    console.log('═'.repeat(60));

    try {
        await seedUsers();
        await seedAds();

        console.log('\n' + '═'.repeat(60));
        console.log('✅ ¡BASE DE DATOS POBLADA CON ÉXITO!');
        console.log('═'.repeat(60));
        console.log('\n📋 Resumen:');
        console.log(`   • ${SEED_USERS.length} usuarios creados`);
        console.log(`   • ${SEED_ADS.length} anuncios creados`);
        console.log('\n💡 Ahora puedes ver los datos en tu aplicación o en la');
        console.log('   consola de Firebase: https://console.firebase.google.com\n');

    } catch (error) {
        console.error('\n❌ Error durante el seed:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Ejecutar
main();
