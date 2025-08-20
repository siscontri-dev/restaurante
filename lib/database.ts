import mysql from 'mysql2/promise'

// Configuración de las bases de datos
export const dbConfig = {
  // Base de datos principal POS
  pos: {
    host: '148.113.218.187',
    port: 3306,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_pos37',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  // Base de datos de contabilidad (local)
  contable: {
    host: 'localhost',
    port: 3306,
    user: 'siscontr_contable',
    password: 'Contable*2021',
    database: 'siscontr_contable',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  // Base de datos de ventas
  ventas: {
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_ventas',
    charset: 'utf8mb4',
    timezone: '+00:00'
  },
  
  // Base de datos de cosurca
  cosurca: {
    host: '149.56.13.205',
    port: 3307,
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_cosurca',
    charset: 'utf8mb4',
    timezone: '+00:00'
  }
}

// Crear pools de conexión para cada base de datos
export const posPool = mysql.createPool({
  ...dbConfig.pos,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export const contablePool = mysql.createPool({
  ...dbConfig.contable,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export const ventasPool = mysql.createPool({
  ...dbConfig.ventas,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export const cosurcaPool = mysql.createPool({
  ...dbConfig.cosurca,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Función para probar conexiones
export async function testConnections() {
  const results = {
    pos: false,
    contable: false,
    ventas: false,
    cosurca: false
  }

  try {
    const posConnection = await posPool.getConnection()
    await posConnection.ping()
    posConnection.release()
    results.pos = true
    console.log('✅ Conexión POS exitosa')
  } catch (error) {
    console.error('❌ Error conexión POS:', error)
  }

  try {
    const contableConnection = await contablePool.getConnection()
    await contableConnection.ping()
    contableConnection.release()
    results.contable = true
    console.log('✅ Conexión Contable exitosa')
  } catch (error) {
    console.error('❌ Error conexión Contable:', error)
  }

  try {
    const ventasConnection = await ventasPool.getConnection()
    await ventasConnection.ping()
    ventasConnection.release()
    results.ventas = true
    console.log('✅ Conexión Ventas exitosa')
  } catch (error) {
    console.error('❌ Error conexión Ventas:', error)
  }

  try {
    const cosurcaConnection = await cosurcaPool.getConnection()
    await cosurcaConnection.ping()
    cosurcaConnection.release()
    results.cosurca = true
    console.log('✅ Conexión Cosurca exitosa')
  } catch (error) {
    console.error('❌ Error conexión Cosurca:', error)
  }

  return results
}

// Función para cerrar todas las conexiones
export async function closeAllConnections() {
  await posPool.end()
  await contablePool.end()
  await ventasPool.end()
  await cosurcaPool.end()
  console.log('🔌 Todas las conexiones cerradas')
}

// Función helper para ejecutar queries en la base POS
export async function executePosQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await posPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query POS:', error)
    throw error
  }
}

// Función helper para ejecutar queries en la base contable
export async function executeContableQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await contablePool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Contable:', error)
    throw error
  }
}

// Función helper para ejecutar queries en la base ventas
export async function executeVentasQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await ventasPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Ventas:', error)
    throw error
  }
}

// Función helper para ejecutar queries en la base cosurca
export async function executeCosurcaQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await cosurcaPool.execute(query, params)
    return rows
  } catch (error) {
    console.error('Error ejecutando query Cosurca:', error)
    throw error
  }
} 