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
    <div className="min-h-screen bg-white">
      {/* Content */}
      <div>
        <ProductManagement />
      </div>
    </div>
  )
} 