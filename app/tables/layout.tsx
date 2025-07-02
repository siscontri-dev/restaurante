import { CartProvider } from "../context/cart-context";

export default function TablesLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
} 