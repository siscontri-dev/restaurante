import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const location_id = searchParams.get('location_id')

    if (!location_id) {
      return NextResponse.json({ error: 'location_id requerido' }, { status: 400 })
    }

    // Consultar mesas reales de la base de datos usando el location_id recibido
    const tables = await executePosQuery(
      `SELECT * FROM res_tables WHERE location_id = ? AND deleted_at IS NULL`,
      [location_id]
    )

    return NextResponse.json({
      success: true,
      tables: tables || []
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