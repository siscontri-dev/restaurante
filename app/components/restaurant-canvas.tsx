"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Move, Hand, Settings, Receipt, Trash2, Minus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTables, type Table } from "../context/table-context"
import DraggableTable from "./draggable-table"
import OrderTickets from "./order-tickets"
import SplitBill from "./split-bill"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import NewTableDialog from "./new-table-dialog"

interface RestaurantCanvasProps {
  onTableSelect?: (table: Table) => void
}

export default function RestaurantCanvas({ onTableSelect }: RestaurantCanvasProps) {
  const {
    tables,
    updateTableStatus,
    removeProductFromTable,
    updateProductQuantityInTable,
    completeTableOrder,
    clearTableOrder,
    assignWaiterToTable,
    addTable,
  } = useTables()
  const [isDragMode, setIsDragMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDraggingProduct, setIsDraggingProduct] = useState(false)
  const [activeTab, setActiveTab] = useState("order")
  const router = useRouter()
  const [waiterName, setWaiterName] = useState("")

  const handleTableClick = (table: Table) => {
    if (!isDragMode) {
      setSelectedTable(table)
      onTableSelect?.(table)
    }
  }

  const handleCheckoutTable = (table: Table) => {
    if (table.currentOrder && table.currentOrder.items.length > 0) {
      localStorage.setItem(
        "temp-checkout-order",
        JSON.stringify({
          tableId: table.id,
          tableNumber: table.number,
          items: table.currentOrder.items,
          total: table.currentOrder.total,
        }),
      )
      router.push("/table-checkout")
    }
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(true)
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(false)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(false)
  }

  const getStatusStats = () => {
    const stats = {
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
      "needs-cleaning": tables.filter((t) => t.status === "needs-cleaning").length,
    }
    return stats
  }

  const stats = getStatusStats()

  // Verificar si hay comandas pendientes de imprimir
  const hasPendingTickets = (table: Table) => {
    if (!table.currentOrder || !table.currentOrder.items.length) return false

    const areas = new Set(table.currentOrder.items.map((item) => item.preparationArea))
    const printedAreas = new Set(table.currentOrder.printedAreas || [])

    return Array.from(areas).some((area) => !printedAreas.has(area))
  }

  // Verificar si la cuenta está dividida
  const isSplitBill = (table: Table) => {
    return table.currentOrder?.splitMode || false
  }

  return (
    <div className="flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-50 border rounded-lg overflow-hidden">
        {/* Canvas Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant={isDragMode ? "default" : "outline"} size="sm" onClick={() => setIsDragMode(!isDragMode)}>
              {isDragMode ? <Move className="h-4 w-4 mr-2" /> : <Hand className="h-4 w-4 mr-2" />}
              {isDragMode ? "Editando" : "Selección"}
            </Button>
            {/* 
<NewTableDialog>
  <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
    <Plus className="h-4 w-4 mr-2" />
    Agregar Mesa
  </Button>
</NewTableDialog>
*/}
            <NewTableDialog>
              <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mesa
              </Button>
            </NewTableDialog>
            {/* Debug: Verificar que el diálogo funciona */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Botón de prueba clickeado")
                console.log("Número de mesas actuales:", tables.length)
              }}
              className="text-xs opacity-50"
            >
              Debug
            </Button>
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Libres: {stats.available}
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Ocupadas: {stats.occupied}
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Reservadas: {stats.reserved}
            </Badge>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="absolute inset-0 pt-20 p-4">
          <div
            className={`relative w-full h-full bg-white rounded-lg border-2 transition-all duration-200 ${
              isDraggingProduct ? "border-blue-400 border-dashed bg-blue-50" : "border-dashed border-gray-300"
            }`}
            style={{ minHeight: "600px" }}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Tables */}
            {tables.map((table) => (
              <DraggableTable
                key={table.id}
                table={table}
                onTableClick={handleTableClick}
                isDragMode={isDragMode}
                showTicketIndicator={hasPendingTickets(table)}
              />
            ))}

            {/* Empty State */}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Canvas del Restaurante</p>
                  <p className="text-sm">Haz clic en "Nueva Mesa" para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Info Panel */}
      {selectedTable && (
        <div className="w-96 border-l bg-background p-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                Mesa {selectedTable.number}
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      selectedTable.status === "available"
                        ? "bg-green-100 text-green-800"
                        : selectedTable.status === "occupied"
                          ? "bg-red-100 text-red-800"
                          : selectedTable.status === "reserved"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedTable.status === "available"
                      ? "Libre"
                      : selectedTable.status === "occupied"
                        ? "Ocupada"
                        : selectedTable.status === "reserved"
                          ? "Reservada"
                          : "Necesita Limpieza"}
                  </Badge>
                  {isSplitBill(selectedTable) && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Cuenta Dividida
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedTable.seats} asientos • {selectedTable.shape === "rectangle" ? "Rectangular" : "Circular"}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="order">Pedido</TabsTrigger>
                  <TabsTrigger value="tickets" className="relative">
                    Comandas
                    {hasPendingTickets(selectedTable) && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        !
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="split" className="relative">
                    Dividir
                    {isSplitBill(selectedTable) && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="order" className="mt-4 space-y-4">
                  {/* Current Order */}
                  {selectedTable.currentOrder && selectedTable.currentOrder.items.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Pedido Actual</p>
                        <Badge variant="outline">
                          {selectedTable.currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </Badge>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedTable.currentOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} c/u</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateProductQuantityInTable(selectedTable.id, item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateProductQuantityInTable(selectedTable.id, item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500"
                                onClick={() => removeProductFromTable(selectedTable.id, item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-3" />

                      <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span>${selectedTable.currentOrder.total.toFixed(2)}</span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex-1"
                          onClick={() => handleCheckoutTable(selectedTable)}
                          disabled={isSplitBill(selectedTable)}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          {isSplitBill(selectedTable) ? "Cuenta Dividida" : "Facturar"}
                        </Button>
                        <Button variant="outline" onClick={() => clearTableOrder(selectedTable.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay productos en esta mesa</p>
                      <p className="text-sm">Arrastra productos desde la barra lateral</p>
                    </div>
                  )}

                  {/* Table Status Controls */}
                  <div className="space-y-2 pt-4">
                    <p className="text-sm text-muted-foreground">Cambiar Estado</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedTable.status === "available" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTableStatus(selectedTable.id, "available")}
                      >
                        Libre
                      </Button>
                      <Button
                        variant={selectedTable.status === "reserved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTableStatus(selectedTable.id, "reserved")}
                      >
                        Reservada
                      </Button>
                      <Button
                        variant={selectedTable.status === "needs-cleaning" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTableStatus(selectedTable.id, "needs-cleaning")}
                        className="col-span-2"
                      >
                        Necesita Limpieza
                      </Button>
                    </div>
                  </div>
                  {/* Waiter Assignment */}
                  <div className="space-y-2 pt-4">
                    <p className="text-sm text-muted-foreground">Asignar Mesero</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre del mesero"
                        value={waiterName}
                        onChange={(e) => setWaiterName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (waiterName.trim()) {
                            assignWaiterToTable(selectedTable.id, waiterName.trim())
                            setWaiterName("")
                          }
                        }}
                        disabled={!waiterName.trim()}
                      >
                        Asignar
                      </Button>
                    </div>
                    {selectedTable.assignedWaiter && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>Mesero: {selectedTable.assignedWaiter}</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="tickets" className="mt-4">
                  <OrderTickets table={selectedTable} />
                </TabsContent>
                <TabsContent value="split" className="mt-4">
                  <SplitBill table={selectedTable} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
