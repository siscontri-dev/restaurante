import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No se proporcionó token',
        debug: {
          tokenProvided: false,
          tokenLength: 0
        }
      }, { status: 400 })
    }

    console.log('🔍 Debug token:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 20)
    })

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      console.log('✅ Token válido:', decoded)
      
      return NextResponse.json({
        success: true,
        tokenValid: true,
        decoded,
        debug: {
          tokenLength: token.length,
          expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No exp',
          currentTime: new Date().toISOString(),
          isExpired: decoded.exp ? Date.now() > decoded.exp * 1000 : false
        }
      })
    } catch (jwtError) {
      console.log('❌ Token inválido:', jwtError)
      
      return NextResponse.json({
        success: false,
        tokenValid: false,
        error: jwtError instanceof Error ? jwtError.message : 'Error desconocido',
        debug: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          tokenEnd: '...' + token.substring(token.length - 20),
          jwtError: jwtError instanceof Error ? jwtError.message : 'Error desconocido'
        }
      }, { status: 401 })
    }
  } catch (error) {
    console.error('💥 Error en debug token:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      debug: {
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }, { status: 500 })
  }
} 