import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { jwtDecode } from "jwt-decode"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function verifyToken(authHeader: string | null): { businessId: number; userId?: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autorización requerido')
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded: any = jwtDecode(token)
    
    if (!decoded.business_id) {
      throw new Error('Token inválido: business_id no encontrado')
    }

    return {
      businessId: decoded.business_id,
      userId: decoded.user_id
    }
  } catch (error) {
    throw new Error('Token inválido o expirado')
  }
}
