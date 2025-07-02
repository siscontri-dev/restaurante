import { NextResponse } from 'next/server'
import { executePosQuery } from '@/lib/database'

// GET: Listar todas las áreas
export async function GET() {
  const areas = await executePosQuery('SELECT id, name FROM order_areas')
  return NextResponse.json({ areas })
}

// POST: Agregar área
export async function POST(req) {
  try {
    const { name, business_location_id } = await req.json()
    if (!name || !business_location_id) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    await executePosQuery('INSERT INTO order_areas (name, business_location_id) VALUES (?, ?)', [name, business_location_id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error agregando área:', error)
    return NextResponse.json({ error: error.message || 'Error al agregar área' }, { status: 500 })
  }
}

// PUT: Editar área
export async function PUT(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { name } = await req.json()
  if (!id || !name) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  await executePosQuery('UPDATE order_areas SET name = ? WHERE id = ?', [name, id])
  return NextResponse.json({ success: true })
}

// DELETE: Eliminar área
export async function DELETE(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
  await executePosQuery('DELETE FROM order_areas WHERE id = ?', [id])
  return NextResponse.json({ success: true })
} 