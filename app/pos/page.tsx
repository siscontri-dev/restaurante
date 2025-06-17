"use client"

import { useState } from "react"
import { Search, MapPin, LayoutDashboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import ProductGrid from "../components/product-grid"
import CartSidebar from "../components/cart-sidebar"
import CategorySidebar from "../components/category-sidebar"
import { useSearchParams, useRouter } from "next/navigation"
import { useTables } from "../context/table-context"
import { Button } from "@/components/ui/button"

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const searchParams = useSearchParams()
  const tableId = searchParams.get("table")
  const { getTableById } = useTables()
  const currentTable = tableId ? getTableById(Number.parseInt(tableId)) : null

  const router = useRouter()

  return (
    <div className="flex h-screen bg-background">
      <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-10 bg-background p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            {currentTable && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Mesa {currentTable.number} ({currentTable.seats} personas)
              </div>
            )}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="bg-blue-50 border-blue-200"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/tables")} className="ml-4">
                <MapPin className="mr-2 h-4 w-4" />
                Mesas
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <ProductGrid category={selectedCategory} searchQuery={searchQuery} compact={false} />
        </div>
      </main>

      <CartSidebar />
    </div>
  )
}
