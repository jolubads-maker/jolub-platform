/**
 * Script para crear usuarios en Firebase Authentication
 * =====================================================
 * Crea usuarios demo y admin en Firebase Auth (no solo Firestore)
 * 
 * Ejecutar: npx tsx scripts/createAuthUsers.ts
 */

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVICE_ACCOUNT_PATH = join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));

// Inicializar Firebase Admin (si no está inicializado)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

// Usuarios a crear
const USERS_TO_CREATE = [
    {
        email: 'vendedor@jolub.com',
        password: 'demo1234',
        displayName: 'Vendedor Demo',
        role: 'user',
        firestoreData: {
            name: 'Vendedor Demo',
            avatar: 'https://ui-avatars.com/api/?name=Vendedor+Demo&background=6e0ad6&color=fff&size=200',
            emailVerified: true,
            provider: 'manual',
            points: 25,
            isOnline: false,
            phone: '+1234567890',
            phoneVerified: true
        }
    },
    {
        email: 'comprador@jolub.com',
        password: 'demo1234',
        displayName: 'Comprador Demo',
        role: 'user',
        firestoreData: {
            name: 'Comprador Demo',
            avatar: 'https://ui-avatars.com/api/?name=Comprador+Demo&background=ea580c&color=fff&size=200',
            emailVerified: true,
            provider: 'manual',
            points: 5,
            isOnline: false,
            phone: '+0987654321',
            phoneVerified: false
        }
    },
    {
        email: 'admin@jolub.com',
        password: '123456',
        displayName: 'Administrador JOLUB',
        role: 'admin',
        firestoreData: {
            name: 'Administrador JOLUB',
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff&size=200',
            emailVerified: true,
            provider: 'manual',
            points: 0,
            isOnline: false,
            role: 'admin'
        }
    }
];

async function createUser(userData: typeof USERS_TO_CREATE[0]) {
    try {
        // Verificar si ya existe
        try {
            const existingUser = await auth.getUserByEmail(userData.email);
            console.log(`   ⚠️ Usuario ya existe: ${userData.email} (${existingUser.uid})`);

            // Actualizar Firestore con rol si es admin
            if (userData.role === 'admin') {
                await db.collection('users').doc(existingUser.uid).set({
                    ...userData.firestoreData,
                    uid: existingUser.uid,
                    uniqueId: `USER-${existingUser.uid.slice(-10).toUpperCase()}`,
                    email: userData.email,
                    role: 'admin',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log(`   ✅ Rol admin actualizado en Firestore`);
            }
            return;
        } catch (e: any) {
            if (e.code !== 'auth/user-not-found') throw e;
        }

        // Crear usuario en Firebase Auth
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
            emailVerified: true
        });

        console.log(`   ✅ Usuario creado en Auth: ${userData.email} (${userRecord.uid})`);

        // Crear/actualizar documento en Firestore
        const firestoreDoc = {
            ...userData.firestoreData,
            uid: userRecord.uid,
            uniqueId: `USER-${userRecord.uid.slice(-10).toUpperCase()}`,
            email: userData.email,
            role: userData.role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userRecord.uid).set(firestoreDoc);
        console.log(`   ✅ Documento Firestore creado`);

    } catch (error: any) {
        console.error(`   ❌ Error creando ${userData.email}:`, error.message);
    }
}

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🔐 CREAR USUARIOS EN FIREBASE AUTH');
    console.log('═'.repeat(60));

    for (const user of USERS_TO_CREATE) {
        console.log(`\n📤 Procesando: ${user.email}`);
        await createUser(user);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ ¡USUARIOS CREADOS CON ÉXITO!');
    console.log('═'.repeat(60));
    console.log('\n📋 Credenciales:');
    console.log('   • vendedor@jolub.com / demo1234');
    console.log('   • comprador@jolub.com / demo1234');
    console.log('   • admin@jolub.com / 123456\n');

    process.exit(0);
}

main();
