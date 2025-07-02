import { NextResponse } from 'next/server'
import { testConnections, executePosQuery } from '@/lib/database'

export async function GET(req: Request) {
  try {
    console.log('🔍 Probando conexiones a bases de datos...')
    
    // Probar todas las conexiones
    const connectionResults = await testConnections()
    
    // Consulta simple para validar conexión a la tabla business
    let businessName = null
    let businessError = null
    
    try {
      const query = 'SELECT name FROM business WHERE id = ?'
      const rows = await executePosQuery(query, [165]) as any[]
      
      if (rows.length > 0) {
        businessName = rows[0].name
        console.log(`✅ Empresa encontrada: ${businessName}`)
      } else {
        businessError = 'No se encontró la empresa con id=165'
        console.log('❌ No se encontró la empresa con id=165')
      }
    } catch (error) {
      businessError = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error consultando tabla business:', error)
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      connections: connectionResults,
      business: {
        id: 165,
        name: businessName,
        error: businessError
      },
      message: 'Conexión a base de datos probada exitosamente'
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('💥 Error en API test-database:', error)
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al probar conexión a base de datos'
    }, { status: 500 })
  }
}

export async function GETStructure(req: Request) {
  try {
    // Obtener la estructura de la tabla products
    console.log('🔍 Obteniendo estructura de la tabla products...')
    const structure = await executePosQuery('SHOW COLUMNS FROM products') as any[]
    console.log('✅ Estructura de la tabla:', structure)

    // Obtener una muestra de datos
    console.log('🔍 Obteniendo muestra de datos...')
    const sample = await executePosQuery('SELECT * FROM products LIMIT 1') as any[]
    console.log('✅ Muestra de datos:', sample[0])

    return NextResponse.json({
      success: true,
      structure: structure,
      sampleData: sample[0] || null
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      details: error
    }, { status: 500 })
  }
} 