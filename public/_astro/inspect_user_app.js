const fs = require('fs');
const app = fs.readFileSync('./app.js', 'utf8');
console.log('User app.js length:', app.length);
console.log('User app.js snippet:\n', app.slice(0, 1500));
