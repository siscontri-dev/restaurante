"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import ProductManagement from "../components/product-management"

export default function ProductsPage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar JWT en localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      router.replace("/login")
      return
    }
    try {
      // Decodificar y validar expiración
      const decoded: any = jwtDecode(token)
      if (!decoded.user_id || !decoded.business_id) {
        throw new Error("Token inválido")
      }
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    } catch (err) {
      localStorage.removeItem("token")
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Productos</h1>
            <p className="text-gray-600">Administra los productos de tu restaurante</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Volver al Dashboard
            </button>
            <button
              onClick={() => router.push("/pos")}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
            >
              Ir al POS
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <ProductManagement />
      </div>
    </div>
  )
} 