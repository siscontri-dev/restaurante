"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Receipt, User, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTables, type Bill } from "../context/table-context"

interface SplitBillsData {
  tableId: number
  tableNumber: number
  bills: Bill[]
}

export default function SplitCheckoutPage() {
  const router = useRouter()
  const { completeTableOrder } = useTables()
  const [splitBillsData, setSplitBillsData] = useState<SplitBillsData | null>(null)
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set())
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({})

  useEffect(() => {
    const savedData = localStorage.getItem("split-bills-checkout")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setSplitBillsData(data)
        // Initialize payment methods
        const methods: Record<string, string> = {}
        data.bills.forEach((bill: Bill) => {
          methods[bill.id] = "card"
        })
        setPaymentMethods(methods)
      } catch (error) {
        console.error("Error parsing split bills data:", error)
        router.push("/tables")
      }
    } else {
      router.push("/tables")
    }
  }, [router])

  if (!splitBillsData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    )
  }

  const handlePayBill = (billId: string) => {
    setPaidBills((prev) => new Set([...prev, billId]))
  }

  const handlePaymentMethodChange = (billId: string, method: string) => {
    setPaymentMethods((prev) => ({ ...prev, [billId]: method }))
  }

  const handleCompleteAllPayments = () => {
    // Complete the table order
    completeTableOrder(splitBillsData.tableId)

    // Store receipt data for all bills
    localStorage.setItem(
      "split-receipts",
      JSON.stringify({
        ...splitBillsData,
        paidBills: Array.from(paidBills),
        paymentMethods,
        receiptNumber: Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleString(),
      }),
    )

    // Clear temp data
    localStorage.removeItem("split-bills-checkout")

    // Redirect to success page
    router.push("/split-success")
  }

  const allBillsPaid = splitBillsData.bills.every((bill) => paidBills.has(bill.id))
  const totalAmount = splitBillsData.bills.reduce((sum, bill) => sum + bill.total, 0)

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/tables")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mesas
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <Receipt className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Pago Dividido</h1>
          <p className="text-muted-foreground">
            Mesa {splitBillsData.tableNumber} • {splitBillsData.bills.length} personas
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Individual Bills */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cuentas Individuales</h2>
          {splitBillsData.bills.map((bill) => {
            const isPaid = paidBills.has(bill.id)
            return (
              <Card key={bill.id} className={isPaid ? "border-green-200 bg-green-50" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {bill.personName}
                      {isPaid && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                    <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-green-600" : ""}>
                      {isPaid ? "Pagado" : "Pendiente"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Items */}
                  <div className="space-y-1">
                    {bill.items.map((item) => (
                      <div key={`${item.productId}-${bill.id}`} className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          {item.quantity}x {item.product.name}
                          {item.isShared && (
                            <Badge variant="outline" className="text-xs">
                              Compartido
                            </Badge>
                          )}
                        </span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${bill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuestos (10%)</span>
                      <span>${bill.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${bill.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {!isPaid && (
                    <>
                      <Separator />
                      {/* Payment Method */}
                      <div>
                        <p className="text-sm font-medium mb-2">Método de Pago</p>
                        <RadioGroup
                          value={paymentMethods[bill.id]}
                          onValueChange={(value) => handlePaymentMethodChange(bill.id, value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="card" id={`card-${bill.id}`} />
                            <Label htmlFor={`card-${bill.id}`} className="flex items-center text-xs">
                              <CreditCard className="mr-1 h-3 w-3" />
                              Tarjeta
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cash" id={`cash-${bill.id}`} />
                            <Label htmlFor={`cash-${bill.id}`} className="flex items-center text-xs">
                              <Wallet className="mr-1 h-3 w-3" />
                              Efectivo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nequi" id={`nequi-${bill.id}`} />
                            <Label htmlFor={`nequi-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-purple-600 rounded mr-1"></div>
                              Nequi
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bancolombia" id={`bancolombia-${bill.id}`} />
                            <Label htmlFor={`bancolombia-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                              Bancolombia
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daviplata" id={`daviplata-${bill.id}`} />
                            <Label htmlFor={`daviplata-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
                              Daviplata
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="transferencia" id={`transferencia-${bill.id}`} />
                            <Label htmlFor={`transferencia-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                              Transferencia
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="addi" id={`addi-${bill.id}`} />
                            <Label htmlFor={`addi-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-pink-500 rounded mr-1"></div>
                              Addi
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sistecredito" id={`sistecredito-${bill.id}`} />
                            <Label htmlFor={`sistecredito-${bill.id}`} className="flex items-center text-xs">
                              <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                              Sistecredito
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Button className="w-full" onClick={() => handlePayBill(bill.id)}>
                        Pagar ${bill.total.toFixed(2)}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resumen General</h2>
          <Card>
            <CardHeader>
              <CardTitle>Estado del Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de cuentas:</span>
                  <span>{splitBillsData.bills.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuentas pagadas:</span>
                  <span className="text-green-600">{paidBills.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuentas pendientes:</span>
                  <span className="text-red-600">{splitBillsData.bills.length - paidBills.size}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total General:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Monto pagado:</span>
                  <span>
                    $
                    {splitBillsData.bills
                      .filter((bill) => paidBills.has(bill.id))
                      .reduce((sum, bill) => sum + bill.total, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCompleteAllPayments} disabled={!allBillsPaid}>
                {allBillsPaid
                  ? "Finalizar Todos los Pagos"
                  : `Faltan ${splitBillsData.bills.length - paidBills.size} pagos`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
