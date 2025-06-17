"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTables } from "../context/table-context"

interface TempOrder {
  tableId: number
  tableNumber: number
  items: Array<{ id: number; name: string; price: number; quantity: number; image: string }>
  total: number
}

export default function TableCheckoutPage() {
  const router = useRouter()
  const { completeTableOrder, clearTableOrder } = useTables()
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [tempOrder, setTempOrder] = useState<TempOrder | null>(null)

  useEffect(() => {
    const savedOrder = localStorage.getItem("temp-checkout-order")
    if (savedOrder) {
      try {
        setTempOrder(JSON.parse(savedOrder))
      } catch (error) {
        console.error("Error parsing temp order:", error)
        router.push("/tables")
      }
    } else {
      router.push("/tables")
    }
  }, [router])

  if (!tempOrder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    )
  }

  const tax = tempOrder.total * 0.1
  const grandTotal = tempOrder.total + tax

  const handlePayment = () => {
    // Complete the order
    completeTableOrder(tempOrder.tableId)

    // Store receipt data
    localStorage.setItem(
      "table-receipt",
      JSON.stringify({
        ...tempOrder,
        tax,
        grandTotal,
        paymentMethod,
        receiptNumber: Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleString(),
      }),
    )

    // Clear temp order
    localStorage.removeItem("temp-checkout-order")

    // Redirect to success page
    router.push("/table-success")
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/tables")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mesas
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <Receipt className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Mesa {tempOrder.tableNumber}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Resumen del Pedido</h2>
          <div className="rounded-lg border p-4 bg-white">
            {tempOrder.items.map((item) => (
              <div key={item.id} className="mb-3 flex items-center gap-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${tempOrder.total.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Impuestos (10%)</p>
                <p>${tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <p>Total</p>
                <p>${grandTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Método de Pago</h2>
          <div className="rounded-lg border p-4 bg-white">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tarjeta Débito/Crédito
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  Efectivo
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-green-50">
                <RadioGroupItem value="nequi" id="nequi" />
                <Label htmlFor="nequi" className="flex items-center">
                  <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                  Nequi
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-yellow-50">
                <RadioGroupItem value="bancolombia" id="bancolombia" />
                <Label htmlFor="bancolombia" className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  Bancolombia
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-orange-50">
                <RadioGroupItem value="daviplata" id="daviplata" />
                <Label htmlFor="daviplata" className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                  Daviplata
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-blue-50">
                <RadioGroupItem value="transferencia" id="transferencia" />
                <Label htmlFor="transferencia" className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  Transferencia Bancaria
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-pink-50">
                <RadioGroupItem value="addi" id="addi" />
                <Label htmlFor="addi" className="flex items-center">
                  <div className="w-4 h-4 bg-pink-500 rounded mr-2"></div>
                  Addi (Crédito)
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-red-50">
                <RadioGroupItem value="sistecredito" id="sistecredito" />
                <Label htmlFor="sistecredito" className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  Sistecredito
                </Label>
              </div>
            </RadioGroup>

            <Button className="mt-6 w-full" size="lg" onClick={handlePayment}>
              Procesar Pago - ${grandTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
