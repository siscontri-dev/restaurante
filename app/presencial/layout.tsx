import type React from "react"
import { CartProvider } from "../context/cart-context"

export default function PresencialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}
