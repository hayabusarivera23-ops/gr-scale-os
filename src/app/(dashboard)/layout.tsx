import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar; on mobile the Header hamburger opens it as a drawer */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col md:ml-56 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
