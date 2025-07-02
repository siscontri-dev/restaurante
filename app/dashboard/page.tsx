"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Settings,
  Globe,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  MapPin,
  Clock,
  Database,
  BarChart,
  FileText,
  ChefHat,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTables } from "../context/table-context"
import { jwtDecode } from "jwt-decode"
import ProductManagement from "../components/product-management"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { tables } = useTables()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Verificar JWT en localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      router.replace("/login")
      return
    }
    try {
      // Decodificar y validar expiración
      const decoded: any = jwtDecode(token)
      if (!decoded.user_id || !decoded.business_id) {
        throw new Error("Token inválido")
      }
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    } catch (err) {
      localStorage.removeItem("token")
      router.replace("/login")
    }
  }, [router])

  // Statistics
  const totalTables = tables.length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  const totalProducts = 0 // Se obtendrá de la base de datos
  const onlineOrders = 12 // Mock data

  const stats = [
    {
      title: "Mesas Totales",
      value: totalTables,
      icon: LayoutDashboard,
      color: "bg-blue-500",
    },
    {
      title: "Mesas Ocupadas",
      value: occupiedTables,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Productos",
      value: totalProducts,
      icon: UtensilsCrossed,
      color: "bg-orange-500",
    },
    {
      title: "Pedidos Online",
      value: onlineOrders,
      icon: Globe,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard del Restaurante</h1>
            <p className="text-gray-600">Gestiona tu restaurante desde aquí</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/pos")} className="bg-orange-500 hover:bg-orange-600 text-white">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ir al POS
            </Button>
            <Button variant="outline" onClick={() => router.push("/tables")}>
              <MapPin className="mr-2 h-4 w-4" />
              Ver Mesas
            </Button>
            <Button variant="outline" onClick={() => router.push("/kitchen")}>
              <Clock className="mr-2 h-4 w-4" />
              Comandas
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meseros
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Página Web
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color}`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Button
                    className="h-20 flex flex-col gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => router.push("/pos")}
                  >
                    <ShoppingCart className="h-6 w-6" />
                    Abrir POS
                  </Button>
                  <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => router.push("/tables")}>
                    <LayoutDashboard className="h-6 w-6" />
                    Gestionar Mesas
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/kitchen")}
                  >
                    <ChefHat className="h-6 w-6" />
                    Ver Comandas
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/web-admin")}
                  >
                    <Globe className="h-6 w-6" />
                    Configurar Web
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/test-database")}
                  >
                    <Database className="h-6 w-6" />
                    Probar BD
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/products")}
                  >
                    <Package className="h-6 w-6" />
                    Gestionar Productos
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/clients")}
                  >
                    <Users className="h-6 w-6" />
                    Gestionar Clientes
                  </Button>
                  <Button
                    className="h-20 flex flex-col gap-2"
                    variant="outline"
                    onClick={() => router.push("/area-orders")}
                  >
                    <Settings className="h-6 w-6" />
                    Gestión de Áreas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Mesa 3 - Nuevo pedido</p>
                      <p className="text-sm text-gray-600">Pizza Pepperoni, Coca Cola</p>
                    </div>
                    <Badge variant="outline">Hace 5 min</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Pedido online #123456</p>
                      <p className="text-sm text-gray-600">Entrega a domicilio</p>
                    </div>
                    <Badge variant="outline">Hace 12 min</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Mesa 7 - Cuenta pagada</p>
                      <p className="text-sm text-gray-600">Total: $45.50</p>
                    </div>
                    <Badge variant="outline">Hace 18 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gestión de Mesas</h2>
              <Button onClick={() => router.push("/tables")}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Mesa
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card key={table.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Mesa {table.number}</h3>
                      <Badge
                        variant={table.status === "available" ? "default" : "secondary"}
                        className={
                          table.status === "available"
                            ? "bg-green-100 text-green-800"
                            : table.status === "occupied"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {table.status === "available"
                          ? "Libre"
                          : table.status === "occupied"
                            ? "Ocupada"
                            : table.status === "reserved"
                              ? "Reservada"
                              : "Limpieza"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Asientos: {table.seats}</p>
                      <p>Forma: {table.shape === "rectangle" ? "Rectangular" : "Circular"}</p>
                      {table.assignedWaiter && <p>Mesero: {table.assignedWaiter}</p>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gestión de Meseros</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Mesero
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Personal</h3>
                  <p className="text-gray-600 mb-4">Aquí podrás gestionar los meseros y su asignación a las mesas</p>
                  <Button>Próximamente</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductManagement />
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Configuración de Página Web</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open("/web", "_blank")}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Página Web
                </Button>
                <Button onClick={() => router.push("/web-admin")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de la Página Web</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Estado</span>
                      <Badge className="bg-green-100 text-green-800">Activa</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pedidos Online</span>
                      <Badge variant="outline">Habilitados</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Última actualización</span>
                      <span className="text-sm text-gray-600">Hace 2 horas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas Web</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Visitas hoy</span>
                      <span className="font-bold">127</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pedidos online</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Conversión</span>
                      <span className="font-bold">9.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuración Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => router.push("/web-admin")}
                  >
                    <Settings className="h-6 w-6" />
                    Configurar Contenido
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => window.open("/web", "_blank")}
                  >
                    <Eye className="h-6 w-6" />
                    Vista Previa
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Analíticas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
