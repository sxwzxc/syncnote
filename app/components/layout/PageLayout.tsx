interface PageLayoutProps {
  children: React.ReactNode
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  )
}
