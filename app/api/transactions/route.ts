import { NextResponse } from 'next/server'
import { executePosQuery } from '@/lib/database'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number; userId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number; user_id: number }
  
  if (typeof decoded.business_id === 'undefined' || typeof decoded.user_id === 'undefined') {
    throw new Error('Token inválido: business_id o user_id no encontrado')
  }
  
  return { businessId: decoded.business_id, userId: decoded.user_id }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const { 
      location_id, 
      contact_id, 
      invoice_number, 
      prefix, 
      final_total, 
      res_table_id,
      items = []
    } = await req.json()
    
    console.log('📝 Datos recibidos:', { location_id, contact_id, invoice_number, prefix, final_total, businessId, userId })
    
    if (!location_id || !contact_id || invoice_number === undefined || !prefix || final_total === undefined) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: location_id, contact_id, invoice_number, prefix, final_total' 
      }, { status: 400 })
    }

    // Crear la factura concatenando prefix + number
    const invoice_no = `${prefix}${invoice_number}`
    
    // Fecha y hora actual de Bogotá, Colombia (UTC-5)
    const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000))
    const transaction_date = bogotaTime.toISOString().slice(0, 19).replace('T', ' ')
    const created_at = transaction_date
    const updated_at = transaction_date

    console.log('💾 Datos a insertar:', {
      businessId,
      location_id,
      contact_id,
      invoice_number,
      invoice_no,
      transaction_date,
      final_total,
      userId
    })

    // Insertar en la tabla transactions con campos básicos primero
    console.log('🔄 Ejecutando INSERT...')
    
    const result = await executePosQuery(
      `INSERT INTO transactions (
        business_id,
        location_id,
        type,
        status,
        payment_status,
        contact_id,
        number,
        invoice_no,
        transaction_date,
        final_total,
        created_by,
        created_at,
        updated_at,
        resolution,
        prefix,
        res_table_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId,           // business_id
        location_id,          // location_id
        'sell',               // type
        'final',              // status
        'paid',               // payment_status
        contact_id,           // contact_id
        invoice_number,       // number
        invoice_no,           // invoice_no (prefix + number)
        transaction_date,     // transaction_date (hora Bogotá)
        final_total,          // final_total
        userId,               // created_by
        created_at,           // created_at (hora Bogotá)
        updated_at,           // updated_at (hora Bogotá)
        'POSE',               // resolution (prefijo del POS)
        'POSE',               // prefix (prefijo del POS)
        res_table_id || null  // res_table_id (id de la mesa)
      ]
    ) as any
    
    console.log('✅ INSERT exitoso, result:', result)

    // Guardar líneas de productos en transaction_sell_lines
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        // Buscar el variation_id correspondiente al product_id
        const variations = await executePosQuery(
          'SELECT * FROM variations WHERE product_id = ?',
          [item.id]
        ) as any[]
        const variation = Array.isArray(variations) && variations.length > 0 ? variations[0] : null
        const variation_id = variation ? variation.id : null

        // Calcular precios e impuestos
        const quantity = item.quantity
        const unit_price_inc_tax = item.price
        // Suponiendo que el impuesto es 19% si no hay info en variation
        const tax_percent = variation && variation.tax_percent ? parseFloat(variation.tax_percent) : 19
        const unit_price = +(unit_price_inc_tax / (1 + tax_percent / 100)).toFixed(2)
        const unit_price_before_discount = unit_price
        const item_tax = +((unit_price_inc_tax - unit_price) * quantity).toFixed(2)

        await executePosQuery(
          `INSERT INTO transaction_sell_lines (
            transaction_id,
            product_id,
            variation_id,
            quantity,
            unit_price,
            unit_price_before_discount,
            unit_price_inc_tax,
            item_tax,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            result.insertId,
            item.id,
            variation_id,
            quantity,
            unit_price,
            unit_price_before_discount,
            unit_price_inc_tax,
            item_tax,
            created_at,
            updated_at
          ]
        )
      }
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.insertId,
      invoice_no: invoice_no,
      transaction_date: transaction_date
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al crear transacción' 
    }, { status: 500 })
  }
} 