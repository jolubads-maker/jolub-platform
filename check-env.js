import 'dotenv/config';
import { writeFileSync } from 'fs';

const output = {
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 30) || 'NOT SET',
    DATABASE_URL_host: process.env.DATABASE_URL?.match(/@([^/]+)/)?.[1] || 'NO MATCH',
    ALL_ENV_KEYS: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PAYPAL') || k.includes('TWILIO') || k.includes('CLOUDINARY'))
};

console.log(JSON.stringify(output, null, 2));
writeFileSync('env-check.json', JSON.stringify(output, null, 2));
console.log('\n✅ Output saved to env-check.json');
