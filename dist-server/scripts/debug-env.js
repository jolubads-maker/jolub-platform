import 'dotenv/config';
console.log('--- DEBUG ENV ---');
console.log('CWD:', process.cwd());
console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'LOADED (' + process.env.R2_ACCOUNT_ID.substring(0, 3) + '...)' : 'NOT LOADED');
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? 'LOADED' : 'NOT LOADED');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'NOT LOADED');
console.log('--- END DEBUG ---');
