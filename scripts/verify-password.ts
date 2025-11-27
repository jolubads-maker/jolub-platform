import bcrypt from 'bcryptjs';

const password = 'dinero2025';
// Hash from logs: $2b$10$L256DdGozgZxib7X9g60c.o... (truncated in logs, need full hash from DB ideally, but we can check if a new hash works)

async function verify() {
    console.log('--- Password Verification Debugger ---');
    console.log(`Testing password: "${password}"`);
    
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, 10);
    
    console.log(`Generated new hash: ${newHash}`);
    
    const isMatch = await bcrypt.compare(password, newHash);
    console.log(`Self-verification match: ${isMatch}`);
    
    console.log('--- Instructions ---');
    console.log('If the stored hash in DB starts with $2b$10$L256DdGozgZxib7X9g60c... and fails, it means the stored password is NOT "dinero2025" or was hashed differently.');
}

verify();
