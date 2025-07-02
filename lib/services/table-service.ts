import { executePosQuery } from '../database'
import type { Table, TableOrder } from '../../app/context/table-context'

export interface DatabaseTable {
  id: number
  number: number
  x: number
  y: number
  width: number
  height: number
  seats: number
  status: string
  shape: string
  assignedWaiter: string | null
  section: string | null
  location: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTableOrder {
  id: string
  tableId: number
  items: string // JSON string
  total: number
  status: string
  orderType: string
  waiter: string | null
  customerInfo: string | null // JSON string
  bills: string | null // JSON string
  splitMode: boolean
  printedAreas: string | null // JSON string
  createdAt: Date
  updatedAt: Date
}

export class TableService {
  // Obtener todas las mesas activas
  static async getAllTables(): Promise<Table[]> {
    try {
      const query = `
        SELECT id, number, x, y, width, height, seats, status, shape, 
               assignedWaiter, section, location, notes, isActive, createdAt, updatedAt
        FROM tables 
        WHERE isActive = 1 
        ORDER BY number
      `
      const rows = await executePosQuery(query) as DatabaseTable[]
      
      return rows.map(row => ({
        id: row.id,
        number: row.number,
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
        seats: row.seats,
        status: row.status as Table['status'],
        shape: row.shape as 'rectangle' | 'circle',
        assignedWaiter: row.assignedWaiter || undefined,
        currentOrder: undefined, // Se cargará por separado si es necesario
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isActive: row.isActive,
        metadata: {
          location: row.location || undefined,
          section: row.section || undefined,
          notes: row.notes || undefined
        }
      }))
    } catch (error) {
      console.error('Error obteniendo mesas:', error)
      throw error
    }
  }

  // Obtener una mesa por ID
  static async getTableById(id: number): Promise<Table | null> {
    try {
      const query = `
        SELECT id, number, x, y, width, height, seats, status, shape, 
               assignedWaiter, section, location, notes, isActive, createdAt, updatedAt
        FROM tables 
        WHERE id = ? AND isActive = 1
      `
      const rows = await executePosQuery(query, [id]) as DatabaseTable[]
      
      if (rows.length === 0) return null
      
      const row = rows[0]
      return {
        id: row.id,
        number: row.number,
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
        seats: row.seats,
        status: row.status as Table['status'],
        shape: row.shape as 'rectangle' | 'circle',
        assignedWaiter: row.assignedWaiter || undefined,
        currentOrder: undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isActive: row.isActive,
        metadata: {
          location: row.location || undefined,
          section: row.section || undefined,
          notes: row.notes || undefined
        }
      }
    } catch (error) {
      console.error('Error obteniendo mesa por ID:', error)
      throw error
    }
  }

  // Crear una nueva mesa
  static async createTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const query = `
        INSERT INTO tables (number, x, y, width, height, seats, status, shape, 
                          assignedWaiter, section, location, notes, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `
      const result = await executePosQuery(query, [
        table.number,
        table.x,
        table.y,
        table.width,
        table.height,
        table.seats,
        table.status,
        table.shape,
        table.assignedWaiter || null,
        table.metadata?.section || null,
        table.metadata?.location || null,
        table.metadata?.notes || null
      ]) as any
      
      return result.insertId
    } catch (error) {
      console.error('Error creando mesa:', error)
      throw error
    }
  }

  // Actualizar una mesa
  static async updateTable(id: number, updates: Partial<Table>): Promise<boolean> {
    try {
      const fields = []
      const values = []
      
      if (updates.number !== undefined) {
        fields.push('number = ?')
        values.push(updates.number)
      }
      if (updates.x !== undefined) {
        fields.push('x = ?')
        values.push(updates.x)
      }
      if (updates.y !== undefined) {
        fields.push('y = ?')
        values.push(updates.y)
      }
      if (updates.width !== undefined) {
        fields.push('width = ?')
        values.push(updates.width)
      }
      if (updates.height !== undefined) {
        fields.push('height = ?')
        values.push(updates.height)
      }
      if (updates.seats !== undefined) {
        fields.push('seats = ?')
        values.push(updates.seats)
      }
      if (updates.status !== undefined) {
        fields.push('status = ?')
        values.push(updates.status)
      }
      if (updates.shape !== undefined) {
        fields.push('shape = ?')
        values.push(updates.shape)
      }
      if (updates.assignedWaiter !== undefined) {
        fields.push('assignedWaiter = ?')
        values.push(updates.assignedWaiter || null)
      }
      if (updates.metadata?.section !== undefined) {
        fields.push('section = ?')
        values.push(updates.metadata.section || null)
      }
      if (updates.metadata?.location !== undefined) {
        fields.push('location = ?')
        values.push(updates.metadata.location || null)
      }
      if (updates.metadata?.notes !== undefined) {
        fields.push('notes = ?')
        values.push(updates.metadata.notes || null)
      }
      
      fields.push('updatedAt = NOW()')
      values.push(id)
      
      const query = `
        UPDATE tables 
        SET ${fields.join(', ')}
        WHERE id = ?
      `
      
      const result = await executePosQuery(query, values) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error actualizando mesa:', error)
      throw error
    }
  }

  // Eliminar una mesa (soft delete)
  static async deleteTable(id: number): Promise<boolean> {
    try {
      const query = `
        UPDATE tables 
        SET isActive = 0, updatedAt = NOW()
        WHERE id = ?
      `
      const result = await executePosQuery(query, [id]) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error eliminando mesa:', error)
      throw error
    }
  }

  // Obtener órdenes activas de una mesa
  static async getTableOrders(tableId: number): Promise<TableOrder[]> {
    try {
      const query = `
        SELECT id, tableId, items, total, status, orderType, waiter, 
               customerInfo, bills, splitMode, printedAreas, createdAt, updatedAt
        FROM table_orders 
        WHERE tableId = ? AND status IN ('active', 'split')
        ORDER BY createdAt DESC
      `
      const rows = await executePosQuery(query, [tableId]) as DatabaseTableOrder[]
      
      return rows.map(row => ({
        id: row.id,
        items: JSON.parse(row.items),
        total: Number(row.total),
        status: row.status as TableOrder['status'],
        orderType: row.orderType as 'dine-in' | 'online' | 'presencial',
        waiter: row.waiter || undefined,
        customerInfo: row.customerInfo ? JSON.parse(row.customerInfo) : undefined,
        bills: row.bills ? JSON.parse(row.bills) : [],
        splitMode: row.splitMode,
        printedAreas: row.printedAreas ? JSON.parse(row.printedAreas) : [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }))
    } catch (error) {
      console.error('Error obteniendo órdenes de mesa:', error)
      throw error
    }
  }

  // Crear una nueva orden para una mesa
  static async createTableOrder(tableId: number, order: Omit<TableOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const query = `
        INSERT INTO table_orders (tableId, items, total, status, orderType, waiter, 
                                 customerInfo, bills, splitMode, printedAreas, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `
      const result = await executePosQuery(query, [
        tableId,
        JSON.stringify(order.items),
        order.total,
        order.status,
        order.orderType,
        order.waiter || null,
        order.customerInfo ? JSON.stringify(order.customerInfo) : null,
        JSON.stringify(order.bills),
        order.splitMode,
        JSON.stringify(order.printedAreas)
      ]) as any
      
      return result.insertId
    } catch (error) {
      console.error('Error creando orden de mesa:', error)
      throw error
    }
  }

  // Actualizar una orden de mesa
  static async updateTableOrder(orderId: string, updates: Partial<TableOrder>): Promise<boolean> {
    try {
      const fields = []
      const values = []
      
      if (updates.items !== undefined) {
        fields.push('items = ?')
        values.push(JSON.stringify(updates.items))
      }
      if (updates.total !== undefined) {
        fields.push('total = ?')
        values.push(updates.total)
      }
      if (updates.status !== undefined) {
        fields.push('status = ?')
        values.push(updates.status)
      }
      if (updates.orderType !== undefined) {
        fields.push('orderType = ?')
        values.push(updates.orderType)
      }
      if (updates.waiter !== undefined) {
        fields.push('waiter = ?')
        values.push(updates.waiter || null)
      }
      if (updates.customerInfo !== undefined) {
        fields.push('customerInfo = ?')
        values.push(updates.customerInfo ? JSON.stringify(updates.customerInfo) : null)
      }
      if (updates.bills !== undefined) {
        fields.push('bills = ?')
        values.push(JSON.stringify(updates.bills))
      }
      if (updates.splitMode !== undefined) {
        fields.push('splitMode = ?')
        values.push(updates.splitMode)
      }
      if (updates.printedAreas !== undefined) {
        fields.push('printedAreas = ?')
        values.push(JSON.stringify(updates.printedAreas))
      }
      
      fields.push('updatedAt = NOW()')
      values.push(orderId)
      
      const query = `
        UPDATE table_orders 
        SET ${fields.join(', ')}
        WHERE id = ?
      `
      
      const result = await executePosQuery(query, values) as any
      return result.affectedRows > 0
    } catch (error) {
      console.error('Error actualizando orden de mesa:', error)
      throw error
    }
  }

  // Obtener mesas por estado
  static async getTablesByStatus(status: Table['status']): Promise<Table[]> {
    try {
      const query = `
        SELECT id, number, x, y, width, height, seats, status, shape, 
               assignedWaiter, section, location, notes, isActive, createdAt, updatedAt
        FROM tables 
        WHERE isActive = 1 AND status = ?
        ORDER BY number
      `
      const rows = await executePosQuery(query, [status]) as DatabaseTable[]
      
      return rows.map(row => ({
        id: row.id,
        number: row.number,
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
        seats: row.seats,
        status: row.status as Table['status'],
        shape: row.shape as 'rectangle' | 'circle',
        assignedWaiter: row.assignedWaiter || undefined,
        currentOrder: undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isActive: row.isActive,
        metadata: {
          location: row.location || undefined,
          section: row.section || undefined,
          notes: row.notes || undefined
        }
      }))
    } catch (error) {
      console.error('Error obteniendo mesas por estado:', error)
      throw error
    }
  }
} 