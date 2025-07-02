import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthCheck } from "./components/auth-check"
import { LogoutButton } from "./components/logout-button"
import { TableProvider } from "./context/table-context"
import { CartProvider } from "./context/cart-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Restaurante",
  description: "Sistema de gestión para restaurantes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <TableProvider>
          <CartProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <AuthCheck>
                <div className="min-h-screen flex flex-col">
                  {/* Header con botón de logout */}
                  <header className="border-b">
                    <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                      <h1 className="text-xl font-semibold">Sistema de Restaurante</h1>
                      <LogoutButton />
                    </div>
                  </header>

                  {/* Contenido principal */}
                  <main className="flex-1 container mx-auto px-4 py-8">
                    {children}
                  </main>
                </div>
              </AuthCheck>
            </ThemeProvider>
          </CartProvider>
        </TableProvider>
      </body>
    </html>
  )
}
