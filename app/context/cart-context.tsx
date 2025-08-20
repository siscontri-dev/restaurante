"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

export interface Product {
  id?: number
  sku: string
  name: string
  sell_price_inc_tax: number
  image: string | null
  category?: string
  preparationArea?: string
  active?: boolean
  createdAt?: Date
  updatedAt?: Date
  order_area_id?: number | null
}

interface CartItem extends Product {
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  loadCartFromTransaction: (transaction: any) => Promise<void>
  cartTotal: number
  itemCount: number
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('💾 Guardando carrito en localStorage:', cart)
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  // Load cart from localStorage on initial render only
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        console.log('📦 Cargando carrito desde localStorage:', parsedCart)
        setCart(parsedCart)
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Cargar carrito desde localStorage cuando cambie
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          console.log('🔄 Cargando carrito desde localStorage (storage change):', parsedCart)
          setCart(parsedCart)
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error)
        }
      }
    }

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // También verificar cada segundo si hay cambios (para cambios en la misma ventana)
    const interval = setInterval(() => {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (JSON.stringify(parsedCart) !== JSON.stringify(cart)) {
            console.log('🔄 Cargando carrito desde localStorage (interval check):', parsedCart)
            setCart(parsedCart)
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error)
        }
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [cart])

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }

      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCart([])
  }

  const loadCartFromTransaction = async (transaction: any): Promise<void> => {
    try {
      setIsLoading(true)
      console.log('🔄 Iniciando carga de productos de transacción:', transaction.id)
      console.log('📋 Datos de la transacción:', transaction)
      
      // Obtener los productos de la transacción
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('❌ No se encontró token de autenticación')
        return
      }

      const url = `/api/transactions/${transaction.id}/items`
      console.log('📡 Haciendo petición a:', url)
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      console.log('📊 Respuesta del servidor:', response.status, response.ok)

      if (response.ok) {
        const items = await response.json()
        console.log('📦 Items recibidos del servidor:', items)
        console.log('📊 Cantidad de items:', items?.length || 0)
        
        if (!Array.isArray(items) || items.length === 0) {
          console.warn('⚠️ No se recibieron items o el array está vacío')
          setCart([])
          setIsLoading(false)
          return
        }
        
        const cartItems: CartItem[] = []
        
        for (const item of items) {
          if (item.is_combo) {
            // Es un combo - usar el precio del combo principal
            cartItems.push({
              id: item.product_id,
              sku: item.sku || '',
              name: item.product_name || 'Producto',
              sell_price_inc_tax: parseFloat(item.unit_price_inc_tax), // Precio del combo principal
              image: item.image || null,
              quantity: parseFloat(item.quantity)
            })
          } else {
            // Es un producto individual - agregarlo normalmente
            cartItems.push({
              id: item.product_id,
              sku: item.sku || '',
              name: item.product_name || 'Producto',
              sell_price_inc_tax: parseFloat(item.unit_price_inc_tax),
              image: item.image || null,
              quantity: parseFloat(item.quantity)
            })
          }
        }
        
        console.log('🛒 Productos mapeados para el carrito:', cartItems)
        console.log('📊 Cantidad de productos en carrito:', cartItems.length)
        
        setCart(cartItems)
        setIsLoading(false)
        console.log('✅ Carrito actualizado exitosamente')
        console.log('🔍 Estado final del carrito:', cartItems)
      } else {
        const errorData = await response.json()
        console.error('❌ Error en la respuesta:', errorData)
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ Error al cargar productos de la transacción:', error)
      setIsLoading(false)
      throw error
    }
  }

  const cartTotal = cart.reduce((total, item) => total + item.sell_price_inc_tax * item.quantity, 0)

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCartFromTransaction,
        cartTotal,
        itemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  console.log('🔍 useCart llamado - Estado del carrito:', context.cart)
  return context
}
