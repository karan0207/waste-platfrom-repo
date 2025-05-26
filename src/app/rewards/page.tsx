'use client'
import { useState, useEffect } from 'react'
import { Coins, ArrowUpRight, ArrowDownRight, Gift, AlertCircle, Loader, Calendar, Clock, Tag, CreditCard, Award, TrendingUp, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserByEmail, getRewardTransactions, getAvailableRewards, redeemReward, createTransaction } from '@/utils/db/actions'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Transaction = {
  id: number
  type: 'earned_report' | 'earned_collect' | 'redeemed'
  amount: number
  description: string
  date: string
}

type Reward = {
  id: number
  name: string
  cost: number
  description: string | null
  collectionInfo: string
}

export default function RewardsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingRewardId, setProcessingRewardId] = useState<number | null>(null)

  const fetchUserDataAndRewards = async () => {
    setLoading(true)
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        toast.error('User not logged in. Please log in.')
        router.push('/login')
        return
      }
      
      const fetchedUser = await getUserByEmail(userEmail)
      if (!fetchedUser) {
        toast.error('User not found. Please log in again.')
        router.push('/login')
        return
      }
      
      setUser(fetchedUser)
      
      // Fetch transactions
      const fetchedTransactions = await getRewardTransactions(fetchedUser.id)
      if (Array.isArray(fetchedTransactions)) {
        setTransactions(fetchedTransactions as Transaction[])
        
        // Calculate balance from transactions
        const calculatedBalance = fetchedTransactions.reduce((acc, transaction) => {
          return transaction.type.startsWith('earned') 
            ? acc + transaction.amount 
            : acc - transaction.amount
        }, 0)
        
        setBalance(Math.max(calculatedBalance, 0)) // Ensure balance is never negative
      } else {
        console.error('Expected array of transactions but got:', fetchedTransactions)
        setTransactions([])
        setBalance(0)
      }
      
      // Fetch available rewards
      const fetchedRewards = await getAvailableRewards(fetchedUser.id)
      if (Array.isArray(fetchedRewards)) {
        // Filter out rewards with 0 or negative cost
        setRewards(fetchedRewards.filter(r => r.cost > 0))
      } else {
        console.error('Expected array of rewards but got:', fetchedRewards)
        setRewards([])
      }
    } catch (error) {
      console.error('Error fetching user data and rewards:', error)
      toast.error('Failed to load rewards data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserDataAndRewards()
  }, [router])

  const handleRedeemReward = async (rewardId: number) => {
    if (!user) {
      toast.error('Please log in to redeem rewards.')
      router.push('/login')
      return
    }

    if (isProcessing) {
      return // Prevent multiple simultaneous redemption attempts
    }

    const reward = rewards.find(r => r.id === rewardId)
    if (!reward) {
      toast.error('Invalid reward selected')
      return
    }

    if (balance < reward.cost) {
      toast.error('Insufficient balance to redeem this reward')
      return
    }

    try {
      setIsProcessing(true)
      setProcessingRewardId(rewardId)

      // Update database
      const redemptionResult = await redeemReward(user.id, rewardId)
      if (!redemptionResult) {
        throw new Error('Failed to redeem reward')
      }
      
      // Create a new transaction record
      const transactionResult = await createTransaction(
        user.id, 
        'redeemed', 
        reward.cost, 
        `Redeemed ${reward.name}`
      )
      
      if (!transactionResult) {
        throw new Error('Failed to record transaction')
      }

      // Update local state to reflect the change immediately
      setBalance(prevBalance => Math.max(prevBalance - reward.cost, 0))
      
      // Add the new transaction to the list
      const newTransaction = {
        id: typeof transactionResult === 'object' && 'id' in transactionResult 
          ? transactionResult.id 
          : Date.now(), // Fallback ID if transaction result doesn't provide one
        type: 'redeemed' as const,
        amount: reward.cost,
        description: `Redeemed ${reward.name}`,
        date: new Date().toISOString().split('T')[0]
      }
      
      setTransactions(prev => [newTransaction, ...prev])
      
      toast.success(`You have successfully redeemed: ${reward.name}`)
      
      // Refresh all data to ensure consistency
      await fetchUserDataAndRewards()
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error('Failed to redeem reward. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingRewardId(null)
    }
  }

  const handleRedeemAllPoints = async () => {
    if (!user) {
      toast.error('Please log in to redeem points.')
      router.push('/login')
      return
    }

    if (isProcessing) {
      return // Prevent multiple simultaneous redemption attempts
    }

    if (balance <= 0) {
      toast.error('No points available to redeem')
      return
    }

    try {
      setIsProcessing(true)
      setProcessingRewardId(0) // Use 0 for "redeem all"
      
      // Update database
      const redemptionResult = await redeemReward(user.id, 0)
      if (!redemptionResult) {
        throw new Error('Failed to redeem points')
      }
      
      // Create a new transaction record
      const transactionResult = await createTransaction(
        user.id, 
        'redeemed', 
        balance, 
        'Redeemed all points'
      )
      
      if (!transactionResult) {
        throw new Error('Failed to record transaction')
      }

      // Add the new transaction to the list
      const newTransaction = {
        id: typeof transactionResult === 'object' && 'id' in transactionResult 
          ? transactionResult.id 
          : Date.now(), // Fallback ID if transaction result doesn't provide one
        type: 'redeemed' as const,
        amount: balance,
        description: 'Redeemed all points',
        date: new Date().toISOString().split('T')[0]
      }
      
      setTransactions(prev => [newTransaction, ...prev])
      
      // Update balance immediately
      setBalance(0)
      
      toast.success('You have successfully redeemed all your points!')
      
      // Refresh all data to ensure consistency
      await fetchUserDataAndRewards()
    } catch (error) {
      console.error('Error redeeming all points:', error)
      toast.error('Failed to redeem all points. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingRewardId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    )
  }

  // Create a consolidated rewards list with both individual rewards and the generic redeem option
  const displayRewards = rewards.length > 0 
    ? rewards 
    : (balance > 0 ? [{ 
        id: 0, 
        name: 'Redeem All Points', 
        cost: balance,
        description: 'Convert all your eco-points to environmental benefits and rewards',
        collectionInfo: 'Available for immediate redemption'
      }] : []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Your Rewards</span>
        </h1>
        <p className="text-gray-600 mt-2 sm:mt-0">Redeem your points for eco-friendly benefits</p>
      </div>
      
      {/* Balance Card with Gradient */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Coins className="w-48 h-48 -mt-10 -mr-10" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2 text-white">Your Eco-Points Balance</h2>
        <p className="text-green-100 mb-6 max-w-md">Earn points by reporting and collecting waste to redeem for rewards</p>
        
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <div className="ml-4">
            <span className="text-4xl sm:text-5xl font-bold">{balance}</span>
            <p className="text-sm text-green-100">Available Points</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
          <div className="flex items-center text-green-100">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">Earn more by reporting and collecting waste</span>
          </div>
          <Button 
            onClick={() => router.push('/report')}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/40"
            size="sm"
          >
            Earn Points
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
            <span className="text-sm text-gray-500">{transactions.length} transactions</span>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {transactions.length > 0 ? (
              <div>
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150 ${
                      index !== transactions.slice(0, 10).length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`rounded-full p-2 mr-3 ${
                        transaction.type === 'earned_report' 
                          ? 'bg-green-100 text-green-600' 
                          : transaction.type === 'earned_collect' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'earned_report' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : transaction.type === 'earned_collect' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{transaction.date}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-semibold px-3 py-1 rounded-full ${
                      transaction.type.startsWith('earned') 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-red-700 bg-red-50'
                    }`}>
                      {transaction.type.startsWith('earned') ? '+' : '-'}{transaction.amount}
                    </span>
                  </div>
                ))}
                
                {transactions.length > 10 && (
                  <div className="p-3 text-center border-t border-gray-100">
                    <Button variant="outline" className="text-sm text-gray-600">
                      View All Transactions
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Rewards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Available Rewards</h2>
          
          {displayRewards.length > 0 ? (
            <div className="space-y-4">
              {displayRewards.map(reward => (
                <div 
                  key={reward.id} 
                  className={`${reward.id === 0 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                    : 'bg-white border-gray-100'} 
                    p-5 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md relative overflow-hidden`}
                >
                  {reward.id === 0 && (
                    <div className="absolute bottom-0 right-0 opacity-10">
                      <Gift className="w-24 h-24 -mb-6 -mr-6" />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start">
                      <div className={`${reward.id === 0 ? 'bg-green-200' : 'bg-green-100'} p-2 rounded-lg mr-3`}>
                        {reward.id === 0 ? (
                          <Gift className="w-5 h-5 text-green-600" />
                        ) : (
                          <Award className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{reward.name}</h3>
                    </div>
                    <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                      <Tag className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-green-600 font-semibold text-sm">{reward.cost} points</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{reward.description}</p>
                  <p className="text-sm text-gray-500 mb-4 flex items-center">
                    <CreditCard className="w-3 h-3 mr-1 inline" />
                    {reward.collectionInfo}
                  </p>
                  
                  <Button 
                    onClick={() => reward.id === 0 ? handleRedeemAllPoints() : handleRedeemReward(reward.id)}
                    className={`w-full ${
                      balance >= reward.cost 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={balance < reward.cost || isProcessing}
                  >
                    {isProcessing && processingRewardId === reward.id ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : balance < reward.cost ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Insufficient Points
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Redeem Reward
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-6 rounded-xl text-center">
              <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Rewards Available</h3>
              <p className="text-gray-600 mb-4">Check back soon for new reward opportunities</p>
              <Button 
                variant="outline" 
                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                onClick={() => fetchUserDataAndRewards()}
              >
                Refresh Rewards
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}