import { createPasswordHash } from './auth';

const password = process.argv.slice(2).join(' ').trim();

if (!password) {
  // eslint-disable-next-line no-console
  console.error('Usage: npm run admin:hash-password -- "your-password"');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(createPasswordHash(password));
