"use client"

import { useState } from "react"
import { Users, User, DollarSign, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useTables, type Table } from "../context/table-context"
import { useRouter } from "next/navigation"

interface SplitBillProps {
  table: Table
}

interface ProductSelection {
  productId: number
  selected: boolean
  assignedTo: string[]
}

export default function SplitBill({ table }: SplitBillProps) {
  const {
    enableSplitMode,
    addPersonToBill,
    removePersonFromBill,
    assignItemToPerson,
    shareItemBetweenPeople,
    finalizeSplitBills,
    getTableById,
  } = useTables()
  const [newPersonName, setNewPersonName] = useState("")
  const [productSelections, setProductSelections] = useState<Record<number, ProductSelection>>({})
  const router = useRouter()

  // Obtener la mesa actualizada del contexto
  const currentTable = getTableById(table.id) || table

  if (!currentTable.currentOrder || currentTable.currentOrder.items.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No hay productos en esta mesa para dividir la cuenta.</p>
      </div>
    )
  }

  const handleEnableSplitMode = () => {
    enableSplitMode(table.id)
    // Inicializar selecciones de productos
    const initialSelections: Record<number, ProductSelection> = {}
    currentTable.currentOrder?.items.forEach((item) => {
      if (item.id) {
        initialSelections[item.id] = {
          productId: item.id,
          selected: false,
          assignedTo: [],
        }
      }
    })
    setProductSelections(initialSelections)
  }

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPersonToBill(table.id, newPersonName.trim())
      setNewPersonName("")
    }
  }

  const handleProductSelection = (productId: number, selected: boolean) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected,
        assignedTo: selected ? prev[productId]?.assignedTo || [] : [],
      },
    }))
  }

  const handlePersonAssignment = (productId: number, personId: string, assigned: boolean) => {
    setProductSelections((prev) => {
      const current = prev[productId] || { productId, selected: true, assignedTo: [] }
      const assignedTo = assigned
        ? [...current.assignedTo, personId]
        : current.assignedTo.filter((id) => id !== personId)

      return {
        ...prev,
        [productId]: {
          ...current,
          assignedTo,
        },
      }
    })
  }

  const handleConfirmAssignments = () => {
    // Procesar las asignaciones
    Object.values(productSelections).forEach((selection) => {
      if (selection.selected && selection.assignedTo.length > 0) {
        const product = currentTable.currentOrder?.items.find((item) => item.id === selection.productId)
        if (product) {
          if (selection.assignedTo.length === 1) {
            // Asignar a una sola persona
            assignItemToPerson(table.id, selection.productId, selection.assignedTo[0], product.quantity)
          } else {
            // Compartir entre varias personas
            shareItemBetweenPeople(table.id, selection.productId, selection.assignedTo, product.quantity)
          }
        }
      }
    })

    // Polling para esperar a que los productos estén realmente asignados en los bills
    const checkBillsReady = () => {
      const bills = finalizeSplitBills(table.id)
      const anyHasItems = bills.some(bill => bill.items && bill.items.length > 0)
      if (anyHasItems) {
        handleCheckoutSplit()
      } else {
        setTimeout(checkBillsReady, 30)
      }
    }
    checkBillsReady()
  }

  const handleCheckoutSplit = () => {
    const bills = finalizeSplitBills(table.id)
    localStorage.setItem(
      "split-bills-checkout",
      JSON.stringify({
        tableId: table.id,
        tableNumber: table.number,
        bills,
      }),
    )
    router.push("/split-checkout")
  }

  const bills = currentTable.currentOrder?.bills || []
  const isInSplitMode = currentTable.currentOrder?.splitMode || false

  const selectedProducts = Object.values(productSelections).filter((s) => s.selected)
  const canProceed =
    bills.length > 0 && selectedProducts.length > 0 && selectedProducts.every((s) => s.assignedTo.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">División de Cuenta</h3>
        <Badge variant="outline">Mesa {currentTable.number}</Badge>
      </div>

      {!isInSplitMode ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h4 className="font-medium">¿Dividir la cuenta?</h4>
                <p className="text-sm text-muted-foreground">Selecciona qué productos va a pagar cada persona</p>
              </div>
              <Button onClick={handleEnableSplitMode} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Activar División de Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Paso 1: Configurar Personas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Personas en la Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la persona"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPerson()}
                />
                <Button onClick={handleAddPerson} disabled={!newPersonName.trim()}>
                  Agregar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {bills.map((bill) => (
                  <Badge key={bill.id} variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {bill.personName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removePersonFromBill(table.id, bill.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Paso 2: Seleccionar y Asignar Productos */}
          {bills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. ¿Qué se va a facturar?</CardTitle>
                <p className="text-sm text-muted-foreground">Selecciona los productos y asígnalos a las personas</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTable.currentOrder.items.map((item) => {
                  if (!item.id) return null
                  const selection = productSelections[item.id] || {
                    productId: item.id,
                    selected: false,
                    assignedTo: [],
                  }

                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          checked={selection.selected}
                          onCheckedChange={(checked) => handleProductSelection(item.id!, checked as boolean)}
                        />
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${(Number(item.sell_price_inc_tax) || 0).toFixed(2)} × {item.quantity} = ${((Number(item.sell_price_inc_tax) || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {selection.selected && (
                        <div className="ml-6 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">¿Quién va a pagar este producto?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {bills.map((bill) => (
                              <label key={bill.id} className="flex items-center space-x-2 cursor-pointer">
                                <Checkbox
                                  checked={selection.assignedTo.includes(bill.id)}
                                  onCheckedChange={(checked) =>
                                    handlePersonAssignment(item.id!, bill.id, checked as boolean)
                                  }
                                />
                                <span className="text-sm">{bill.personName}</span>
                              </label>
                            ))}
                          </div>
                          {selection.assignedTo.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              Se dividirá entre {selection.assignedTo.length} personas
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Resumen y Confirmación */}
          {bills.length > 0 && selectedProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Productos seleccionados:</strong> {selectedProducts.length} de{" "}
                    {currentTable.currentOrder.items.length}
                  </p>
                  <p className="text-sm">
                    <strong>Personas:</strong> {bills.length}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  {selectedProducts.map((selection) => {
                    const product = currentTable.currentOrder?.items.find((item) => item.id === selection.productId)
                    if (!product) return null

                    return (
                      <div key={selection.productId} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span>
                          {selection.assignedTo.length === 1
                            ? bills.find((b) => b.id === selection.assignedTo[0])?.personName
                            : `${selection.assignedTo.length} personas`}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <Button onClick={handleConfirmAssignments} className="w-full" size="lg" disabled={!canProceed}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {canProceed ? "Proceder al Pago Dividido" : "Selecciona productos y asígnalos"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
