import Header from "../Header"
import RouteIndicator from "../RouteIndicator"

interface PageLayoutProps {
  children: React.ReactNode
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      {children}
      <RouteIndicator />
    </main>
  )
}