// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut, X, Settings } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK, WALLET_ADAPTERS } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"
import { toast } from 'react-hot-toast'

// Define the Notification interface
interface Notification {
  id: number;
  type: string;
  message: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
  id?: string;
  sidebarOpen: boolean; // Sidebar state passed from layout
}

export default function Header({ onMenuClick, totalEarnings, id, sidebarOpen }: HeaderProps) {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [balance, setBalance] = useState(0)
  const web3authRef = useRef<Web3Auth | null>(null);
  const [isWeb3AuthReady, setIsWeb3AuthReady] = useState(false);
  
  // Client-side rendering safety
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Mobile detection without causing hydration mismatch
  const [isMobileState, setIsMobileState] = useState(false)
  const [isSmallMobileState, setIsSmallMobileState] = useState(false)
  
  // Use SSR-safe media query detection
  useEffect(() => {
    if (!mounted) return;
    
    const checkMobile = () => {
      setIsMobileState(window.innerWidth < 768)
      setIsSmallMobileState(window.innerWidth < 475)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mounted])
  
  // Only use isMobile and isSmallMobile after component has mounted
  const isMobile = mounted ? isMobileState : false
  const isSmallMobile = mounted ? isSmallMobileState : false

  // Lazy initialization of Web3Auth - this runs only once when component mounts
  useEffect(() => {
    if (!mounted) return;
    
    // Set a timeout to initialize Web3Auth after component renders
    // This prevents blocking the initial UI rendering
    const timeoutId = setTimeout(() => {
      const init = async () => {
        try {
          // Skip initialization if already done
          if (web3authRef.current) {
            setLoading(false);
            return;
          }
          
          console.log("Initializing Web3Auth...");
          const clientId = "BNz8NqlHT2yX1gsavBFtTLm74eHw03HkL0Vdri6wFnUpRLxKGS4kgtIGshQUDJJn_qPJBlzpbVomgx43B_WHX0g";

          const chainConfig = {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0xaa36a7", // Sepolia testnet
            rpcTarget: "https://ethereum-sepolia.publicnode.com",
            displayName: "Ethereum Sepolia Testnet",
            blockExplorerUrl: "https://sepolia.etherscan.io",
            ticker: "ETH",
            tickerName: "Ethereum",
          };

          const privateKeyProvider = new EthereumPrivateKeyProvider({
            config: { chainConfig },
          });

          // Create the Web3Auth instance with proper configuration
          const web3auth = new Web3Auth({
            clientId,
            web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
            privateKeyProvider,
            uiConfig: {
              appName: "waste-management-platform",
              mode: "dark",
              loginMethodsOrder: ["google", "facebook", "twitter", "apple", "email_passwordless"]
            },
            enableLogging: false, // Disable logging in production
            storageKey: "waste-management-platform",
            sessionTime: 86400, // 24 hour in seconds
            whiteLabel: {
              name: "EcoCollect",
              defaultLanguage: "en",
              dark: true
            }
          });

          web3authRef.current = web3auth;
          
          // Set a timeout for initializing the modal to prevent long blocking operations
          const modalInitTimeout = setTimeout(async () => {
            try {
              // Initialize the modal with popup configurations
              await web3authRef.current.initModal({
                modalConfig: {
                  [WALLET_ADAPTERS.OPENLOGIN]: {
                    label: "openlogin",
                    loginMethods: {
                      google: {
                        name: "Google",
                        showOnModal: true
                      },
                      facebook: {
                        name: "Facebook",
                        showOnModal: true
                      },
                      twitter: {
                        name: "Twitter",
                        showOnModal: true
                      },
                      email_passwordless: {
                        name: "Email",
                        showOnModal: true
                      }
                    },
                    showOnDesktop: true,
                    showOnMobile: true
                  }
                }
              });
              
              setIsWeb3AuthReady(true);
              console.log("Web3Auth modal initialized");
              
              // Check if already connected
              if (web3authRef.current.connected) {
                setLoggedIn(true);
                setProvider(web3authRef.current.provider);
                
                try {
                  const user = await web3authRef.current.getUserInfo();
                  setUserInfo(user);
                  
                  if (user.email) {
                    localStorage.setItem('userEmail', user.email);
                    try {
                      await createUser(user.email, user.name || 'Anonymous User');
                    } catch (error) {
                      console.error("Error creating user:", error);
                    }
                  }
                } catch (err) {
                  console.error("Error getting user info:", err);
                }
              }
            } catch (err) {
              console.error("Error initializing Web3Auth modal:", err);
            } finally {
              // Always set loading to false, even if initialization fails
              setLoading(false);
            }
          }, 500); // 500ms delay for modal initialization
          
          return () => clearTimeout(modalInitTimeout);
        } catch (error) {
          console.error("Error setting up Web3Auth:", error);
          setLoading(false);
        }
      };

      init();
    }, 100); // 100ms delay to ensure component renders first
    
    return () => clearTimeout(timeoutId);
  }, [mounted]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo && userInfo.email) {
        try {
          const user = await getUserByEmail(userInfo.email);
          if (user) {
            const unreadNotifications = await getUnreadNotifications(user.id);
            setNotifications(unreadNotifications);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    if (userInfo && userInfo.email) {
      fetchNotifications();
      
      // Set up periodic checking for new notifications
      const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      
      return () => clearInterval(notificationInterval);
    }
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userInfo && userInfo.email) {
        try {
          const user = await getUserByEmail(userInfo.email);
          if (user) {
            const userBalance = await getUserBalance(user.id);
            setBalance(userBalance);
          }
        } catch (error) {
          console.error("Error fetching user balance:", error);
        }
      }
    };

    if (userInfo && userInfo.email) {
      fetchUserBalance();
      
      // Add an event listener for balance updates
      const handleBalanceUpdate = (event: CustomEvent) => {
        setBalance(event.detail);
      };

      window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
      
      return () => {
        window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
      };
    }
  }, [userInfo, getUserBalance]);

  const login = async () => {
    // Show loading state while trying to login
    setLoading(true);
    
    try {
      if (!web3authRef.current) {
        console.log("Web3Auth not initialized yet, initializing now");
        
        // Create a simplified version for login only
        const clientId = "BNz8NqlHT2yX1gsavBFtTLm74eHw03HkL0Vdri6wFnUpRLxKGS4kgtIGshQUDJJn_qPJBlzpbVomgx43B_WHX0g";
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xaa36a7",
          rpcTarget: "https://ethereum-sepolia.publicnode.com",
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3auth = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
          uiConfig: {
            appName: "EcoCollect",
            mode: "dark",
            loginMethodsOrder: ["google", "facebook", "twitter", "email_passwordless"]
          },
          enableLogging: false,
          storageKey: "waste-management-platform",
        });

        web3authRef.current = web3auth;
      }
      
      if (!isWeb3AuthReady) {
        console.log("Web3Auth modal not initialized yet, initializing now");
        try {
          await web3authRef.current.initModal({
            modalConfig: {
              [WALLET_ADAPTERS.OPENLOGIN]: {
                label: "openlogin",
                loginMethods: {
                  google: { name: "Google", showOnModal: true },
                  facebook: { name: "Facebook", showOnModal: true },
                  twitter: { name: "Twitter", showOnModal: true },
                  email_passwordless: { name: "Email", showOnModal: true }
                },
                showOnDesktop: true,
                showOnMobile: true
              }
            }
          });
          setIsWeb3AuthReady(true);
        } catch (error) {
          console.error("Error initializing Web3Auth modal:", error);
          toast.error("Error setting up login. Please try again later.");
          setLoading(false);
          return;
        }
      }
      
      const web3authProvider = await web3authRef.current.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      
      const user = await web3authRef.current.getUserInfo();
      setUserInfo(user);
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
      
      toast.success("Login successful!");
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Login failed. Please try again or use a different method.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!web3authRef.current) {
      console.log("web3auth not initialized yet");
      return;
    }
    
    try {
      await web3authRef.current.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const getUserInfo = async () => {
    if (!web3authRef.current || !web3authRef.current.connected) {
      console.log("web3auth not connected");
      return;
    }
    
    try {
      const user = await web3authRef.current.getUserInfo();
      setUserInfo(user);
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Simplified menu button click handler that directly calls the parent function
  const handleMenuClick = (e) => {
    e.stopPropagation();
    console.log("Header: Menu button clicked, toggling sidebar. Current state:", sidebarOpen);
    onMenuClick(); // Call the toggle function from parent
  };

  const toggleMobileSearch = () => {
    setShowSearchMobile(!showSearchMobile);
  };

  // Instead of returning a loading state, we'll render the header with a skeleton UI
  // This allows the header to be visible immediately while Web3Auth loads in the background

  return (
    <header id={id} className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 h-1"></div>
      <div className="flex items-center justify-between px-3 sm:px-4 py-3">
        <div className="flex items-center">
          <Button 
            id="menu-button" 
            variant="ghost" 
            size="icon" 
            className={`mr-1 sm:mr-2 md:mr-4 transition-colors duration-200 ${sidebarOpen ? 'bg-green-50 text-green-600' : 'text-gray-800 hover:bg-green-50 hover:text-green-600'}`}
            onClick={handleMenuClick}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <Link href="/" className="flex items-center group">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-full transition-transform group-hover:scale-110 duration-200">
              <Leaf className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="flex flex-col ml-2">
              <span className="font-bold text-sm sm:text-base md:text-lg bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">EcoCollect</span>
              <span className="text-[8px] md:text-[10px] text-gray-500 -mt-1">UIT 25</span>
            </div>
          </Link>
        </div>

        {/* Mobile search - expanded */}
        {isMobile && showSearchMobile && (
          <div className="absolute inset-x-0 top-0 bg-white z-50 p-2 flex items-center shadow-md">
            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleMobileSearch}>
              <X className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search tasks or reports..."
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                autoFocus
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </div>
        )}
        
        {/* Desktop search */}
        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks or reports..."
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        
        {/* Right side actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full hover:bg-green-50 transition-colors duration-200"
              >
                <Bell className="h-5 w-5 text-gray-700" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 bg-green-500 hover:bg-green-600">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-lg">
              <div className="text-sm font-semibold text-gray-700 pb-2 mb-2 border-b border-gray-100">
                Notifications
              </div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className="rounded-lg px-3 py-2 mb-1 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No new notifications</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Balance */}
          <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-2 sm:px-3 py-1 border border-green-100">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-600" />
            <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-800">
              {isSmallMobile ? balance.toFixed(0) : balance.toFixed(2)}
            </span>
          </div>
          
          {/* Login/User menu */}
          {!loggedIn ? (
            <Button 
              onClick={login}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1 h-auto rounded-full shadow-sm transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  {!isSmallMobile && 'Connecting...'}
                </>
              ) : (
                <>
                  {isSmallMobile ? '' : 'Login'}
                  <LogIn className="ml-0 sm:ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
                </>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 rounded-full hover:bg-green-50 transition-colors duration-200"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1 hidden sm:block text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-2 rounded-xl shadow-lg">
                <div className="text-sm font-semibold text-gray-700 pb-2 mb-2 border-b border-gray-100 px-2">
                  {userInfo ? (userInfo.name.length > 20 ? userInfo.name.substring(0, 20) + '...' : userInfo.name) : "Account"}
                </div>
               
                <DropdownMenuItem className="rounded-lg px-3 py-2 mb-1 hover:bg-green-50 focus:bg-green-50 cursor-pointer">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="h-4 w-4 mr-2 text-gray-500" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}