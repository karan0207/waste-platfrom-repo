// // @ts-nocheck
// 'use client'
// import { useState, useEffect } from 'react'
// import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Poppins } from 'next/font/google'
// import Link from 'next/link'
// import ContractInteraction from '@/components/ContractInteraction'
// import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

// const poppins = Poppins({ 
//   weight: ['300', '400', '600'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// function AnimatedGlobe() {
//   return (
//     <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6 md:mb-8">
//       <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-pulse"></div>
//       <div className="absolute inset-2 rounded-full bg-green-400 opacity-40 animate-ping"></div>
//       <div className="absolute inset-4 rounded-full bg-green-300 opacity-60 animate-spin"></div>
//       <div className="absolute inset-6 rounded-full bg-green-200 opacity-80 animate-bounce"></div>
//       <Leaf className="absolute inset-0 m-auto h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 text-green-600 animate-pulse" />
//     </div>
//   )
// }

// export default function Home() {
//   const [loggedIn, setLoggedIn] = useState(false);
//   const [impactData, setImpactData] = useState({
//     wasteCollected: 0,
//     reportsSubmitted: 0,
//     tokensEarned: 0,
//     co2Offset: 0
//   });

//   useEffect(() => {
//     async function fetchImpactData() {
//       try {
//         const reports = await getRecentReports(100);  // Fetch last 100 reports
//         const rewards = await getAllRewards();
//         const tasks = await getWasteCollectionTasks(100);  // Fetch last 100 tasks

//         const wasteCollected = tasks.reduce((total, task) => {
//           const match = task.amount.match(/(\d+(\.\d+)?)/);
//           const amount = match ? parseFloat(match[0]) : 0;
//           return total + amount;
//         }, 0);

//         const reportsSubmitted = reports.length;
//         const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
//         const co2Offset = wasteCollected * 0.5;  // Assuming 0.5 kg CO2 offset per kg of waste

//         setImpactData({
//           wasteCollected: Math.round(wasteCollected * 10) / 10, // Round to 1 decimal place
//           reportsSubmitted,
//           tokensEarned,
//           co2Offset: Math.round(co2Offset * 10) / 10 // Round to 1 decimal place
//         });
//       } catch (error) {
//         console.error("Error fetching impact data:", error);
//         // Set default values in case of error
//         setImpactData({
//           wasteCollected: 0,
//           reportsSubmitted: 0,
//           tokensEarned: 0,
//           co2Offset: 0
//         });
//       }
//     }

//     fetchImpactData();
//   }, []);

//   const login = () => {
//     setLoggedIn(true);
//   };

//   return (
//     <div className={`container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 ${poppins.className}`}>
//       <section className="text-center mb-10 sm:mb-16 md:mb-20">
//         <AnimatedGlobe />
//         <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-800 tracking-tight">
//            <span className="text-green-600">Waste Reporting Platform</span>
//         </h1>
//         <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
//           Join our community in making waste management more efficient and rewarding!
//         </p>
//         {!loggedIn ? (
//           <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base md:text-lg py-2 sm:py-4 md:py-6 px-6 sm:px-8 md:px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
//             Get Started
//             <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
//           </Button>
//         ) : (
//           <Link href="/report">
//             <Button className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base md:text-lg py-2 sm:py-4 md:py-6 px-6 sm:px-8 md:px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
//               Report Waste
//               <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
//             </Button>
//           </Link>
//         )}
//       </section>
      
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mb-10 sm:mb-16 md:mb-20">
//         <FeatureCard
//           icon={Leaf}
//           title="Eco-Friendly"
//           description="Contribute to a cleaner environment by reporting and collecting waste."
//         />
//         <FeatureCard
//           icon={Coins}
//           title="Earn Rewards"
//           description="Get tokens for your contributions to waste management efforts."
//         />
//         <FeatureCard
//           icon={Users}
//           title="Community-Driven"
//           description="Be part of a growing community committed to sustainable practices."
//         />
//       </section>
      
//       <section className="bg-white p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg mb-10 sm:mb-16 md:mb-20">
//         <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center text-gray-800">Our Impact</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
//           <ImpactCard title="Waste Collected" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
//           <ImpactCard title="Reports Submitted" value={impactData.reportsSubmitted.toString()} icon={MapPin} />
//           <ImpactCard title="Tokens Earned" value={impactData.tokensEarned.toString()} icon={Coins} />
//           <ImpactCard title="CO2 Offset" value={`${impactData.co2Offset} kg`} icon={Leaf} />
//         </div>
//       </section>
//     </div>
//   )
// }

// function ImpactCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
//   const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
//   return (
//     <div className="p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
//       <Icon className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-green-500 mb-2 sm:mb-3 md:mb-4" />
//       <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-gray-800">{formattedValue}</p>
//       <p className="text-xs sm:text-sm text-gray-600">{title}</p>
//     </div>
//   )
// }

// function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
//       <div className="bg-green-100 p-3 md:p-4 rounded-full mb-4 md:mb-6">
//         <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
//       </div>
//       <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-gray-800">{title}</h3>
//       <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
//     </div>
//   )
// }


// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import ContractInteraction from '@/components/ContractInteraction'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

const poppins = Poppins({ 
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedGlobe() {
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 mx-auto mb-6 sm:mb-8 md:mb-10">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-green-300 to-teal-400 opacity-30 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-gradient-to-l from-emerald-200 to-green-400 opacity-50 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-teal-100 to-green-300 opacity-70 animate-bounce"></div>
      <div className="absolute inset-0 m-auto flex items-center justify-center">
        <Leaf className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 text-green-600 drop-shadow-lg" />
      </div>
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem('userEmail');
    setLoggedIn(!!userEmail);
    
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

  const login = () => {
    // Simulate login for demo
    localStorage.setItem('userEmail', 'demo@example.com');
    setLoggedIn(true);
  };

  return (
    <div className={`min-h-screen ${poppins.className} bg-gradient-to-b from-white via-green-50 to-white`}>
      {/* Hero Section with curved background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 -z-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-300/20 to-teal-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-green-300/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-4 py-12 sm:py-16 md:py-14 -mt-18">
          <section className="text-center mb-16 sm:mb-20 md:mb-28 ">
            <AnimatedGlobe />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Waste Reporting Platform</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
              Join our community in making waste management more efficient and rewarding through sustainable practices and innovative solutions.
            </p>
            
            {!loggedIn ? (
              <Button onClick={login} className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg py-6 px-10 rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300">
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/report">
                  <Button className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg py-6 px-10 rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300">
                    <span className="relative z-10 flex items-center">
                      Report Waste
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                  </Button>
                </Link>
                <Link href="/collect">
                  <Button className="relative overflow-hidden group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg py-6 px-10 rounded-full font-medium shadow-lg shadow-emerald-500/30 transition-all duration-300">
                    <span className="relative z-10 flex items-center">
                      Collect Waste
                      <Recycle className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>
        
        {/* Wave separator */}
        {/* <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" fill="white" preserveAspectRatio="none" className="w-full h-24 sm:h-28">
            <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,53.3C840,53,960,75,1080,85.3C1200,96,1320,96,1380,96L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </div> */}
      </div>
      
      {/* Features Section */}
      {/* <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800">
          <span className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Why Join Us?</span>
        </h2>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-20">
          <FeatureCard
            icon={Leaf}
            title="Eco-Friendly"
            description="Contribute to a cleaner environment by reporting and collecting waste in your community."
          />
          <FeatureCard
            icon={Coins}
            title="Earn Rewards"
            description="Get tokens for your contributions that can be redeemed for various benefits and incentives."
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="Join a growing network of environmentally conscious individuals making a real difference."
          />
        </section>
      </div> */}
      
      {/* Impact Section with cool gradient background */}
      {/* <div className="relative py-16 sm:py-20 mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-emerald-600/90 skew-y-1 -z-10"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center text-white">Our Global Impact</h2>
          <p className="text-center text-green-100 max-w-2xl mx-auto mb-12">
            Together we're making measurable progress toward a cleaner, more sustainable future
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <ImpactCard 
              title="Waste Collected" 
              value={`${impactData.wasteCollected} kg`} 
              icon={Recycle} 
            />
            <ImpactCard 
              title="Reports Submitted" 
              value={impactData.reportsSubmitted.toString()} 
              icon={MapPin} 
            />
            <ImpactCard 
              title="Tokens Earned" 
              value={impactData.tokensEarned.toString()} 
              icon={Coins} 
            />
            <ImpactCard 
              title="CO₂ Offset" 
              value={`${impactData.co2Offset} kg`} 
              icon={Leaf} 
            />
          </div>
        </div>
      </div> */}
      
      {/* Call to Action */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 sm:p-12 rounded-2xl shadow-xl border border-green-200 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-br from-green-300/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-teal-300/20 to-green-400/20 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800 relative z-10">Ready to Make a Difference?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 relative z-10">
            Start reporting waste in your area and earn rewards while contributing to a cleaner environment.
          </p>
          
          <Link href={loggedIn ? "/report" : "/login"}>
            <Button className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-lg py-5 px-8 rounded-full font-medium shadow-lg shadow-green-600/30 transition-all duration-300">
              <span className="relative z-10 flex items-center">
                {loggedIn ? "Report Waste Now" : "Join the Movement"}
                <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
  return (
    <div className="p-6 sm:p-7 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/20 group">
      <div className="bg-white/20 p-3 rounded-full inline-block mb-4 group-hover:bg-white/30 transition-colors">
        <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
      </div>
      <p className="text-3xl sm:text-4xl font-bold mb-1 text-white">{formattedValue}</p>
      <p className="text-sm text-green-100">{title}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl border border-green-100 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <div className="bg-gradient-to-br from-green-100 to-emerald-200 p-4 rounded-full inline-block mb-6 group-hover:bg-gradient-to-br group-hover:from-green-200 group-hover:to-emerald-300 transition-all">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 group-hover:text-green-600 transition-colors">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Learn more</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </div>
    </div>
  )
}