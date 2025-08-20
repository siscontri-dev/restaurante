import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/services/product-service'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessId = url.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const result = await getProducts(Number(businessId), page, pageSize)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting public products:', error);
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener productos' }, { status: 500 })
  }
} 