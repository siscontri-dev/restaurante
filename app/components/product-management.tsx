"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Image as ImageIcon, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select } from "@/components/ui/select"
import type { Product } from "@/lib/services/product-service"

interface ExtendedProduct extends Omit<Product, 'image' | 'product_description'> {
  price?: number
  image: string
  product_description: string | null
  not_for_selling: number
}

interface ProductFormData {
  id?: number
  name: string
  sku: string
  price: number
  image: string
  product_description: string
  not_for_selling: number
  order_area_id: number | null
}

type ImageSource = 'file' | 'url'

const PAGE_SIZE = 1000;

export default function ProductManagement() {
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [imageSource, setImageSource] = useState<ImageSource>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [areas, setAreas] = useState<{ id: number, name: string }[]>([])
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: 0,
    image: "",
    product_description: "",
    not_for_selling: 1,
    order_area_id: null
  })

  useEffect(() => {
    fetchProducts()
    fetch("/api/order-areas").then(res => res.json()).then(data => setAreas(data.areas || []))
  }, [page])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Eliminar duplicados usando un Map basado en el ID
        const uniqueProductsMap = new Map()
        data.products.forEach((product: Product) => {
          const mappedProduct = {
            ...product,
            price: product.sell_price_inc_tax,
            image: product.image || '/placeholder.svg',
            product_description: product.product_description || null,
            not_for_selling: product.not_for_selling ?? 1
          }
          uniqueProductsMap.set(product.id, mappedProduct)
        })
        
        setProducts(Array.from(uniqueProductsMap.values()))
        setTotal(data.total)
      } else {
        console.error('Error fetching products:', data.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchProducts()
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }

      const data = await response.json()
      
      // Eliminar duplicados usando un Map basado en el ID
      const uniqueProductsMap = new Map()
      if (data.products) {
        data.products.forEach((product: Product) => {
          const mappedProduct = {
            ...product,
            price: product.sell_price_inc_tax,
            image: product.image || '/placeholder.svg',
            product_description: product.product_description || null,
            not_for_selling: product.not_for_selling ?? 1
          }
          uniqueProductsMap.set(product.id, mappedProduct)
        })
      }
      
      setProducts(Array.from(uniqueProductsMap.values()))
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: ExtendedProduct) => {
    setEditingProduct(product)
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price) || 0,
      image: product.image,
      product_description: product.product_description || '',
      not_for_selling: product.not_for_selling ?? 1,
      order_area_id: product.order_area_id ?? null
    })
    setImageSource(product.image.startsWith('/media/') ? 'file' : 'url')
    setImagePreview(product.image)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }

      await fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar el producto')
    }
  }

  const handleImageSourceChange = (value: ImageSource) => {
    setImageSource(value)
    setSelectedFile(null)
    setFormData(prev => ({ ...prev, image: "" }))
    setImagePreview("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.')
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Error al subir la imagen.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // La respuesta no es JSON, puede ser un error del servidor (HTML, etc.)
          errorMessage = `${errorMessage} (Código: ${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error en uploadImage:', error)
      // Re-lanzar el error para que sea atrapado por handleSaveProduct
      throw error
    }
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.sku || formData.price <= 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Validar la longitud de la URL de la imagen
    if (imageSource === 'url' && formData.image && formData.image.length > 191) {
      alert('La URL de la imagen es demasiado larga (máx. 191 caracteres). Por favor, use una URL más corta o suba la imagen directamente.')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      let imageUrl = formData.image
      if (imageSource === 'file' && selectedFile) {
        imageUrl = await uploadImage(selectedFile)
      }

      const url = editingProduct ? '/api/products' : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingProduct?.id,
          name: formData.name,
          sku: formData.sku,
          sell_price_inc_tax: formData.price,
          image: imageUrl,
          product_description: formData.product_description,
          not_for_selling: formData.not_for_selling,
          order_area_id: formData.order_area_id || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar producto')
      }

      await fetchProducts()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      price: 0,
      image: "",
      product_description: "",
      not_for_selling: 1,
      order_area_id: null
    })
    setSelectedFile(null)
    setImagePreview("")
    setImageSource("url")
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Productos</h2>
          <p className="text-gray-600">Administra los productos de tu restaurante</p>
        </div>
        <Button onClick={handleCreateProduct} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar productos por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando productos...</span>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id || product.sku} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditProduct(product)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.id!)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {product.sku}
                    </Badge>
                    <span className="font-bold text-green-600">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos</p>
          <p className="text-sm text-gray-400 mt-2">Intenta crear un nuevo producto usando el botón "Nuevo Producto"</p>
        </div>
      )}

      {/* Paginación */}
      {products.length > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="py-2 px-4 bg-gray-100 rounded">Página {page}</span>
          <Button 
            disabled={products.length < PAGE_SIZE} 
            onClick={() => setPage(page + 1)}
            variant="outline"
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU del producto"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Imagen del Producto</Label>
              <RadioGroup value={imageSource} onValueChange={(value: ImageSource) => handleImageSourceChange(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file" />
                  <Label htmlFor="file" className="flex items-center gap-2">
                    <ImageIcon size={16} />
                    Subir Imagen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label htmlFor="url" className="flex items-center gap-2">
                    <Link size={16} />
                    URL de Imagen
                  </Label>
                </div>
              </RadioGroup>

              {imageSource === 'file' ? (
                <div className="grid gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {imagePreview && (
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-md object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="URL de la imagen"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.product_description}
                onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                placeholder="Descripción del producto"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">Área</Label>
              <select
                id="area"
                value={formData.order_area_id ?? ''}
                onChange={e => setFormData({ ...formData, order_area_id: e.target.value ? Number(e.target.value) : null })}
                className="border rounded px-2 py-1"
              >
                <option value="">General</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 