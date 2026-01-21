const dotenv = require('dotenv');
dotenv.config();
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('JWT_SECRET starts with:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 3) : 'N/A');
