// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import ContractInteraction from '@/components/ContractInteraction'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK, WALLET_ADAPTERS } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { createUser } from '@/utils/db/actions'

const poppins = Poppins({ 
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedGlobe() {
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto mb-4 sm:mb-6">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-green-300 to-teal-400 opacity-30 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-gradient-to-l from-emerald-200 to-green-400 opacity-50 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-teal-100 to-green-300 opacity-70 animate-bounce"></div>
      <div className="absolute inset-0 m-auto flex items-center justify-center">
        <Leaf className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-green-600 drop-shadow-lg" />
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const web3authRef = useRef(null);
  const [isWeb3AuthReady, setIsWeb3AuthReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  // Check if component is mounted (client-side)
  useEffect(() => {
    setMounted(true);
    console.log("Component mounted");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is logged in
    const userEmail = localStorage.getItem('userEmail');
    setLoggedIn(!!userEmail);
    console.log("Auth check: User email in localStorage:", userEmail ? "exists" : "doesn't exist");
    
    // Initialize Web3Auth
    const initWeb3Auth = async () => {
      try {
        console.log("Starting Web3Auth initialization");
        
        // Skip initialization if already done
        if (web3authRef.current) {
          console.log("Web3Auth already initialized");
          setIsWeb3AuthReady(true);
          return;
        }
        
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

        console.log("Creating Web3Auth instance");
        const web3auth = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
          uiConfig: {
            appName: "waste-management-platform",
            mode: "dark",
            loginMethodsOrder: ["google", "facebook", "twitter", "apple", "email_passwordless"]
          },
          enableLogging: true, // Enable logging for debugging
          storageKey: "waste-management-platform",
        });

        web3authRef.current = web3auth;
        
        // Initialize modal
        console.log("Initializing Web3Auth modal");
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
        
        console.log("Web3Auth modal initialized successfully");
        setIsWeb3AuthReady(true);
        
        // Check if already connected
        if (web3authRef.current.connected) {
          console.log("User already connected with Web3Auth");
          setLoggedIn(true);
          setProvider(web3authRef.current.provider);
          
          const user = await web3authRef.current.getUserInfo();
          setUserInfo(user);
          console.log("Got user info:", user);
          
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
              console.log("User created/updated in database");
            } catch (error) {
              console.error("Error creating user:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        // Try to recover from initialization error
        web3authRef.current = null;
        setIsWeb3AuthReady(false);
      }
    };

    // Don't block the UI rendering, initialize in the background
    const timeoutId = setTimeout(() => {
      initWeb3Auth();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [mounted]);

  // Fetch impact data
  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100);
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount?.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10
        });
      } catch (error) {
        console.error("Error fetching impact data:", error);
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        });
      }
    }

    fetchImpactData();
  }, []);

  const login = async () => {
    console.log("Login button clicked");
    
    if (!mounted) {
      console.error("Component not mounted yet");
      toast.error("Please wait for the page to fully load");
      return;
    }
    
    if (!isWeb3AuthReady || !web3authRef.current) {
      console.error("Web3Auth not ready:", { isWeb3AuthReady, hasRef: !!web3authRef.current });
      toast.error("Authentication system is still initializing. Please try again in a moment.");
      
      // Try to reinitialize Web3Auth
      try {
        if (!web3authRef.current) {
          console.log("Attempting to reinitialize Web3Auth");
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
              appName: "waste-management-platform",
              mode: "dark",
              loginMethodsOrder: ["google", "facebook", "twitter", "apple", "email_passwordless"]
            },
            enableLogging: true,
            storageKey: "waste-management-platform",
          });

          web3authRef.current = web3auth;
          await web3authRef.current.initModal();
          setIsWeb3AuthReady(true);
          console.log("Web3Auth reinitialized successfully");
        }
      } catch (reinitError) {
        console.error("Failed to reinitialize Web3Auth:", reinitError);
        return;
      }
    }
    
    try {
      console.log("Attempting to connect with Web3Auth");
      // Connect using Web3Auth - this opens the modal without setting loading state first
      const web3authProvider = await web3authRef.current.connect();
      console.log("Web3Auth connected successfully");
      
      // Only set loading after user has interacted with the modal
      setLoading(true);
      
      setProvider(web3authProvider);
      
      // Get user info
      console.log("Getting user info");
      const user = await web3authRef.current.getUserInfo();
      setUserInfo(user);
      console.log("User info received:", user);
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
          console.log("User created/updated in database");
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
      
      setLoggedIn(true);
      toast.success("Login successful!");
      
      // Redirect to report page after successful login
      console.log("Redirecting to report page");
      router.push('/report');
    } catch (error) {
      console.error("Error during login:", error);
      // Only show error toast if it's not a user cancellation
      if (error.message !== "Modal closed by user") {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async (path) => {
    console.log("HandleNavigate called with path:", path);
    
    if (!loggedIn) {
      console.log("User not logged in, showing login modal");
      
      if (!mounted) {
        console.error("Component not mounted yet");
        toast.error("Please wait for the page to fully load");
        return;
      }
      
      if (!isWeb3AuthReady || !web3authRef.current) {
        console.error("Web3Auth not ready:", { isWeb3AuthReady, hasRef: !!web3authRef.current });
        toast.error("Authentication system is still initializing. Please try again in a moment.");
        
        // Try to reinitialize Web3Auth
        try {
          if (!web3authRef.current) {
            console.log("Attempting to reinitialize Web3Auth");
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
                appName: "waste-management-platform",
                mode: "dark",
                loginMethodsOrder: ["google", "facebook", "twitter", "apple", "email_passwordless"]
              },
              enableLogging: true,
              storageKey: "waste-management-platform",
            });

            web3authRef.current = web3auth;
            await web3authRef.current.initModal();
            setIsWeb3AuthReady(true);
            console.log("Web3Auth reinitialized successfully");
          }
        } catch (reinitError) {
          console.error("Failed to reinitialize Web3Auth:", reinitError);
          return;
        }
      }
      
      try {
        console.log("Attempting to connect with Web3Auth");
        // Connect using Web3Auth - this opens the modal without setting loading state first
        const web3authProvider = await web3authRef.current.connect();
        console.log("Web3Auth connected successfully");
        
        // Only set loading after user has interacted with the modal
        setLoading(true);
        
        setProvider(web3authProvider);
        
        // Get user info
        console.log("Getting user info");
        const user = await web3authRef.current.getUserInfo();
        setUserInfo(user);
        console.log("User info received:", user);
        
        if (user.email) {
          localStorage.setItem('userEmail', user.email);
          try {
            await createUser(user.email, user.name || 'Anonymous User');
            console.log("User created/updated in database");
          } catch (error) {
            console.error("Error creating user:", error);
          }
        }
        
        setLoggedIn(true);
        toast.success("Login successful!");
        
        // Navigate to the requested path after login
        console.log("Redirecting to:", path);
        router.push(path);
      } catch (error) {
        console.error("Error during login:", error);
        // Only show error toast if it's not a user cancellation
        if (error.message !== "Modal closed by user") {
          toast.error("Login failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Already logged in, just navigate
      console.log("User already logged in, redirecting to:", path);
      router.push(path);
    }
  };

  // Fallback direct login method that bypasses the current mechanism
  const directLoginFallback = async () => {
    console.log("Using direct login fallback method");
    
    try {
      const clientId = "BNz8NqlHT2yX1gsavBFtTLm74eHw03HkL0Vdri6wFnUpRLxKGS4kgtIGshQUDJJn_qPJBlzpbVomgx43B_WHX0g";
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xaa36a7",
        rpcTarget: "https://ethereum-sepolia.publicnode.com",
      };

      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig },
      });

      console.log("Creating new Web3Auth instance directly");
      const web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        privateKeyProvider,
        uiConfig: {
          appName: "waste-management-platform",
          mode: "dark",
          loginMethodsOrder: ["google", "facebook", "twitter", "apple", "email_passwordless"]
        },
        enableLogging: true,
        storageKey: "waste-management-platform",
      });

      // Initialize and connect in sequence
      console.log("Initializing modal directly");
      await web3auth.initModal();
      console.log("Connecting directly");
      const provider = await web3auth.connect();
      
      // If we got here, the connection was successful
      console.log("Direct connection successful");
      setProvider(provider);
      web3authRef.current = web3auth;
      setIsWeb3AuthReady(true);
      
      // Get user info
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      console.log("User info from direct login:", user);
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
      
      setLoggedIn(true);
      toast.success("Login successful!");
      router.push('/report');
    } catch (error) {
      console.error("Direct login fallback failed:", error);
      toast.error("Login failed. Please try again later.");
    }
  };

  return (
    <div className={`min-h-screen ${poppins.className} bg-gradient-to-b from-white via-green-50 to-white`}>
      {/* Hero Section with curved background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 -z-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-300/20 to-teal-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-green-300/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4 py-6 sm:py-10 md:py-12">
          <section className="text-center mb-8 sm:mb-12 md:mb-16">
            <AnimatedGlobe />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Waste Reporting Platform</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-6 px-2">
              Join our community in making waste management more efficient and rewarding through sustainable practices and innovative solutions.
            </p>
            
            {!loggedIn ? (
              <Button 
                onClick={(e) => {
                  console.log("Get Started button clicked", e);
                  try {
                    login();
                  } catch (error) {
                    console.error("Regular login method failed, trying fallback:", error);
                    directLoginFallback();
                  }
                }} 
                disabled={loading}
                className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base py-3 px-6 sm:py-4 sm:px-8 md:text-lg rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={(e) => {
                    console.log("Report Waste button clicked", e);
                    handleNavigate('/report');
                  }}
                  disabled={loading}
                  className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm sm:text-base md:text-lg py-2 px-4 sm:py-3 sm:px-6 md:py-4 md:px-8 rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center">
                    Report Waste
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                </Button>
                <Button 
                  onClick={(e) => {
                    console.log("Collect Waste button clicked", e);
                    handleNavigate('/collect');
                  }}
                  disabled={loading}
                  className="relative overflow-hidden group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base md:text-lg py-2 px-4 sm:py-3 sm:px-6 md:py-4 md:px-8 rounded-full font-medium shadow-lg shadow-emerald-500/30 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center">
                    Collect Waste
                    <Recycle className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 sm:p-8 rounded-2xl shadow-xl border border-green-200 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-br from-green-300/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-teal-300/20 to-green-400/20 rounded-full blur-3xl"></div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-800 relative z-10">Ready to Make a Difference?</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-5 sm:mb-6 relative z-10">
            Start reporting waste in your area and earn rewards while contributing to a cleaner environment.
          </p>
          
          <Button 
            onClick={(e) => {
              console.log("Join the Movement button clicked", e);
              try {
                handleNavigate('/report');
              } catch (error) {
                console.error("Regular navigation method failed, trying fallback:", error);
                directLoginFallback();
              }
            }}
            disabled={loading}
            className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-sm sm:text-base py-2 px-4 sm:py-3 sm:px-6 rounded-full font-medium shadow-lg shadow-green-600/30 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center">
              {loggedIn ? "Report Waste Now" : "Join the Movement"}
              <TrendingUp className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-y-[-2px] transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/20 group">
      <div className="bg-white/20 p-2 rounded-full inline-block mb-3 group-hover:bg-white/30 transition-colors">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold mb-1 text-white">{formattedValue}</p>
      <p className="text-xs sm:text-sm text-green-100">{title}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl border border-green-100 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <div className="bg-gradient-to-br from-green-100 to-emerald-200 p-3 rounded-full inline-block mb-4 group-hover:bg-gradient-to-br group-hover:from-green-200 group-hover:to-emerald-300 transition-all">
        <Icon className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-3 text-gray-800 group-hover:text-green-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm">Learn more</span>
        <ChevronRight className="h-3 w-3 ml-1" />
      </div>
    </div>
  )
}