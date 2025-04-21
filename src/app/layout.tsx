// "use client"

// import { useState, useEffect } from "react"
// import { Inter } from 'next/font/google'
// import "./globals.css"
// import Header from "@/components/Header"
// import Sidebar from "@/components/Sidebar"
// import 'leaflet/dist/leaflet.css'
// import { Toaster } from 'react-hot-toast'
// import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'

// const inter = Inter({ subsets: ['latin'] })

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [totalEarnings, setTotalEarnings] = useState(0)

//   useEffect(() => {
//     const fetchTotalEarnings = async () => {
//       try {
//         const userEmail = localStorage.getItem('userEmail')
//         if (userEmail) {
//           const user = await getUserByEmail(userEmail)
//           console.log('user from layout', user);
          
//           if (user) {
//             const availableRewards = await getAvailableRewards(user.id) as any
//             console.log('availableRewards from layout', availableRewards);
//                         setTotalEarnings(availableRewards)
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching total earnings:', error)
//       }
//     }

//     fetchTotalEarnings()
//   }, [])

//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <div className="min-h-screen bg-gray-50 flex flex-col">
//           <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />
//           <div className="flex flex-1">
//             <Sidebar open={sidebarOpen} />
//             <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
//               {children}
//             </main>
//           </div>
//         </div>
//         <Toaster />
//       </body>
//     </html>
//   )
// }

// "use client"

// import { useState, useEffect } from "react"
// import { Inter } from 'next/font/google'
// import "./globals.css"
// import Header from "@/components/Header"
// import Sidebar from "@/components/Sidebar"
// import 'leaflet/dist/leaflet.css'
// import { Toaster } from 'react-hot-toast'
// import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'

// const inter = Inter({ subsets: ['latin'] })

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [totalEarnings, setTotalEarnings] = useState(0)
//   const [mounted, setMounted] = useState(false)
//   const [isMobile, setIsMobile] = useState(false)

//   // Set mounted state
//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   // Detect mobile screen size and set sidebar initial state
//   useEffect(() => {
//     if (!mounted) return
    
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 1024
//       setIsMobile(mobile)
      
//       // Auto-set initial sidebar state based on screen size
//       // On large screens, sidebar is open by default
//       // On mobile, sidebar is closed by default
//       setSidebarOpen(!mobile)
//     }
    
//     // Initialize on mount
//     checkMobile()
    
//     // Update on resize
//     window.addEventListener('resize', checkMobile)
//     return () => window.removeEventListener('resize', checkMobile)
//   }, [mounted])

//   useEffect(() => {
//     const fetchTotalEarnings = async () => {
//       try {
//         if (typeof window !== 'undefined') {
//           const userEmail = localStorage.getItem('userEmail')
//           if (userEmail) {
//             const user = await getUserByEmail(userEmail)
//             console.log('user from layout', user);
            
//             if (user) {
//               const availableRewards = await getAvailableRewards(user.id) as any
//               console.log('availableRewards from layout', availableRewards);
//               setTotalEarnings(availableRewards)
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching total earnings:', error)
//       }
//     }

//     if (mounted) {
//       fetchTotalEarnings()
//     }
//   }, [mounted])

//   // Single toggle function that will be used by both Header and Sidebar
//   const toggleSidebar = () => {
//     console.log("RootLayout: Toggling sidebar from", sidebarOpen, "to", !sidebarOpen)
//     setSidebarOpen(prevState => !prevState)
//   }

//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <div className="min-h-screen bg-gray-50 flex flex-col">
//           <Header 
//             id="header" 
//             onMenuClick={toggleSidebar} // Pass the toggle function
//             totalEarnings={totalEarnings} 
//             sidebarOpen={sidebarOpen} // Pass the current state
//           />
//           <div className="flex flex-1 relative">
//             <Sidebar 
//               id="sidebar" 
//               open={sidebarOpen} // Pass the current state
//               onClose={toggleSidebar} // Pass the SAME toggle function used in Header
//             />
//             {mounted && (
//               <div 
//                 className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 lg:hidden ${
//                   sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
//                 }`}
//                 onClick={toggleSidebar}
//               ></div>
//             )}
//             <main className={`flex-1 p-3 sm:p-4 lg:p-8 transition-all duration-300 w-full ${
//               isMobile ? 'ml-0' : (sidebarOpen ? 'lg:ml-64' : 'lg:ml-0')
//             }`}>
//               {children}
//             </main>
//           </div>
//         </div>
//         <Toaster />
//       </body>
//     </html>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import 'leaflet/dist/leaflet.css'
import { Toaster } from 'react-hot-toast'
import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect mobile screen size and set sidebar initial state
  useEffect(() => {
    if (!mounted) return
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      
      // Only set initial sidebar state on first load
      // Don't auto-change sidebar state on resize
      if (!mobile && sidebarOpen === false) {
        // If switching to desktop and sidebar was closed, open it
        setSidebarOpen(true)
      }
    }
    
    // Initialize on mount
    const mobile = window.innerWidth < 1024
    setIsMobile(mobile)
    // Set initial state only on first mount
    if (!mobile) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
    
    // Update only mobile detection on resize, don't auto-toggle sidebar
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mounted])

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        if (typeof window !== 'undefined') {
          const userEmail = localStorage.getItem('userEmail')
          if (userEmail) {
            const user = await getUserByEmail(userEmail)
            console.log('user from layout', user);
            
            if (user) {
              const availableRewards = await getAvailableRewards(user.id) as any
              console.log('availableRewards from layout', availableRewards);
              setTotalEarnings(availableRewards)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    if (mounted) {
      fetchTotalEarnings()
    }
  }, [mounted])

  // Single toggle function that will be used by both Header and Sidebar
  const toggleSidebar = () => {
    console.log("RootLayout: Toggling sidebar from", sidebarOpen, "to", !sidebarOpen)
    setSidebarOpen(prevState => !prevState)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header 
            id="header" 
            onMenuClick={toggleSidebar} // Pass the toggle function
            totalEarnings={totalEarnings} 
            sidebarOpen={sidebarOpen} // Pass the current state
          />
          <div className="flex flex-1 relative">
            <Sidebar 
              id="sidebar" 
              open={sidebarOpen} // Pass the current state
              onClose={toggleSidebar} // Pass the SAME toggle function used in Header
            />
            {mounted && (
              <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 lg:hidden ${
                  sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleSidebar}
              ></div>
            )}
            <main className={`flex-1 p-3 sm:p-4 lg:p-8 transition-all duration-300 w-full ${
              isMobile ? 'ml-0' : (sidebarOpen ? 'lg:ml-64' : 'lg:ml-0')
            }`}>
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}