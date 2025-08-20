import { executePosQuery } from '../database'

export interface TaxRate {
  id: number
  name: string
  amount: number
  is_tax_group: number
  created_at: string
  updated_at: string
}

export async function getTaxRates(businessId?: number): Promise<TaxRate[]> {
  try {
    let query = `
      SELECT id, name, amount, is_tax_group, created_at, updated_at
      FROM tax_rates
    `
    
    const params: any[] = []
    
    if (businessId) {
      query += ` WHERE business_id = ?`
      params.push(businessId)
    }
    
    query += ` ORDER BY name ASC`
    
    const taxRates = await executePosQuery(query, params) as TaxRate[]
    return taxRates || []
  } catch (error) {
    console.error('Error al obtener tasas de impuestos:', error)
    return []
  }
}

export async function getTaxRateById(id: number): Promise<TaxRate | null> {
  try {
    const query = `
      SELECT id, name, amount, is_tax_group, created_at, updated_at
      FROM tax_rates
      WHERE id = ?
    `
    
    const taxRates = await executePosQuery(query, [id]) as TaxRate[]
    return taxRates.length > 0 ? taxRates[0] : null
  } catch (error) {
    console.error('Error al obtener tasa de impuesto por ID:', error)
    return null
  }
} 