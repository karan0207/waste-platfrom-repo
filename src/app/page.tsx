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
              <Button onClick={login} className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base py-3 px-6 sm:py-4 sm:px-8 md:text-lg rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300">
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/report">
                  <Button className="relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm sm:text-base md:text-lg py-2 px-4 sm:py-3 sm:px-6 md:py-4 md:px-8 rounded-full font-medium shadow-lg shadow-green-500/30 transition-all duration-300">
                    <span className="relative z-10 flex items-center">
                      Report Waste
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                  </Button>
                </Link>
                <Link href="/collect">
                  <Button className="relative overflow-hidden group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base md:text-lg py-2 px-4 sm:py-3 sm:px-6 md:py-4 md:px-8 rounded-full font-medium shadow-lg shadow-emerald-500/30 transition-all duration-300">
                    <span className="relative z-10 flex items-center">
                      Collect Waste
                      <Recycle className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
                  </Button>
                </Link>
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
          
          <Link href={loggedIn ? "/report" : "/login"}>
            <Button className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-sm sm:text-base py-2 px-4 sm:py-3 sm:px-6 rounded-full font-medium shadow-lg shadow-green-600/30 transition-all duration-300">
              <span className="relative z-10 flex items-center">
                {loggedIn ? "Report Waste Now" : "Join the Movement"}
                <TrendingUp className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-y-[-2px] transition-transform" />
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