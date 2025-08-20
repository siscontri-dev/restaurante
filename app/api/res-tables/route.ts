import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    // Decodificar el token para obtener el business_id
    const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
    const businessId = decoded.business_id

    // Obtener el location_id automáticamente del business_id
    const businessLocation = await executePosQuery(
      `SELECT id FROM business_locations WHERE business_id = ? LIMIT 1`,
      [businessId]
    ) as any[]

    if (!businessLocation || businessLocation.length === 0) {
      return NextResponse.json({ 
        success: true, 
        tables: [],
        message: 'No se encontró ubicación para esta empresa'
      })
    }

    const locationId = businessLocation[0].id

    // Consultar mesas reales de la base de datos usando el location_id obtenido
    const tables = await executePosQuery(
      `SELECT * FROM res_tables WHERE location_id = ? AND deleted_at IS NULL`,
      [locationId]
    )

    return NextResponse.json({
      success: true,
      tables: tables || [],
      business_id: businessId,
      location_id: locationId
    })

  } catch (error) {
    console.error('❌ Error consultando mesas:', error)
    // Si hay error, devolver array vacío en lugar de error 500
    return NextResponse.json({
      success: true,
      tables: []
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    // Decodificar el token para obtener el business_id
    const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number, user_id: number }
    const businessId = decoded.business_id

    // Obtener el location_id automáticamente del business_id
    const businessLocation = await executePosQuery(
      `SELECT id FROM business_locations WHERE business_id = ? LIMIT 1`,
      [businessId]
    ) as any[]

    if (!businessLocation || businessLocation.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontró ubicación para esta empresa'
      }, { status: 400 })
    }

    const locationId = businessLocation[0].id

    // Obtener datos de la nueva mesa
    const body = await request.json()
    const { name, seats = 4 } = body

    if (!name) {
      return NextResponse.json({ error: 'Nombre de mesa requerido' }, { status: 400 })
    }

    console.log('📝 Creando mesa:', { name, locationId, seats, businessId })

    // Insertar nueva mesa en la base de datos
    const result = await executePosQuery(
      `INSERT INTO res_tables (business_id, name, location_id, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [businessId, name, locationId, `Mesa con ${seats} asientos`, decoded.user_id || decoded.business_id || 1]
    ) as any

    console.log('✅ Mesa creada exitosamente:', result.insertId)

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Mesa creada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error creando mesa:', error)
    return NextResponse.json({
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
} 