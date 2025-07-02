"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserSearch, Loader2 } from "lucide-react"

interface Client {
  id: number;
  name: string;
}

interface ClientSearchDialogProps {
  onClientSelect: (client: Client) => void;
  selectedClient?: Client | null;
}

export default function ClientSearchDialog({ onClientSelect, selectedClient }: ClientSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        setLoading(true)
        setError(null)
        try {
          const token = localStorage.getItem('token')
          if (!token) throw new Error("Autenticación requerida")

          const response = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (!response.ok) throw new Error("Error al cargar clientes")

          const data = await response.json()
          setClients(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
          setLoading(false)
        }
      }
      fetchClients()
    }
  }, [isOpen])

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (client: Client) => {
    onClientSelect(client)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2 h-10 px-4 py-2 border border-input bg-background text-sm font-normal text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <UserSearch className="mr-2 h-4 w-4" />
          {selectedClient ? selectedClient.name : "Buscar Cliente"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Escribe para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mt-4 h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <ul>
              {filteredClients.map(client => (
                <li key={client.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(client)}>
                  {client.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 