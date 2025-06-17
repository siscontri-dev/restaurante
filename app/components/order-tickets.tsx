"use client"

import { useState } from "react"
import { Printer, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTables, type Table } from "../context/table-context"

interface OrderTicketsProps {
  table: Table
}

export default function OrderTickets({ table }: OrderTicketsProps) {
  const { getOrderItemsByArea, printOrderByArea } = useTables()
  const [printingArea, setPrintingArea] = useState<string | null>(null)

  if (!table.currentOrder || table.currentOrder.items.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">No hay productos en esta mesa para imprimir comandas.</div>
    )
  }

  const itemsByArea = getOrderItemsByArea(table.id)
  const printedAreas = table.currentOrder.printedAreas || []

  const handlePrintArea = (area: string) => {
    setPrintingArea(area)

    // Simulamos la impresión
    setTimeout(() => {
      printOrderByArea(table.id, area)
      setPrintingArea(null)
    }, 1500)
  }

  const getAreaName = (area: string) => {
    switch (area) {
      case "kitchen":
        return "Cocina"
      case "cafeteria":
        return "Cafetería"
      case "bar":
        return "Bar"
      default:
        return area
    }
  }

  const getAreaIcon = (area: string) => {
    if (printedAreas.includes(area)) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Comandas por Área</h3>
        <Badge variant="outline">Mesa {table.number}</Badge>
      </div>

      {Object.keys(itemsByArea).length === 0 ? (
        <div className="text-center p-4 text-muted-foreground">No hay productos para imprimir</div>
      ) : (
        Object.entries(itemsByArea).map(([area, items]) => (
          <Card key={area} className={printedAreas.includes(area) ? "border-green-200 bg-green-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAreaName(area)}
                  {getAreaIcon(area)}
                </div>
                <Badge variant="outline">{items.length} productos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                {items.map((item) => (
                  <li key={item.id} className="text-sm flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                className="w-full"
                variant={printedAreas.includes(area) ? "outline" : "default"}
                disabled={printingArea === area || printedAreas.includes(area)}
                onClick={() => handlePrintArea(area)}
              >
                {printingArea === area ? (
                  <>
                    <span className="animate-pulse">Imprimiendo...</span>
                  </>
                ) : printedAreas.includes(area) ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Impreso
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir en {getAreaName(area)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {Object.keys(itemsByArea).length > 0 &&
        !Object.keys(itemsByArea).every((area) => printedAreas.includes(area)) && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>Hay comandas pendientes de imprimir</span>
          </div>
        )}
    </div>
  )
}
