"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Settings, Type, Palette, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface WebConfig {
  // Hero Section
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  heroButtonText: string
  heroSecondaryButtonText: string

  // Company Info
  companyName: string
  companySlogan: string
  companyLogo: string

  // Contact Info
  phone: string
  address: string

  // Promotional Banner
  promoTitle: string
  promoDescription: string
  promoDiscount: string
  promoButtonText: string

  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string

  // Features
  feature1Title: string
  feature1Description: string
  feature2Title: string
  feature2Description: string
  feature3Title: string
  feature3Description: string
}

const defaultConfig: WebConfig = {
  heroTitle: "Sabores que Conquistan",
  heroSubtitle: "Sabor que conquista",
  heroDescription:
    "Descubre una experiencia culinaria única con ingredientes frescos y sabores auténticos que despertarán todos tus sentidos.",
  heroButtonText: "🛒 Pedir Ahora",
  heroSecondaryButtonText: "📱 Ver Menú",

  companyName: "DeliciousEats",
  companySlogan: "Sabor que conquista",
  companyLogo: "🍕",

  phone: "+57 300 123 4567",
  address: "Calle 123 #45-67, Bogotá, Colombia",

  promoTitle: "¡50% OFF en tu Primer Pedido!",
  promoDescription:
    "Únete a nuestra familia y disfruta de un descuento increíble en tu primera orden. ¡No te lo pierdas!",
  promoDiscount: "50%",
  promoButtonText: "🎯 Reclamar Oferta",

  primaryColor: "#f97316", // orange-500
  secondaryColor: "#dc2626", // red-600
  accentColor: "#7c3aed", // violet-600

  feature1Title: "Entrega Rápida",
  feature1Description: "En 30 minutos o menos",
  feature2Title: "Abierto 24/7",
  feature2Description: "Siempre disponible para ti",
  feature3Title: "Calidad Premium",
  feature3Description: "Ingredientes frescos diarios",
}

export default function WebAdminPage() {
  const router = useRouter()
  const [config, setConfig] = useState<WebConfig>(defaultConfig)
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("web-config")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    localStorage.setItem("web-config", JSON.stringify(config))

    setTimeout(() => {
      setIsSaving(false)
      // Show success message or redirect
    }, 1000)
  }

  const handleInputChange = (field: keyof WebConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handlePreview = () => {
    // Save current config before preview
    localStorage.setItem("web-config", JSON.stringify(config))
    window.open("/web", "_blank")
  }

  const handleReset = () => {
    setConfig(defaultConfig)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/tables")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Configuración Web</h1>
              <p className="text-sm text-muted-foreground">Personaliza tu página web</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Contenido
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Diseño
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Características
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={config.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="DeliciousEats"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companySlogan">Eslogan</Label>
                    <Input
                      id="companySlogan"
                      value={config.companySlogan}
                      onChange={(e) => handleInputChange("companySlogan", e.target.value)}
                      placeholder="Sabor que conquista"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyLogo">Logo (Emoji o URL)</Label>
                  <Input
                    id="companyLogo"
                    value={config.companyLogo}
                    onChange={(e) => handleInputChange("companyLogo", e.target.value)}
                    placeholder="🍕"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={config.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={config.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Calle 123 #45-67, Bogotá, Colombia"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sección Principal (Hero)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heroTitle">Título Principal</Label>
                  <Input
                    id="heroTitle"
                    value={config.heroTitle}
                    onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                    placeholder="Sabores que Conquistan"
                  />
                </div>
                <div>
                  <Label htmlFor="heroDescription">Descripción</Label>
                  <Textarea
                    id="heroDescription"
                    value={config.heroDescription}
                    onChange={(e) => handleInputChange("heroDescription", e.target.value)}
                    placeholder="Descripción atractiva de tu negocio..."
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="heroButtonText">Botón Principal</Label>
                    <Input
                      id="heroButtonText"
                      value={config.heroButtonText}
                      onChange={(e) => handleInputChange("heroButtonText", e.target.value)}
                      placeholder="🛒 Pedir Ahora"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroSecondaryButtonText">Botón Secundario</Label>
                    <Input
                      id="heroSecondaryButtonText"
                      value={config.heroSecondaryButtonText}
                      onChange={(e) => handleInputChange("heroSecondaryButtonText", e.target.value)}
                      placeholder="📱 Ver Menú"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner Promocional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="promoTitle">Título de la Promoción</Label>
                  <Input
                    id="promoTitle"
                    value={config.promoTitle}
                    onChange={(e) => handleInputChange("promoTitle", e.target.value)}
                    placeholder="¡50% OFF en tu Primer Pedido!"
                  />
                </div>
                <div>
                  <Label htmlFor="promoDescription">Descripción de la Promoción</Label>
                  <Textarea
                    id="promoDescription"
                    value={config.promoDescription}
                    onChange={(e) => handleInputChange("promoDescription", e.target.value)}
                    placeholder="Descripción de la oferta..."
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promoDiscount">Descuento</Label>
                    <Input
                      id="promoDiscount"
                      value={config.promoDiscount}
                      onChange={(e) => handleInputChange("promoDiscount", e.target.value)}
                      placeholder="50%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="promoButtonText">Botón de la Promoción</Label>
                    <Input
                      id="promoButtonText"
                      value={config.promoButtonText}
                      onChange={(e) => handleInputChange("promoButtonText", e.target.value)}
                      placeholder="🎯 Reclamar Oferta"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Colores del Sitio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                        placeholder="#f97316"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.secondaryColor}
                        onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                        placeholder="#dc2626"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Color de Acento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => handleInputChange("accentColor", e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.accentColor}
                        onChange={(e) => handleInputChange("accentColor", e.target.value)}
                        placeholder="#7c3aed"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vista Previa de Colores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{
                      background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    Gradiente Principal
                  </div>
                  <div
                    className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    Color de Acento
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Características Destacadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Característica 1</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feature1Title">Título</Label>
                      <Input
                        id="feature1Title"
                        value={config.feature1Title}
                        onChange={(e) => handleInputChange("feature1Title", e.target.value)}
                        placeholder="Entrega Rápida"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feature1Description">Descripción</Label>
                      <Input
                        id="feature1Description"
                        value={config.feature1Description}
                        onChange={(e) => handleInputChange("feature1Description", e.target.value)}
                        placeholder="En 30 minutos o menos"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Característica 2</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feature2Title">Título</Label>
                      <Input
                        id="feature2Title"
                        value={config.feature2Title}
                        onChange={(e) => handleInputChange("feature2Title", e.target.value)}
                        placeholder="Abierto 24/7"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feature2Description">Descripción</Label>
                      <Input
                        id="feature2Description"
                        value={config.feature2Description}
                        onChange={(e) => handleInputChange("feature2Description", e.target.value)}
                        placeholder="Siempre disponible para ti"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Característica 3</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feature3Title">Título</Label>
                      <Input
                        id="feature3Title"
                        value={config.feature3Title}
                        onChange={(e) => handleInputChange("feature3Title", e.target.value)}
                        placeholder="Calidad Premium"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feature3Description">Descripción</Label>
                      <Input
                        id="feature3Description"
                        value={config.feature3Description}
                        onChange={(e) => handleInputChange("feature3Description", e.target.value)}
                        placeholder="Ingredientes frescos diarios"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Configuración Web</Badge>
            <span className="text-sm text-muted-foreground">Los cambios se guardan automáticamente</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Valores
            </Button>
            <Button onClick={handlePreview} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Ver Página Web
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
