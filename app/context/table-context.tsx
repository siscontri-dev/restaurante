"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Product } from "./cart-context"

export interface BillItem {
  productId: number
  product: Product
  quantity: number
  assignedTo: string[]
  isShared: boolean
}

export interface Bill {
  id: string
  personName: string
  items: BillItem[]
  subtotal: number
  tax: number
  total: number
  status: "pending" | "paid"
}

export interface TableOrder {
  id: string
  items: Array<Product & { quantity: number }>
  total: number
  createdAt: Date
  status: "active" | "completed" | "cancelled" | "split"
  printedAreas: string[]
  bills: Bill[]
  splitMode: boolean
  waiter?: string
  orderType?: "dine-in" | "online" | "presencial"
  customerInfo?: {
    name: string
    phone: string
    address?: string
    notes: string
  }
}

export interface Table {
  id: number
  number: number
  name: string
  x: number
  y: number
  width: number
  height: number
  seats: number
  status: "available" | "occupied" | "reserved" | "needs-cleaning"
  shape: "rectangle" | "circle"
  currentOrder?: TableOrder
  assignedWaiter?: string
  // Simulación de campos de base de datos
  createdAt?: Date
  updatedAt?: Date
  isActive?: boolean
  metadata?: {
    location?: string
    section?: string
    notes?: string
  }
}

// Definición extendida local de Product para mesas
interface MesaProduct extends Product {
  order_area_id?: number | null
}

interface TableContextType {
  tables: Table[]
  updateTablePosition: (id: number, x: number, y: number) => void
  updateTableStatus: (id: number, status: Table["status"]) => void
  addTable: (table: Omit<Table, "id">) => void
  removeTable: (id: number) => void
  getTableById: (id: number) => Table | undefined
  addProductToTable: (tableId: number, product: Product) => void
  removeProductFromTable: (tableId: number, productId: number) => void
  updateProductQuantityInTable: (tableId: number, productId: number, quantity: number) => void
  completeTableOrder: (tableId: number) => void
  clearTableOrder: (tableId: number) => void
  printOrderByArea: (tableId: number, area: string) => void
  getOrderItemsByArea: (tableId: number) => Record<string, Array<Product & { quantity: number }>>
  assignWaiterToTable: (tableId: number, waiterName: string) => void
  enableSplitMode: (tableId: number) => void
  addPersonToBill: (tableId: number, personName: string) => void
  removePersonFromBill: (tableId: number, personId: string) => void
  assignItemToPerson: (tableId: number, productId: number, personId: string, quantity: number) => void
  shareItemBetweenPeople: (tableId: number, productId: number, personIds: string[], quantity: number) => void
  calculateBillForPerson: (tableId: number, personId: string) => { subtotal: number; tax: number; total: number }
  finalizeSplitBills: (tableId: number) => Bill[]
  createOnlineOrder: (customerInfo: any, items: any[], total: number) => void
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Table[]>([])

  useEffect(() => {
    // Cargar mesas desde la base de datos
    async function fetchTables() {
      try {
        const token = localStorage.getItem('token')
        const selectedLocation = JSON.parse(localStorage.getItem('selectedLocation') || '{}')
        const locationId = selectedLocation.location_id || selectedLocation.id
        
        console.log('🏪 Cargando mesas para ubicación:', { selectedLocation, locationId })
        
        if (!locationId || !token) {
          console.log('⚠️ No hay ubicación o token - mesas no cargadas')
          return
        }

        const res = await fetch(`/api/res-tables?location_id=${locationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          console.error('❌ Error al obtener mesas:', res.status, res.statusText)
          return
        }
        
        const data = await res.json()
        console.log('📋 Mesas obtenidas de la BD:', data)
        
        // Mapear para que cada mesa tenga al menos id y number (usando name como number si es necesario)
        const mappedTables = (data.tables || []).map((t: any, index: number) => ({
          id: t.id,
          number: t.name || t.number || t.id,
          name: t.name || t.number || t.id,
          x: 50 + (index * 120) % 600,
          y: 50 + Math.floor(index / 5) * 120,
          width: 100,
          height: 100,
          seats: 4,
          status: "available" as const,
          shape: "rectangle" as const
        }))
        
        console.log('✅ Mesas mapeadas:', mappedTables)
        setTables(mappedTables)
      } catch (error) {
        console.error('❌ Error cargando mesas desde la base de datos:', error)
      }
    }

    fetchTables()

    // Escuchar cambios en localStorage para actualizar mesas cuando cambie la ubicación
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedLocation') {
        console.log('🔄 Ubicación cambiada, recargando mesas...')
        setTimeout(fetchTables, 500) // Pequeño delay para asegurar que el localStorage se actualice
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const updateTablePosition = (id: number, x: number, y: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, x, y, updatedAt: new Date() } : table
      )
    )
  }

  const updateTableStatus = (id: number, status: Table["status"]) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, status, updatedAt: new Date() } : table
      )
    )
  }

  const addTable = (newTable: Omit<Table, "id">) => {
    const id = Math.max(...tables.map((t) => t.id), 0) + 1
    const tableWithMetadata: Table = {
      ...newTable,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      metadata: {
        section: "Nueva",
        location: "Por definir",
        notes: "Mesa creada automáticamente",
      },
    }

    setTables((prevTables) => [...prevTables, tableWithMetadata])
  }

  const removeTable = (id: number) => {
    setTables((prevTables) => prevTables.filter((table) => table.id !== id))
  }

  const getTableById = (id: number) => {
    return tables.find((table) => table.id === id)
  }

  const assignWaiterToTable = (tableId: number, waiterName: string) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              assignedWaiter: waiterName,
              currentOrder: table.currentOrder
                ? { ...table.currentOrder, waiter: waiterName }
                : undefined,
              updatedAt: new Date(),
            }
          : table
      )
    )
  }

  const addProductToTable = (tableId: number, product: Product) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId) {
          const currentOrder = table.currentOrder || {
            id: `order-${tableId}-${Date.now()}`,
            items: [],
            total: 0,
            createdAt: new Date(),
            status: "active" as const,
            printedAreas: [],
            bills: [],
            splitMode: false,
            waiter: table.assignedWaiter,
            orderType:
              tableId === 999 ? ("online" as const) : tableId === 998 ? ("presencial" as const) : ("dine-in" as const),
          }

          const existingItemIndex = currentOrder.items.findIndex((item) => item.id === product.id)
          let updatedItems

          // Asegura que el producto tenga un precio numérico y el área asignada
          const productWithPrice = {
            ...product,
            sell_price_inc_tax: Number(product.sell_price_inc_tax) || 0,
            order_area_id: (product as any).order_area_id ?? null
          }

          if (existingItemIndex >= 0) {
            updatedItems = currentOrder.items.map((item, index) =>
              index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item,
            )
          } else {
            updatedItems = [...currentOrder.items, { ...productWithPrice, quantity: 1 }]
          }

          const total = updatedItems.reduce((sum, item) => sum + item.sell_price_inc_tax * item.quantity, 0)

          const updatedTable = {
            ...table,
            status: "occupied" as const,
            currentOrder: {
              ...currentOrder,
              items: updatedItems,
              total,
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const removeProductFromTable = (tableId: number, productId: number) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const updatedItems = table.currentOrder.items.filter((item) => item.id !== productId)
          const total = updatedItems.reduce((sum, item) => sum + item.sell_price_inc_tax * item.quantity, 0)

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              items: updatedItems,
              total,
            },
            status: updatedItems.length === 0 ? ("available" as const) : table.status,
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const updateProductQuantityInTable = (tableId: number, productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromTable(tableId, productId)
      return
    }

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const updatedItems = table.currentOrder.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          )
          const total = updatedItems.reduce((sum, item) => sum + item.sell_price_inc_tax * item.quantity, 0)

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              items: updatedItems,
              total,
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const completeTableOrder = (tableId: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: "needs-cleaning" as const,
              currentOrder: table.currentOrder
                ? { ...table.currentOrder, status: "completed" as const }
                : undefined,
              updatedAt: new Date(),
            }
          : table
      )
    )
  }

  const clearTableOrder = (tableId: number) => {
    setTables((prevTables) => {
      const updatedTables = prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: "available" as const,
              currentOrder: undefined,
              updatedAt: new Date(),
            }
          : table
      )
      return updatedTables
    })
  }

  const printOrderByArea = (tableId: number, area: string) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              printedAreas: [...(table.currentOrder.printedAreas || []), area],
            },
            updatedAt: new Date(),
          }
          return updatedTable
        }
        return table
      }),
    )
  }

  const getOrderItemsByArea = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table || !table.currentOrder) return {}

    return table.currentOrder.items.reduce(
      (acc, item) => {
        const prod = item as MesaProduct & { quantity: number }
        let areaName = 'General'
        if (prod.order_area_id) {
          areaName = prod.order_area_id.toString()
        }
        if (!acc[areaName]) {
          acc[areaName] = []
        }
        acc[areaName].push(item)
        return acc
      },
      {} as Record<string, Array<Product & { quantity: number }>>,
    )
  }

  // Funciones de división de cuenta (mantenidas igual)
  const enableSplitMode = (tableId: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              currentOrder: tables.find((t) => t.id === tableId)?.currentOrder
                ? {
                    ...tables.find((t) => t.id === tableId)!.currentOrder!,
                    splitMode: true,
                    status: "split",
                    bills: [],
                  }
                : undefined,
            }
          : table
      )
    )
  }

  const addPersonToBill = (tableId: number, personName: string) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const personId = `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const newBill: Bill = {
            id: personId,
            personName,
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            status: "pending",
          }

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              bills: [...table.currentOrder.bills, newBill],
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const removePersonFromBill = (tableId: number, personId: string) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              bills: table.currentOrder.bills.filter((bill) => bill.id !== personId),
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const assignItemToPerson = (tableId: number, productId: number, personId: string, quantity: number) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const product = table.currentOrder.items.find((item) => item.id === productId)
          if (!product) return table

          const updatedBills = table.currentOrder.bills.map((bill) => {
            if (bill.id === personId) {
              const existingItem = bill.items.find((item) => item.productId === productId)
              let updatedItems

              if (existingItem) {
                updatedItems = bill.items.map((item) =>
                  item.productId === productId ? { ...item, quantity: quantity } : item,
                )
              } else {
                const newBillItem: BillItem = {
                  productId,
                  product,
                  quantity,
                  assignedTo: [personId],
                  isShared: false,
                }
                updatedItems = [...bill.items, newBillItem]
              }

              const subtotal = updatedItems.reduce((sum, item) => sum + item.product.sell_price_inc_tax * item.quantity, 0)
              const tax = subtotal * 0.1
              const total = subtotal + tax

              return {
                ...bill,
                items: updatedItems,
                subtotal,
                tax,
                total,
              }
            }
            return bill
          })

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              bills: updatedBills,
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const shareItemBetweenPeople = (tableId: number, productId: number, personIds: string[], quantity: number) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const product = table.currentOrder.items.find((item) => item.id === productId)
          if (!product) return table

          const quantityPerPerson = quantity / personIds.length
          const pricePerPerson = product.sell_price_inc_tax / personIds.length

          const updatedBills = table.currentOrder.bills.map((bill) => {
            if (personIds.includes(bill.id)) {
              const existingItemIndex = bill.items.findIndex((item) => item.productId === productId)
              let updatedItems

              const sharedBillItem: BillItem = {
                productId,
                product: { ...product, sell_price_inc_tax: pricePerPerson },
                quantity: quantityPerPerson,
                assignedTo: personIds,
                isShared: true,
              }

              if (existingItemIndex >= 0) {
                updatedItems = bill.items.map((item, index) => (index === existingItemIndex ? sharedBillItem : item))
              } else {
                updatedItems = [...bill.items, sharedBillItem]
              }

              const subtotal = updatedItems.reduce((sum, item) => sum + item.product.sell_price_inc_tax * item.quantity, 0)
              const tax = subtotal * 0.1
              const total = subtotal + tax

              return {
                ...bill,
                items: updatedItems,
                subtotal,
                tax,
                total,
              }
            }
            return bill
          })

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              bills: updatedBills,
            },
            updatedAt: new Date(),
          }

          return updatedTable
        }
        return table
      }),
    )
  }

  const calculateBillForPerson = (tableId: number, personId: string) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table || !table.currentOrder) return { subtotal: 0, tax: 0, total: 0 }

    const bill = table.currentOrder.bills.find((b) => b.id === personId)
    if (!bill) return { subtotal: 0, tax: 0, total: 0 }

    return {
      subtotal: bill.subtotal,
      tax: bill.tax,
      total: bill.total,
    }
  }

  const finalizeSplitBills = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table || !table.currentOrder) return []

    return table.currentOrder.bills
  }

  const createOnlineOrder = (customerInfo: any, items: any[], total: number) => {
    const onlineTableId = 999
    const existingOnlineTable = tables.find((t) => t.id === onlineTableId)

    if (!existingOnlineTable) {
      const onlineTable: Omit<Table, "id"> = {
        number: 999,
        name: '999',
        x: 50,
        y: 50,
        width: 120,
        height: 80,
        seats: 1,
        status: "occupied",
        shape: "rectangle",
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        metadata: {
          section: "Online",
          location: "Virtual",
          notes: "Mesa virtual para pedidos online",
        },
      }
      addTable(onlineTable)
    }

    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addProductToTable(onlineTableId, item)
      }
    })
  }

  return (
    <TableContext.Provider
      value={{
        tables,
        updateTablePosition,
        updateTableStatus,
        addTable,
        removeTable,
        getTableById,
        addProductToTable,
        removeProductFromTable,
        updateProductQuantityInTable,
        completeTableOrder,
        clearTableOrder,
        printOrderByArea,
        getOrderItemsByArea,
        assignWaiterToTable,
        enableSplitMode,
        addPersonToBill,
        removePersonFromBill,
        assignItemToPerson,
        shareItemBetweenPeople,
        calculateBillForPerson,
        finalizeSplitBills,
        createOnlineOrder,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}

export function useTables() {
  const context = useContext(TableContext)
  if (context === undefined) {
    throw new Error("useTables must be used within a TableProvider")
  }
  return context
}
