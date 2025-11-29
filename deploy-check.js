import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Iniciando verificación de despliegue...');

// 1. Verificar variables de entorno críticas
const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_UPLOAD_PRESET'
];

const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.warn('⚠️ No se encontró archivo .env. Asegúrate de que las variables de entorno estén configuradas en el servidor.');
} else {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const missingVars = requiredEnvVars.filter(v => !envContent.includes(v));

    if (missingVars.length > 0) {
        console.error(`❌ Faltan variables de entorno críticas: ${missingVars.join(', ')}`);
        process.exit(1);
    }
    console.log('✅ Variables de entorno verificadas.');
}

// 2. Verificar TypeScript (sin emitir archivos)
try {
    console.log('Checking TypeScript types...');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript check passed.');
} catch (error) {
    console.error('❌ Error en verificación de TypeScript. Corrige los errores antes de desplegar.');
    process.exit(1);
}

// 3. Verificar Build
try {
    console.log('Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build exitoso.');
} catch (error) {
    console.error('❌ Error en el build.');
    process.exit(1);
}

console.log('🚀 ¡Todo listo para desplegar!');
process.exit(0);
