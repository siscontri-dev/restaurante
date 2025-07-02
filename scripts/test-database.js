const mysql = require('mysql2/promise');

// Configuración de las bases de datos
const dbConfigs = {
  pos: {
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_pos37',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  contable: {
    host: 'localhost',
    port: 3306,
    user: 'siscontr_contable',
    password: 'Contable*2021',
    database: 'siscontr_contable',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  ventas: {
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_ventas',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  cosurca: {
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_cosurca',
    charset: 'utf8mb4',
    timezone: '+00:00'
  }
};

async function testConnection(config, name) {
  let connection;
  try {
    console.log(`\n🔍 Probando conexión a ${name}...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    connection = await mysql.createConnection(config);
    await connection.ping();
    
    console.log(`✅ Conexión exitosa a ${name}`);
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log(`✅ Query de prueba exitosa: ${JSON.stringify(rows[0])}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error conectando a ${name}:`, error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testAllConnections() {
  console.log('🚀 Iniciando pruebas de conexión a bases de datos...\n');
  
  const results = {};
  
  for (const [name, config] of Object.entries(dbConfigs)) {
    results[name] = await testConnection(config, name);
  }
  
  console.log('\n📊 Resumen de resultados:');
  console.log('========================');
  
  for (const [name, success] of Object.entries(results)) {
    const status = success ? '✅ CONECTADO' : '❌ FALLÓ';
    console.log(`${name.padEnd(10)}: ${status}`);
  }
  
  const allConnected = Object.values(results).every(result => result);
  
  if (allConnected) {
    console.log('\n🎉 ¡Todas las conexiones son exitosas!');
  } else {
    console.log('\n⚠️  Algunas conexiones fallaron. Revisa la configuración.');
  }
  
  return results;
}

// Ejecutar las pruebas
if (require.main === module) {
  testAllConnections()
    .then(() => {
      console.log('\n✨ Pruebas completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error durante las pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testAllConnections, dbConfigs }; 