"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import RestaurantCanvas from "../components/restaurant-canvas"
import ProductGrid from "../components/product-grid"
import CategorySidebar from "../components/category-sidebar"
import { useTables, type Table } from "../context/table-context"
import { useCart } from "../context/cart-context"
import { CartProvider } from "../context/cart-context"

export default function TablesPage() {
  const router = useRouter()
  const { updateTableStatus } = useTables()
  const { itemCount } = useCart()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const handleTableSelect = (table: Table) => {
    if (table.status === "available") {
      updateTableStatus(table.id, "occupied")
    }
    setSelectedTable(table)
  }

  return (
    <CartProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al POS
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Mesas</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button variant="outline" onClick={() => router.push("/")} className="relative">
              <ShoppingCart className="mr-2 h-4 w-4" />
              POS Normal
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push("/kitchen")} className="bg-orange-50 border-orange-200">
              <Clock className="mr-2 h-4 w-4" />
              Comandas
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-56 border-r bg-white">
            <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          </div>

          {/* Products Section */}
          <div className="w-96 border-r bg-white flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Productos</h2>
              <p className="text-sm text-muted-foreground">Arrastra los productos a las mesas</p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ProductGrid category={selectedCategory} searchQuery={searchQuery} compact={true} />
            </div>
          </div>

          {/* Restaurant Canvas */}
          <div className="flex-1">
            <RestaurantCanvas onTableSelect={handleTableSelect} />
          </div>
        </div>
      </div>
    </CartProvider>
  )
}
