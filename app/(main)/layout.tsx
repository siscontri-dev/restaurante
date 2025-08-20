import { AuthCheck } from "../components/auth-check"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheck>
      <div className="min-h-screen flex flex-col">
        {/* Contenido principal */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
} 