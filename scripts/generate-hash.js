// Generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123'; // Default password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Password hash:', hash);
});
