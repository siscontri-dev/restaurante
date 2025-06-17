import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DeliciousEats - Sabor que Conquista",
  description:
    "Descubre una experiencia culinaria única con ingredientes frescos y sabores auténticos. Pedidos online 24/7.",
  keywords: "comida, delivery, restaurante, pedidos online, comida rápida",
}

export default function WebLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
