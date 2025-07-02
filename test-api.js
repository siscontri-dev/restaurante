const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test-database',
  method: 'GET'
};

console.log('🔍 Probando API en http://localhost:3000/api/test-database...');

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('📡 Respuesta:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('📡 Respuesta raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Error:', error.message);
});

req.end(); 