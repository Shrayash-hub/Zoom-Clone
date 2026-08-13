import type React from 'react'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import layoutStyles from '@/components/layout/Layout.module.css'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fixed topbar spanning full width at z-index 200 */}
      <Topbar />

      {/* Fixed sidebar starting below topbar at z-index 100 */}
      <Sidebar />

      {/* Main content area offset by topbar height and sidebar width */}
      <main className={layoutStyles.main}>
        {children}
      </main>
    </>
  )
}
