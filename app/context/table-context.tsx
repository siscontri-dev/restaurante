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
  // Nuevas funciones para simular base de datos
  saveTableToDatabase: (table: Table) => Promise<boolean>
  getTableFromDatabase: (id: number) => Promise<Table | null>
  getAllTablesFromDatabase: () => Promise<Table[]>
  updateTableInDatabase: (id: number, updates: Partial<Table>) => Promise<boolean>
  deleteTableFromDatabase: (id: number) => Promise<boolean>
}

const TableContext = createContext<TableContextType | undefined>(undefined)

const defaultTables: Table[] = [
  {
    id: 1,
    number: 1,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    seats: 4,
    status: "available",
    shape: "rectangle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "Principal", location: "Ventana" },
  },
  {
    id: 2,
    number: 2,
    x: 300,
    y: 100,
    width: 120,
    height: 80,
    seats: 4,
    status: "available",
    shape: "rectangle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "Principal", location: "Centro" },
  },
  {
    id: 3,
    number: 3,
    x: 500,
    y: 100,
    width: 100,
    height: 100,
    seats: 6,
    status: "available",
    shape: "circle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "VIP", location: "Esquina" },
  },
  {
    id: 4,
    number: 4,
    x: 100,
    y: 250,
    width: 120,
    height: 80,
    seats: 4,
    status: "available",
    shape: "rectangle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "Principal", location: "Pared" },
  },
  {
    id: 5,
    number: 5,
    x: 300,
    y: 250,
    width: 160,
    height: 80,
    seats: 6,
    status: "available",
    shape: "rectangle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "Familiar", location: "Centro" },
  },
  {
    id: 6,
    number: 6,
    x: 500,
    y: 250,
    width: 100,
    height: 100,
    seats: 4,
    status: "available",
    shape: "circle",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: { section: "Terraza", location: "Exterior" },
  },
]

export function TableProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Table[]>(defaultTables)

  // Simular carga desde base de datos
  useEffect(() => {
    const loadTablesFromStorage = async () => {
      const savedTables = localStorage.getItem("restaurant-tables-db")
      if (savedTables) {
        try {
          const parsedTables = JSON.parse(savedTables)
          const tablesWithDates = parsedTables.map((table: Table) => ({
            ...table,
            createdAt: new Date(table.createdAt || Date.now()),
            updatedAt: new Date(table.updatedAt || Date.now()),
            currentOrder: table.currentOrder
              ? {
                  ...table.currentOrder,
                  createdAt: new Date(table.currentOrder.createdAt),
                }
              : undefined,
          }))
          setTables(tablesWithDates)
          console.log("✅ Tables loaded from database simulation:", tablesWithDates.length)
        } catch (error) {
          console.error("❌ Failed to parse tables from database:", error)
        }
      } else {
        // Inicializar con datos por defecto
        await saveAllTablesToDatabase(defaultTables)
      }
    }

    loadTablesFromStorage()
  }, [])

  // Simular guardado en base de datos
  const saveAllTablesToDatabase = async (tablesToSave: Table[]) => {
    try {
      localStorage.setItem("restaurant-tables-db", JSON.stringify(tablesToSave))
      console.log("💾 All tables saved to database simulation")
      return true
    } catch (error) {
      console.error("❌ Failed to save tables to database:", error)
      return false
    }
  }

  // Guardar automáticamente cuando cambien las mesas
  useEffect(() => {
    if (tables.length > 0) {
      saveAllTablesToDatabase(tables)
    }
  }, [tables])

  // Funciones de simulación de base de datos
  const saveTableToDatabase = async (table: Table): Promise<boolean> => {
    try {
      const updatedTable = {
        ...table,
        updatedAt: new Date(),
      }

      setTables((prevTables) => {
        const existingIndex = prevTables.findIndex((t) => t.id === table.id)
        if (existingIndex >= 0) {
          const newTables = [...prevTables]
          newTables[existingIndex] = updatedTable
          return newTables
        } else {
          return [...prevTables, updatedTable]
        }
      })

      console.log(`💾 Table ${table.number} saved to database simulation`)
      return true
    } catch (error) {
      console.error("❌ Failed to save table to database:", error)
      return false
    }
  }

  const getTableFromDatabase = async (id: number): Promise<Table | null> => {
    try {
      const table = tables.find((t) => t.id === id)
      console.log(`🔍 Retrieved table ${id} from database simulation:`, table ? "Found" : "Not found")
      return table || null
    } catch (error) {
      console.error("❌ Failed to get table from database:", error)
      return null
    }
  }

  const getAllTablesFromDatabase = async (): Promise<Table[]> => {
    try {
      console.log(`📋 Retrieved ${tables.length} tables from database simulation`)
      return tables
    } catch (error) {
      console.error("❌ Failed to get all tables from database:", error)
      return []
    }
  }

  const updateTableInDatabase = async (id: number, updates: Partial<Table>): Promise<boolean> => {
    try {
      setTables((prevTables) =>
        prevTables.map((table) => (table.id === id ? { ...table, ...updates, updatedAt: new Date() } : table)),
      )
      console.log(`✏️ Table ${id} updated in database simulation`)
      return true
    } catch (error) {
      console.error("❌ Failed to update table in database:", error)
      return false
    }
  }

  const deleteTableFromDatabase = async (id: number): Promise<boolean> => {
    try {
      setTables((prevTables) => prevTables.filter((table) => table.id !== id))
      console.log(`🗑️ Table ${id} deleted from database simulation`)
      return true
    } catch (error) {
      console.error("❌ Failed to delete table from database:", error)
      return false
    }
  }

  const updateTablePosition = (id: number, x: number, y: number) => {
    updateTableInDatabase(id, { x, y })
  }

  const updateTableStatus = (id: number, status: Table["status"]) => {
    updateTableInDatabase(id, { status })
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

    console.log("🆕 Adding new table to database simulation:", tableWithMetadata)
    saveTableToDatabase(tableWithMetadata)
  }

  const removeTable = (id: number) => {
    deleteTableFromDatabase(id)
  }

  const getTableById = (id: number) => {
    return tables.find((table) => table.id === id)
  }

  const assignWaiterToTable = (tableId: number, waiterName: string) => {
    updateTableInDatabase(tableId, {
      assignedWaiter: waiterName,
      currentOrder: tables.find((t) => t.id === tableId)?.currentOrder
        ? { ...tables.find((t) => t.id === tableId)!.currentOrder!, waiter: waiterName }
        : undefined,
    })
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

          if (existingItemIndex >= 0) {
            updatedItems = currentOrder.items.map((item, index) =>
              index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item,
            )
          } else {
            updatedItems = [...currentOrder.items, { ...product, quantity: 1 }]
          }

          const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

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

          // Guardar en "base de datos"
          saveTableToDatabase(updatedTable)

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
          const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

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

          saveTableToDatabase(updatedTable)
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
          const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

          const updatedTable = {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              items: updatedItems,
              total,
            },
            updatedAt: new Date(),
          }

          saveTableToDatabase(updatedTable)
          return updatedTable
        }
        return table
      }),
    )
  }

  const completeTableOrder = (tableId: number) => {
    updateTableInDatabase(tableId, {
      status: "needs-cleaning",
      currentOrder: tables.find((t) => t.id === tableId)?.currentOrder
        ? { ...tables.find((t) => t.id === tableId)!.currentOrder!, status: "completed" }
        : undefined,
    })
  }

  const clearTableOrder = (tableId: number) => {
    updateTableInDatabase(tableId, {
      status: "available",
      currentOrder: undefined,
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
          saveTableToDatabase(updatedTable)
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
        const area = item.preparationArea
        if (!acc[area]) {
          acc[area] = []
        }
        acc[area].push(item)
        return acc
      },
      {} as Record<string, Array<Product & { quantity: number }>>,
    )
  }

  // Funciones de división de cuenta (mantenidas igual)
  const enableSplitMode = (tableId: number) => {
    updateTableInDatabase(tableId, {
      currentOrder: tables.find((t) => t.id === tableId)?.currentOrder
        ? {
            ...tables.find((t) => t.id === tableId)!.currentOrder!,
            splitMode: true,
            status: "split",
            bills: [],
          }
        : undefined,
    })
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

          saveTableToDatabase(updatedTable)
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

          saveTableToDatabase(updatedTable)
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

              const subtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
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

          saveTableToDatabase(updatedTable)
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
          const pricePerPerson = (product.price * quantityPerPerson) / personIds.length

          const updatedBills = table.currentOrder.bills.map((bill) => {
            if (personIds.includes(bill.id)) {
              const existingItemIndex = bill.items.findIndex((item) => item.productId === productId)
              let updatedItems

              const sharedBillItem: BillItem = {
                productId,
                product: { ...product, price: pricePerPerson },
                quantity: quantityPerPerson,
                assignedTo: personIds,
                isShared: true,
              }

              if (existingItemIndex >= 0) {
                updatedItems = bill.items.map((item, index) => (index === existingItemIndex ? sharedBillItem : item))
              } else {
                updatedItems = [...bill.items, sharedBillItem]
              }

              const subtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
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

          saveTableToDatabase(updatedTable)
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

    updateTableInDatabase(onlineTableId, {
      currentOrder: tables.find((t) => t.id === onlineTableId)?.currentOrder
        ? {
            ...tables.find((t) => t.id === onlineTableId)!.currentOrder!,
            orderType: "online",
            customerInfo,
          }
        : undefined,
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
        // Funciones de simulación de base de datos
        saveTableToDatabase,
        getTableFromDatabase,
        getAllTablesFromDatabase,
        updateTableInDatabase,
        deleteTableFromDatabase,
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
