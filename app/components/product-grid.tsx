"use client"

import type React from "react"

import Image from "next/image"
import { PlusCircle, GripVertical } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "../context/cart-context"
import { products } from "../data/products"

interface ProductGridProps {
  category: string
  searchQuery: string
  compact?: boolean
}

export default function ProductGrid({ category, searchQuery, compact = false }: ProductGridProps) {
  const { addToCart } = useCart()

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDragStart = (e: React.DragEvent, product: (typeof products)[0]) => {
    if (!e) return // Safety check

    e.dataTransfer.setData("application/json", JSON.stringify(product))
    e.dataTransfer.effectAllowed = "copy"

    // Add visual feedback - with error handling
    try {
      const dragImage = new Image()
      dragImage.src = product.image || "/placeholder.svg"
      e.dataTransfer.setDragImage(dragImage, 25, 25)
    } catch (error) {
      console.warn("Could not set drag image:", error)
    }
  }

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing group"
            draggable
            onDragStart={(e) => {
              e.preventDefault = e.preventDefault || (() => {})
              handleDragStart(e, product)
            }}
            onClick={() => addToCart(product)}
          >
            <div className="relative aspect-square">
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                <GripVertical className="h-4 w-4 text-white mr-1" />
                <PlusCircle className="h-4 w-4 text-white" />
              </div>
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>
            <CardContent className="p-2">
              <div>
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <p className="text-muted-foreground text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {filteredProducts.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md cursor-grab active:cursor-grabbing group"
          draggable
          onDragStart={(e) => {
            e.preventDefault = e.preventDefault || (() => {})
            handleDragStart(e, product)
          }}
          onClick={() => addToCart(product)}
        >
          <div className="relative aspect-square">
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
              <GripVertical className="h-6 w-6 text-white mr-2" />
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
          <CardContent className="p-3">
            <div>
              <h3 className="font-medium line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredProducts.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}
