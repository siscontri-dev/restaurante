import { executePosQuery, posPool } from '../database'
import mysql from 'mysql2/promise'

export interface Product {
  id?: number
  name: string
  sku: string
  sell_price_inc_tax: number
  image: string | null
  product_description: string | null
  business_id: number
  not_for_selling: number
  order_area_id?: number | null
}

interface ProductQueryResult {
  products: Product[]
  total: number
}

// Función helper para manejar errores de autenticación
function handleAuthError(error: any): never {
  console.error('❌ Error de autenticación:', error)
  throw new Error('Error de autenticación')
}

export async function getProducts(businessId: number, page: number = 1, pageSize: number = 20): Promise<ProductQueryResult> {
  const offset = (page - 1) * pageSize
  
  const [products, [{ total }]] = await Promise.all([
    executePosQuery(
      `SELECT DISTINCT 
         p.id, 
         p.name, 
         p.sku, 
         v.sell_price_inc_tax, 
         p.image, 
         p.product_description, 
         p.business_id, 
         p.not_for_selling, 
         p.order_area_id
       FROM products p
       JOIN variations v ON p.id = v.product_id
       WHERE p.business_id = ?
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [businessId, pageSize, offset]
    ) as Promise<Product[]>,
    executePosQuery(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM products p
       JOIN variations v ON p.id = v.product_id
       WHERE p.business_id = ?`,
      [businessId]
    ) as Promise<[{ total: number }]>
  ])

  return { 
    products: products.map(product => ({
      ...product,
      image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg',
      order_area_id: product.order_area_id ?? null
    })),
    total: total || 0 
  }
}

export async function getProductsByBusinessId(businessId: number, limit = 20, offset = 0): Promise<Product[]> {
  try {
    const query = `
      SELECT DISTINCT 
        p.id, 
        p.name, 
        p.sku, 
        v.sell_price_inc_tax, 
        p.image, 
        p.product_description, 
        p.business_id, 
        p.not_for_selling, 
        p.order_area_id
      FROM products p
      LEFT JOIN variations v ON p.id = v.product_id
      WHERE p.business_id = ?
        AND p.not_for_selling = 1
        AND p.is_inactive = 0
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `
    console.log('🔍 Ejecutando query:', query)
    console.log('📊 Parámetros:', [businessId, limit, offset])
    
    const rows = await executePosQuery(query, [businessId, limit, offset]) as any[]
    console.log('📦 Resultados crudos:', JSON.stringify(rows, null, 2))
    
    const mappedProducts = rows.map(row => ({
      id: row.id,
      name: row.name || 'Sin nombre',
      sku: row.sku || 'SIN-SKU',
      sell_price_inc_tax: parseFloat(row.sell_price_inc_tax) || 0,
      image: row.image && row.image.trim() !== '' ? row.image : '/placeholder.svg',
      product_description: row.product_description || null,
      business_id: row.business_id,
      not_for_selling: row.not_for_selling,
      order_area_id: row.order_area_id ?? null
    }))
    
    console.log('✅ Total productos:', mappedProducts.length)
    return mappedProducts
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error)
    return []
  }
}

export async function createProduct(data: Omit<Product, 'id'>) {
  const connection = await posPool.getConnection()
  
  try {
    await connection.beginTransaction()

    // 1. Crear el producto base
    console.log('🔧 Ejecutando INSERT con order_area_id:', data.order_area_id)
    const [productResult] = await connection.execute(
      `INSERT INTO products (name, sku, image, product_description, business_id, not_for_selling, order_area_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.sku, data.image, data.product_description, data.business_id, data.not_for_selling, data.order_area_id]
    ) as any

    const productId = productResult.insertId

    // 2. Crear una entrada en product_variations (dummy)
    const [pvResult] = await connection.execute(
      `INSERT INTO product_variations (product_id, name, is_dummy)
       VALUES (?, 'DUMMY', 1)`,
      [productId]
    ) as any

    const pvId = pvResult.insertId

    // 3. Crear la variación
    await connection.execute(
      `INSERT INTO variations (product_id, product_variation_id, sell_price_inc_tax)
       VALUES (?, ?, ?)`,
      [productId, pvId, data.sell_price_inc_tax]
    )

    await connection.commit()
    return productId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function updateProduct(id: number, data: Partial<Product>) {
  // Se refactoriza para usar el helper executePosQuery que gestiona la conexión
  // de forma más robusta, eliminando la gestión manual de transacciones que causaba el error.

    // 1. Actualizar el producto base
    console.log('🔧 Ejecutando UPDATE con order_area_id:', data.order_area_id)
  await executePosQuery(
      `UPDATE products 
       SET name = COALESCE(?, name),
           sku = COALESCE(?, sku),
           image = COALESCE(?, image),
         product_description = COALESCE(?, product_description),
         not_for_selling = COALESCE(?, not_for_selling),
         order_area_id = COALESCE(?, order_area_id)
       WHERE id = ?`,
    [
      data.name ?? null, 
      data.sku ?? null, 
      data.image ?? null, 
      data.product_description ?? null, 
      data.not_for_selling ?? null, 
      data.order_area_id ?? null,
      id
    ]
    )

    // 2. Si hay precio, actualizar la variación
    if (data.sell_price_inc_tax !== undefined) {
    await executePosQuery(
      `UPDATE variations SET sell_price_inc_tax = ? WHERE product_id = ?`,
        [data.sell_price_inc_tax, id]
      )
    }
    return true
}

export async function deleteProduct(id: number) {
  const connection = await posPool.getConnection()
  
  try {
    await connection.beginTransaction()

    // 1. Eliminar las variaciones
    await connection.execute(
      `DELETE v FROM variations v
       JOIN product_variations pv ON pv.id = v.product_variation_id
       WHERE v.product_id = ?`,
      [id]
    )

    // 2. Eliminar las entradas de product_variations
    await connection.execute(
      `DELETE FROM product_variations WHERE product_id = ?`,
      [id]
    )

    // 3. Eliminar el producto
    await connection.execute(
      `DELETE FROM products WHERE id = ?`,
      [id]
    )

    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const products = await executePosQuery('SELECT * FROM products WHERE id = ?', [id]) as Product[]
  return products[0] || null
} 