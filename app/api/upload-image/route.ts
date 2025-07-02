import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function POST(req: Request) {
  try {
    // Verificar el token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    jwt.verify(token, JWT_SECRET)

    // Procesar la imagen
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const uniqueId = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    const fileName = `${Date.now()}_${uniqueId}${getExtension(file.name)}`

    // Convertir el archivo a Buffer
    const bytes_file = await file.arrayBuffer()
    const buffer = Buffer.from(bytes_file)

    // Asegurarse de que el directorio de subida exista
    const imagesDirectory = join(process.cwd(), 'public/media')
    await mkdir(imagesDirectory, { recursive: true })

    // Guardar el archivo
    const filePath = join(imagesDirectory, fileName)
    await writeFile(filePath, buffer)

    // Devolver la URL del archivo
    const fileUrl = `/media/${fileName}`
    
    return NextResponse.json({ 
      success: true,
      url: fileUrl
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al subir la imagen' 
    }, { status: 500 })
  }
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()
  return ext ? `.${ext}` : ''
} 