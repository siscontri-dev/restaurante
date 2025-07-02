import { NextResponse } from 'next/server'
import { getProductsByBusinessId, getProductById } from '@/lib/services/product-service'
import { executePosQuery } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { createProduct, updateProduct, deleteProduct, getProducts } from '@/lib/services/product-service'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
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
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const search = url.searchParams.get('search')

    let result
    if (search) {
      // Realizar búsqueda
      const products = await executePosQuery(
        `SELECT DISTINCT 
           p.id, 
           p.name, 
           p.sku, 
           v.sell_price_inc_tax, 
           p.image, 
           p.product_description, 
           p.business_id, 
           p.not_for_selling
         FROM products p
         JOIN variations v ON p.id = v.product_id
         WHERE p.business_id = ?
           AND (p.name LIKE ? OR p.sku LIKE ?)
         ORDER BY p.id DESC`,
        [businessId, `%${search}%`, `%${search}%`]
      ) as any[]
      
      result = {
        products: products.map(product => ({
          ...product,
          image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg'
        })),
        total: products.length
      }
    } else {
      result = await getProducts(businessId, page, pageSize)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting products:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener productos' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const data = await req.json()
    console.log('📦 Datos recibidos en POST:', JSON.stringify(data, null, 2))
    const productData = {
      name: data.name,
      sku: data.sku,
      sell_price_inc_tax: data.sell_price_inc_tax,
      image: data.image,
      product_description: data.description || null,
      business_id: businessId,
      not_for_selling: 1,
      order_area_id: data.order_area_id || null
    }
    console.log('🔧 ProductData a guardar:', JSON.stringify(productData, null, 2))

    const productId = await createProduct(productData)
    return NextResponse.json({ success: true, productId })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al crear producto' 
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const data = await req.json()
    console.log('📦 Datos recibidos en PUT:', JSON.stringify(data, null, 2))
    if (!data.id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }

    const productData = {
      name: data.name,
      sku: data.sku,
      sell_price_inc_tax: data.sell_price_inc_tax,
      image: data.image,
      description: data.description,
      order_area_id: data.order_area_id || null
    }
    console.log('🔧 ProductData a actualizar:', JSON.stringify(productData, null, 2))

    await updateProduct(data.id, productData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al actualizar producto' 
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    verifyToken(authHeader)

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }

    await deleteProduct(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al eliminar producto' 
    }, { status: 500 })
  }
} 