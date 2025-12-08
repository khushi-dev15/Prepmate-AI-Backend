import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
  console.log('\n--- PrepMate AI: Environment setup helper ---\n');
  console.log('This will create or overwrite the file: backend/.env');
  console.log('If you do not want to expose your credentials, stop now.\n');

  const mongodb = await question('Enter MongoDB connection string (mongodb+srv://... or mongodb://...): ');
  const jwt = await question('Enter JWT_SECRET (a long random string): ');
  const gemini = await question('Enter GEMINI_API_KEY (optional, press enter to skip): ');
  const port = await question('Enter PORT (default 5000): ');
  const debug = await question('Enable DEBUG_DB to print full DB URI on startup? (true/false) [false]: ');

  const content = [];
  content.push(`MONGODB_URI=${mongodb || 'mongodb://localhost:27017/prepmate'}`);
  content.push(`JWT_SECRET=${jwt || 'replace_with_a_strong_secret'}`);
  content.push(`GEMINI_API_KEY=${gemini || ''}`);
  content.push(`PORT=${port || '5000'}`);
  if ((debug || 'false').toLowerCase() === 'true') {
    content.push('DEBUG_DB=true');
  }

  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, content.join('\n') + '\n', { encoding: 'utf8', flag: 'w' });

  console.log('\nWrote file:', envPath);
  console.log('Please restart the backend:');
  console.log('  cd backend');
  console.log('  npm run dev');

  rl.close();
}

main().catch(err => {
  console.error('Error in setupEnv:', err);
  rl.close();
});
