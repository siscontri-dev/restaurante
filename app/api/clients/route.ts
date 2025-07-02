import { NextResponse } from 'next/server'
import { executePosQuery } from '@/lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token y obtener business_id
function verifyToken(authHeader: string | null): { businessId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autenticación requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
  
  if (typeof decoded.business_id === 'undefined') {
    throw new Error('Token inválido: business_id no encontrado')
  }
  
  return { businessId: decoded.business_id }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const url = new URL(req.url)
    const isDefault = url.searchParams.get('default') === '1'
    let query = `
      SELECT 
        c.id,
        COALESCE(NULLIF(TRIM(c.name), ''), c.supplier_business_name) as name,
        c.supplier_business_name, 
        c.contact_id 
      FROM contacts c 
      WHERE c.business_id = ?
    `
    if (isDefault) {
      query += ' AND c.is_default = 1'
    }
    const clients = await executePosQuery(query, [businessId])
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 })
  }
} 