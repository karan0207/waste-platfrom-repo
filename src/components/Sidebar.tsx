// "use client"

// import Link from "next/link"
// import { usePathname } from 'next/navigation'
// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { MapPin, Trash, Coins, Medal, Settings, Home, Car, X } from "lucide-react"

// const sidebarItems = [
//   { href: "/", icon: Home, label: "Home" },
//   { href: "/report", icon: MapPin, label: "Report Waste" },
//   { href: "/collect", icon: Trash, label: "Collect Waste" },
//   { href: "/rewards", icon: Coins, label: "Rewards" },
//   { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
// ]

// interface SidebarProps {
//   open: boolean;
//   id?: string;
//   onClose?: () => void;
// }

// export default function Sidebar({ open, id, onClose }: SidebarProps) {
//   const pathname = usePathname()
//   const [mounted, setMounted] = useState(false)
//   const [isMobile, setIsMobile] = useState(false)

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   // Add mobile detection
//   useEffect(() => {
//     if (!mounted) return
    
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 1024)
//     }
    
//     checkMobile()
//     window.addEventListener('resize', checkMobile)
//     return () => window.removeEventListener('resize', checkMobile)
//   }, [mounted])

//   // Debug sidebar state changes
//   useEffect(() => {
//     if (mounted) {
//       console.log("Sidebar: open state changed to", open);
//     }
//   }, [open, mounted]);

//   // Handle close sidebar button click
//   const handleCloseSidebar = (e: { stopPropagation: () => void }) => {
//     e.stopPropagation();
//     if (onClose) {
//       console.log("Sidebar: Close button clicked");
//       onClose();
//     }
//   };

//   // Handle navigation item click - close sidebar on mobile only
//   const handleNavItemClick = () => {
//     if (isMobile && onClose) {
//       console.log("Sidebar: Nav item clicked, closing sidebar on mobile");
//       onClose();
//     }
//   };

//   return (
//     <aside 
//       id={id}
//       className={`bg-white border-r pt-16 sm:pt-20 border-gray-200 text-gray-800 w-[85vw] sm:w-72 md:w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
//         open ? 'translate-x-0 shadow-xl' : '-translate-x-full'
//       } ${isMobile ? '' : ''} overflow-y-auto`}
//     >
//       <div className="lg:hidden absolute top-4 right-4">
//         <Button 
//           variant="ghost" 
//           size="icon" 
//           onClick={handleCloseSidebar}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           <X className="h-5 w-5" />
//         </Button>
//       </div>
      
//       <nav className="h-full flex flex-col justify-between">
//         <div className="px-4 py-4 sm:py-6 space-y-4 sm:space-y-8">
//           {sidebarItems.map((item) => (
//             <Link key={item.href} href={item.href} passHref>
//               <Button 
//                 variant={pathname === item.href ? "secondary" : "ghost"}
//                 className={`w-full justify-start py-2 sm:py-3 text-sm sm:text-base ${
//                   pathname === item.href 
//                     ? "bg-green-100 text-green-800" 
//                     : "text-gray-600 hover:bg-gray-100"
//                 }`} 
//                 onClick={handleNavItemClick}
//               >
//                 <item.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
//                 <span className="truncate">{item.label}</span>
//               </Button>
//             </Link>
//           ))}
//         </div>
//         <div className="p-4 border-t border-gray-200 mt-auto">
//           <Link href="/settings" passHref>
//             <Button 
//               variant={pathname === "/settings" ? "secondary" : "outline"}
//               className={`w-full py-2 sm:py-3 text-sm sm:text-base ${
//                 pathname === "/settings"
//                   ? "bg-green-100 text-green-800"
//                   : "text-gray-600 border-gray-300 hover:bg-gray-100"
//               }`} 
//               onClick={handleNavItemClick}
//             >
//               <Settings className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
//               <span className="truncate">Settings</span>
//             </Button>
//           </Link>
//         </div>
//       </nav>
//     </aside>
//   )
// }

"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Trash, Coins, Medal, Settings, Home, X } from "lucide-react"

const sidebarItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/report", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
]

interface SidebarProps {
  open: boolean;
  id?: string;
  onClose?: () => void;
}

export default function Sidebar({ open, id, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Add mobile detection
  useEffect(() => {
    if (!mounted) return
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mounted])

  // Debug sidebar state changes
  useEffect(() => {
    if (mounted) {
      console.log("Sidebar: open state changed to", open);
    }
  }, [open, mounted]);

  // Handle close sidebar button click
  const handleCloseSidebar = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onClose) {
      console.log("Sidebar: Close button clicked");
      onClose();
    }
  };

  // Handle navigation item click - close sidebar on mobile only
  const handleNavItemClick = () => {
    if (isMobile && onClose) {
      console.log("Sidebar: Nav item clicked, closing sidebar on mobile");
      onClose();
    }
  };

  return (
    <aside 
      id={id}
      className={`bg-gradient-to-b from-white to-green-50 border-r pt-16 sm:pt-20 border-gray-200 text-gray-800 w-[85vw] sm:w-72 md:w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      } ${isMobile ? '' : ''} overflow-y-auto`}
    >
      <div className="lg:hidden absolute top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCloseSidebar}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-4">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button 
                variant="ghost"
                className={`w-full justify-start h-auto py-3 my-1 transition-all duration-200 ${
                  pathname === item.href 
                    ? "bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-green-700 border-l-3 border-green-500 font-medium" 
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-green-500/5 hover:to-emerald-500/5 hover:border-l-3 hover:border-green-200"
                }`} 
                onClick={handleNavItemClick}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname === item.href ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="text-base">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 mt-auto">
          <Link href="/settings" passHref>
            <Button 
              variant="ghost"
              className={`w-full justify-start h-auto py-3 transition-all duration-200 ${
                pathname === "/settings"
                  ? "bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-green-700 border-l-3 border-green-500 font-medium"
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-green-500/5 hover:to-emerald-500/5 hover:border-l-3 hover:border-green-200"
              }`} 
              onClick={handleNavItemClick}
            >
              <Settings className={`mr-3 h-5 w-5 flex-shrink-0 ${pathname === "/settings" ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="text-base">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </aside>
  )
}