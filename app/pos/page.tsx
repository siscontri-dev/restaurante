"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, LayoutDashboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import ProductGrid from "../components/product-grid"
import CartSidebar from "../components/cart-sidebar"
import CategorySidebar from "../components/category-sidebar"
import { useSearchParams, useRouter } from "next/navigation"
import { useTables } from "../context/table-context"
import { Button } from "@/components/ui/button"
import { CartProvider } from "../context/cart-context"
import ClientSearchDialog from "../components/client-search-dialog"
import LocationSelectorModal from "../components/location-selector-modal"


export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ id: number; name: string } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)


  const searchParams = useSearchParams()
  const tableId = searchParams.get("table")
  const { getTableById } = useTables()
  const currentTable = tableId ? getTableById(Number.parseInt(tableId)) : null

  const router = useRouter()

  useEffect(() => {
    // Verificar si ya hay una ubicación seleccionada
    const savedLocation = localStorage.getItem('selectedLocation')
    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation))
    } else {
      setShowLocationModal(true)
    }

    // Al cargar la página, buscar el cliente predeterminado
    const fetchDefaultClient = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      const response = await fetch('/api/clients?default=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setSelectedClient({ id: data[0].id, name: data[0].name })
        }
      }
    }
    fetchDefaultClient()
  }, [])

  const handleLocationSelected = (location: { id: number; name: string }) => {
    setSelectedLocation(location)
    localStorage.setItem('selectedLocation', JSON.stringify(location))
    setShowLocationModal(false)
  }

  return (
    <CartProvider>
      <LocationSelectorModal 
        isOpen={showLocationModal} 
        onLocationSelected={handleLocationSelected} 
      />
      <div className="flex h-screen bg-background">
        <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="sticky top-0 z-10 bg-background p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Point of Sale</h1>
                {selectedLocation && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Ubicación: {selectedLocation.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLocationModal(true)}
                      className="text-xs"
                    >
                      Cambiar
                    </Button>
                  </div>
                )}
              </div>

              <div>
              </div>
              {currentTable && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  Mesa {currentTable.number} ({currentTable.seats} personas)
                </div>
              )}
              <div className="flex items-center border rounded-md">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    className="pl-8 border-none focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ClientSearchDialog onClientSelect={setSelectedClient} selectedClient={selectedClient} />
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
    </CartProvider>
  )
}
