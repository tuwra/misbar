// Prints an account entry for MISBAR_USERS. Usage: npm run add-user -- <name> <password>
import { hashPassword } from '../lib/auth.mjs';
const [name, password] = process.argv.slice(2);
if (!name || !password || /[:;\s]/.test(name)) { console.error('Usage: npm run add-user -- <name> <password>   (name without spaces, ":" or ";")'); process.exit(1); }
console.log(`${name}:${hashPassword(password)}`);
