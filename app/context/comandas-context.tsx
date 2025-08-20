"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { jwtDecode } from "jwt-decode"

export interface Comanda {
  id: string
  tableNumber: string
  tableId: string
  waiter: string
  items: any[]
  createdAt: Date
  status: "pending" | "preparing" | "ready" | "completed"
  area: string
  estimatedTime: number
}

export interface ProduccionItem {
  id: string
  comandaId: string
  tableNumber: string
  tableId: string
  waiter: string
  items: any[]
  completedAt: Date
  area: string
  hasRecipe: boolean
}

export interface SentItem {
  tableId: string
  area: string
  itemId: string
  sentAt: Date
}

interface ComandasContextType {
  comandas: Comanda[]
  sentItems: SentItem[]
  produccionItems: ProduccionItem[]
  addComanda: (comanda: Comanda) => void
  updateComandaStatus: (id: string, status: Comanda['status']) => void
  getComandasByArea: (area: string) => Comanda[]
  markItemsAsSent: (tableId: string, area: string, itemIds: string[]) => void
  isItemSent: (tableId: string, area: string, itemId: string) => boolean
  moveToProduccion: (comanda: Comanda) => void
  getProduccionItems: () => ProduccionItem[]
  clearComandasByArea: (areaName: string) => void
}

const ComandasContext = createContext<ComandasContextType | undefined>(undefined)

// Helper function to get business_id from token
const getBusinessIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded: any = jwtDecode(token)
    return decoded.business_id || null
  } catch {
    return null
  }
}

export function ComandasProvider({ children }: { children: ReactNode }) {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [sentItems, setSentItems] = useState<SentItem[]>([])
  const [produccionItems, setProduccionItems] = useState<ProduccionItem[]>([])

  // Event listeners para recibir eventos desde split-checkout
  useEffect(() => {
    const handleAddComanda = (event: CustomEvent) => {
      const comanda = event.detail
      console.log('Agregando comanda desde split-checkout:', comanda)
      addComanda(comanda)
    }

    const handleMoveToProduccion = (event: CustomEvent) => {
      const produccionItem = event.detail
      console.log('Agregando a producción desde split-checkout:', produccionItem)
      setProduccionItems(prev => [...prev, produccionItem])
    }

    window.addEventListener('addComanda', handleAddComanda as EventListener)
    window.addEventListener('moveToProduccion', handleMoveToProduccion as EventListener)

    return () => {
      window.removeEventListener('addComanda', handleAddComanda as EventListener)
      window.removeEventListener('moveToProduccion', handleMoveToProduccion as EventListener)
    }
  }, [])

  // Cargar comandas y produccionItems desde localStorage al iniciar
  useEffect(() => {
    const businessId = getBusinessIdFromToken()
    if (!businessId) {
      console.log('❌ No business_id found in token for comandas')
      return
    }

    // Detectar cambios de empresa y limpiar datos del localStorage anterior
    const lastBusinessIdComandas = localStorage.getItem('lastBusinessIdComandas')
    if (lastBusinessIdComandas && lastBusinessIdComandas !== businessId.toString()) {
      console.log(`🔄 Business changed from ${lastBusinessIdComandas} to ${businessId}, clearing comandas localStorage`)
      // Limpiar datos de comandas de la empresa anterior
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('restaurante-comandas-') || 
            key.startsWith('restaurante-produccion-items-')) {
          localStorage.removeItem(key)
        }
      })
      // También limpiar los estados actuales
      setComandas([])
      setProduccionItems([])
    }
    localStorage.setItem('lastBusinessIdComandas', businessId.toString())

    const comandasKey = `restaurante-comandas-${businessId}`
    const produccionKey = `restaurante-produccion-items-${businessId}`
    
    const savedComandas = localStorage.getItem(comandasKey)
    const savedProduccion = localStorage.getItem(produccionKey)
    
    if (savedComandas) {
      try { 
        setComandas(JSON.parse(savedComandas))
        console.log(`✅ Comandas loaded for business ${businessId}`)
      } catch {}
    }
    if (savedProduccion) {
      try { 
        setProduccionItems(JSON.parse(savedProduccion))
        console.log(`✅ Producción items loaded for business ${businessId}`)
      } catch {}
    }
  }, [])

  // Guardar comandas y produccionItems en localStorage cuando cambien
  useEffect(() => {
    const businessId = getBusinessIdFromToken()
    if (businessId) {
      const comandasKey = `restaurante-comandas-${businessId}`
      localStorage.setItem(comandasKey, JSON.stringify(comandas))
    }
  }, [comandas])
  
  useEffect(() => {
    const businessId = getBusinessIdFromToken()
    if (businessId) {
      const produccionKey = `restaurante-produccion-items-${businessId}`
      localStorage.setItem(produccionKey, JSON.stringify(produccionItems))
    }
  }, [produccionItems])

  const addComanda = (comanda: Comanda) => {
    setComandas(prev => [...prev, comanda])
  }

  const updateComandaStatus = (id: string, status: Comanda['status']) => {
    setComandas(prev => prev.map(comanda => 
      comanda.id === id ? { ...comanda, status } : comanda
    ))
  }

  const getComandasByArea = (area: string) => {
    console.log('getComandasByArea - buscando área:', area)
    console.log('getComandasByArea - todas las comandas:', comandas)
    
    let filtered
    if (area === "General") {
      // Para área General, buscar comandas con área null, undefined, o "General"
      filtered = comandas.filter(comanda => 
        !comanda.area || 
        comanda.area === "null" || 
        comanda.area === "undefined" || 
        comanda.area === "General"
      )
    } else {
      // Para otras áreas, buscar por nombre exacto
      filtered = comandas.filter(comanda => comanda.area === area)
    }
    
    console.log('getComandasByArea - comandas filtradas:', filtered)
    return filtered
  }

  const markItemsAsSent = (tableId: string, area: string, itemIds: string[]) => {
    const newSentItems = itemIds.map(itemId => ({
      tableId,
      area,
      itemId,
      sentAt: new Date()
    }))
    setSentItems(prev => [...prev, ...newSentItems])
  }

  const isItemSent = (tableId: string, area: string, itemId: string) => {
    return sentItems.some(item => 
      item.tableId === tableId && 
      item.area === area && 
      item.itemId === itemId
    )
  }

  const moveToProduccion = async (comanda: Comanda) => {
    // Verificar si los productos tienen recetas
    const itemsWithRecipes = await Promise.all(
      comanda.items.map(async (item) => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return { ...item, hasRecipe: false }

          const response = await fetch(`/api/recipes?product_id=${item.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            return { ...item, hasRecipe: data.success && data.data && data.data.length > 0 }
          }
        } catch (error) {
          console.error('Error verificando receta:', error)
        }
        return { ...item, hasRecipe: false }
      })
    )

    const produccionItem: ProduccionItem = {
      id: `prod-${Date.now()}`,
      comandaId: comanda.id,
      tableNumber: comanda.tableNumber,
      tableId: comanda.tableId,
      waiter: comanda.waiter,
      items: itemsWithRecipes,
      completedAt: new Date(),
      area: comanda.area,
      hasRecipe: itemsWithRecipes.some(item => item.hasRecipe)
    }
    setProduccionItems(prev => [...prev, produccionItem])
  }

  const getProduccionItems = () => {
    return produccionItems
  }

  const clearComandasByArea = (areaName: string) => {
    setComandas(prev => prev.filter(comanda => comanda.area !== areaName))
  }

  return (
    <ComandasContext.Provider value={{
      comandas,
      sentItems,
      produccionItems,
      addComanda,
      updateComandaStatus,
      getComandasByArea,
      markItemsAsSent,
      isItemSent,
      moveToProduccion,
      getProduccionItems,
      clearComandasByArea
    }}>
      {children}
    </ComandasContext.Provider>
  )
}

export function useComandas() {
  const context = useContext(ComandasContext)
  if (context === undefined) {
    throw new Error('useComandas must be used within a ComandasProvider')
  }
  return context
} 