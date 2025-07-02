"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"

interface AuthCheckProps {
  children: React.ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      
      if (!token) {
        router.replace("/login")
        return
      }

      try {
        const decoded: any = jwtDecode(token)
        if (!decoded.user_id || !decoded.business_id) {
          throw new Error("Token inválido")
        }

        // Verificar si el token está expirado
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          localStorage.removeItem("token")
          router.replace("/login")
          return
        }
      } catch (err) {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    }

    // Verificar al montar el componente
    checkAuth()

    // Verificar cada minuto
    const interval = setInterval(checkAuth, 60000)

    // Agregar listener para errores de API
    const handleApiError = (event: MessageEvent) => {
      if (event.data === "API_ERROR_401") {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    }
    window.addEventListener("message", handleApiError)

    return () => {
      clearInterval(interval)
      window.removeEventListener("message", handleApiError)
    }
  }, [router])

  return <>{children}</>
} 