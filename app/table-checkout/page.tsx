"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTables } from "../context/table-context"
import { useCart } from "../context/cart-context"

interface TempOrder {
  tableId: number
  tableNumber: number
  items: Array<{ id: number; name: string; price: number; quantity: number; image: string }>
  total: number
}

// ID de cliente POS genérico, AJUSTA este valor según tu base de datos
const CONTACT_ID_POS = 11405;

export default function TableCheckoutPage() {
  const router = useRouter()
  const { completeTableOrder, clearTableOrder } = useTables()
  const { cart, cartTotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [tempOrder, setTempOrder] = useState<TempOrder | null>(null)
  const [fromCart, setFromCart] = useState(false)

  useEffect(() => {
    // Forzar recarga del carrito si el contexto está vacío pero localStorage tiene productos
    if (cart.length === 0) {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setFromCart(true)
            setTempOrder({
              tableId: 0,
              tableNumber: 0,
              items: parsedCart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.sell_price_inc_tax,
                quantity: item.quantity,
                image: item.image || ""
              })),
              total: parsedCart.reduce((total, item) => total + item.sell_price_inc_tax * item.quantity, 0)
            })
            return
          }
        } catch (e) { /* ignorar */ }
      }
    }
    console.log('Contenido del carrito (cart):', cart)
    console.log('Contenido de temp-checkout-order:', localStorage.getItem("temp-checkout-order"))
    const savedOrder = localStorage.getItem("temp-checkout-order")
    if (savedOrder) {
      try {
        setTempOrder(JSON.parse(savedOrder))
      } catch (error) {
        console.error("Error parsing temp order:", error)
        router.push("/tables")
      }
    } else if (cart.length > 0) {
      // Si no hay pedido de mesa pero sí hay carrito global, usarlo
      setFromCart(true)
      setTempOrder({
        tableId: 0,
        tableNumber: 0,
        items: cart.map(item => ({
          id: item.id!,
          name: item.name,
          price: item.sell_price_inc_tax,
          quantity: item.quantity,
          image: item.image || ""
        })),
        total: cartTotal
      })
    } else {
      // Mostrar mensaje en vez de redirigir
      setTempOrder(null)
    }
  }, [router, cart, cartTotal])

  if (!tempOrder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No hay productos en el carrito</h1>
          <p className="mt-2 text-muted-foreground">Agrega productos en el POS antes de facturar.</p>
          <Button className="mt-4" onClick={() => router.push("/pos")}>Ir al POS</Button>
        </div>
      </div>
    )
  }

  const tax = tempOrder.total * 0.1
  const grandTotal = tempOrder.total + tax

  const handlePayment = async () => {
    try {
      // Get current business location
      const businessLocation = localStorage.getItem('selectedLocation')
      if (!businessLocation) {
        alert('Error: No se ha seleccionado una ubicación de negocio')
        return
      }

      const location = JSON.parse(businessLocation)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Error: No se ha encontrado el token de autenticación')
        return
      }

      // 1. Reserva y obtiene el número de factura ÚNICO
      const reserveResponse = await fetch(`/api/invoice-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location_id: location.id
        }),
      })

      if (!reserveResponse.ok) {
        throw new Error('Error reservando número de factura')
      }

      const reserveData = await reserveResponse.json()

      // 2. Create transaction in database
      const transactionData = {
        location_id: location.id,
        contact_id: CONTACT_ID_POS, // Cliente genérico POS (ajusta este valor)
        invoice_number: Number(reserveData.reserved_number),
        prefix: reserveData.prefix || "POSE",
        final_total: grandTotal,
        custom_fields: { payment_method: paymentMethod },
        res_table_id: tempOrder.tableId > 0 ? tempOrder.tableId : null,
        items: tempOrder.items
      }
      // Validación y log
      console.log('transactionData a enviar:', transactionData)
      if (!transactionData.location_id || !transactionData.contact_id || transactionData.invoice_number === undefined || !transactionData.prefix || transactionData.final_total === undefined) {
        alert('Faltan datos para la transacción: ' + JSON.stringify(transactionData))
        return
      }

      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionData),
      })

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json();
        throw new Error('Error creando transacción en base de datos: ' + (errorData.error || ''))
      }

      const transactionResult = await transactionResponse.json()

      // Registrar el pago en transaction_payments
      await fetch('/api/transaction-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: transactionResult.id || transactionResult.transaction_id,
          method: paymentMethod,
          amount: grandTotal
        })
      })

      // Complete the order
      completeTableOrder(tempOrder.tableId)

      // Store receipt data with real invoice number
      localStorage.setItem(
        "table-receipt",
        JSON.stringify({
          ...tempOrder,
          tax,
          grandTotal,
          paymentMethod,
          receiptNumber: `${reserveData.prefix}${reserveData.reserved_number}`,
          date: new Date().toLocaleString(),
          transactionId: transactionResult.id,
        }),
      )

      // Clear temp order
      localStorage.removeItem("temp-checkout-order")
      // Limpiar carrito global si es pedido POS
      if (fromCart) {
        clearCart()
      }

      // Redirect to success page
      router.push("/table-success")

    } catch (error) {
      console.error('Error processing payment:', error)
      alert(`Error procesando el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
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
          {fromCart ? (
            <p className="text-muted-foreground">Pedido POS (sin mesa)</p>
          ) : (
            <p className="text-muted-foreground">Mesa {tempOrder.tableNumber}</p>
          )}
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
                    ${(Number(item.price) || 0).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${((Number(item.price) || 0) * item.quantity).toFixed(2)}</p>
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
