'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, CheckCircle, Clock, ArrowRight, Camera, Upload, Loader, Calendar, Weight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { getWasteCollectionTasks, updateTaskStatus, saveReward, saveCollectedWaste, getUserByEmail } from '@/utils/db/actions'
import { useRouter } from 'next/navigation'
import { analyzeWasteImage, createImageHash, WasteVerificationResult } from '@/utils/db/gemini'
// import { analyzeWasteImage, WasteVerificationResult, createImageHash } from '@utils/db/gemini.ts'

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

type CollectionTask = {
  id: number
  location: string
  wasteType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  date: string
  collectorId: number | null
}

const ITEMS_PER_PAGE = 5

export default function CollectPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Added state for storing original image hash to prevent reuse
  const [verificationImageHash, setVerificationImageHash] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true)
      try {
        // Fetch user
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

        // Fetch tasks
        const fetchedTasks = await getWasteCollectionTasks(20)
        console.log('Fetched tasks:', fetchedTasks)
        
        if (Array.isArray(fetchedTasks)) {
          setTasks(fetchedTasks as CollectionTask[])
        } else {
          console.error('Expected array of tasks but got:', fetchedTasks)
          setTasks([])
        }
      } catch (error) {
        console.error('Error fetching user and tasks:', error)
        toast.error('Failed to load user data and tasks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndTasks()
  }, [router, refreshTrigger])

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<WasteVerificationResult | null>(null)
  const [reward, setReward] = useState<number | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Added new state for storing verification attempts
  const [verificationAttempts, setVerificationAttempts] = useState(0)

  const handleStatusChange = async (taskId: number, newStatus: CollectionTask['status']) => {
    if (!user) {
      toast.error('Please log in to collect waste.')
      router.push('/login')
      return
    }

    setIsProcessing(true)
    try {
      console.log(`Updating task ${taskId} to status ${newStatus} for collector ${user.id}`)
      
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id)
      console.log('Task updated:', updatedTask)
      
      if (updatedTask) {
        // Refresh tasks instead of manually updating
        setRefreshTrigger(prev => prev + 1)
        toast.success(`Task ${newStatus === 'in_progress' ? 'collection started' : 'status updated'} successfully`)
      } else {
        toast.error('Failed to update task status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Reset verification states
      setVerificationStatus('idle')
      setVerificationResult(null)
      setVerificationError(null)
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit. Please choose a smaller file.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string
        setVerificationImage(imageDataUrl)
        
        // Generate and store image hash to prevent reuse
        try {
          const hash = await createImageHash(imageDataUrl)
          setVerificationImageHash(hash)
          console.log('Image hash generated:', hash)
        } catch (error) {
          console.error('Error generating image hash:', error)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read file. Please try another image.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error('Missing required information for verification.')
      return
    }

    // Add check to prevent re-verification of already verified tasks
    if (selectedTask.status === 'verified') {
      toast.error('This task has already been verified and rewarded.')
      return
    }

    setVerificationStatus('verifying')
    setVerificationError(null)
    setIsProcessing(true)
    setVerificationAttempts(prev => prev + 1)
    
    try {
      if (!geminiApiKey) {
        throw new Error('Gemini API key is missing')
      }
      
      // Use the centralized analyzeWasteImage function
      const result = await analyzeWasteImage(
        geminiApiKey,
        verificationImage,
        {
          expectedWasteType: selectedTask.wasteType,
          expectedQuantity: selectedTask.amount,
          strictMode: true, // Use strict mode for collection verification
          mode: 'collect'
        }
      )
      
      setVerificationResult(result)
      setVerificationStatus('success')
      
      // STRICTER VERIFICATION LOGIC:
      // Only checking waste type match as per requirements
      const isVerified = result.matches?.wasteTypeMatch === true
      
      if (isVerified) {
        try {
          // Save the collected waste first with the full verification result
          await saveCollectedWaste(selectedTask.id, user.id, result)
          
          // Then update task status
          await updateTaskStatus(selectedTask.id, 'verified', user.id)
          
          // Calculate reward based on accuracy and confidence
          const baseReward = 15
          const accuracyBonus = 10
          const confidenceBonus = Math.floor(result.confidence * 5)
          const earnedReward = baseReward + accuracyBonus + confidenceBonus
          
          // Save the reward
          await saveReward(user.id, earnedReward)
          
          // Update the selected task to reflect its new status
          setSelectedTask({
            ...selectedTask,
            status: 'verified'
          })
          
          setReward(earnedReward)
          setRefreshTrigger(prev => prev + 1)
          
          toast.success(`Verification successful! You earned ${earnedReward} tokens!`, {
            duration: 5000,
            position: 'top-center',
          })
        } catch (error) {
          console.error('Error saving verification results:', error)
          toast.error('Error saving verification results. Please try again.')
        }
      } else {
        // Show explanation for the verification failure
        const reason = result.reasoning || 
          `The waste type detected (${result.actualWasteType || result.wasteType}) does not match the expected type (${selectedTask.wasteType}).`
        
        toast.error(`Verification failed: ${reason}`, {
          duration: 5000,
          position: 'top-center',
        })
      }
    } catch (error: any) {
      console.error('Error verifying waste:', error)
      setVerificationStatus('failure')
      setVerificationError(error.message || 'Unknown error occurred during verification')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Manual verification as fallback
  const handleManualVerify = async () => {
    if (!selectedTask || !user) {
      toast.error('Missing required information for verification.')
      return
    }
    
    // Add check to prevent re-verification of already verified tasks
    if (selectedTask.status === 'verified') {
      toast.error('This task has already been verified and rewarded.')
      return
    }
    
    // Only allow manual verification with an image
    if (!verificationImage) {
      toast.error('Please upload an image of the collected waste before manual verification.')
      return
    }
    
    setIsProcessing(true)
    try {
      // Manual verification should still be structured like the unified format
      const manualVerification: WasteVerificationResult = {
        wasteType: selectedTask.wasteType,
        actualWasteType: selectedTask.wasteType,
        quantity: selectedTask.amount,
        summary: "Manually verified waste configuration",
        confidence: 0.7,
        matches: {
          wasteTypeMatch: true
        },
        reasoning: "Manual verification by system administrator"
      }
      
      // Save the collected waste
      await saveCollectedWaste(selectedTask.id, user.id, manualVerification)
      
      // Update task status
      await updateTaskStatus(selectedTask.id, 'verified', user.id)
      
      // Calculate reward (slightly lower for manual verification)
      const earnedReward = 15
      
      // Save the reward
      await saveReward(user.id, earnedReward)
      
      // Update the selected task to reflect its new status
      setSelectedTask({
        ...selectedTask,
        status: 'verified'
      })
      
      setReward(earnedReward)
      setRefreshTrigger(prev => prev + 1)
      
      toast.success(`Manual verification successful! You earned ${earnedReward} tokens!`, {
        duration: 5000,
        position: 'top-center',
      })
      
      // Close the modal
      setSelectedTask(null)
    } catch (error) {
      console.error('Error with manual verification:', error)
      toast.error('Failed to complete manual verification. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE))
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Waste Collection Tasks</h1>
      
      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Search by area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : paginatedTasks.length > 0 ? (
        <>
          <div className="space-y-4">
            {paginatedTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                    {task.location}
                  </h2>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center relative">
                    <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span 
                      onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                      onMouseLeave={() => setHoveredWasteType(null)}
                      className="cursor-pointer"
                    >
                      {task.wasteType.length > 15 ? `${task.wasteType.slice(0, 15)}...` : task.wasteType}
                    </span>
                    {hoveredWasteType === task.wasteType && (
                      <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 max-w-xs">
                        {task.wasteType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-500" />
                    {task.amount}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {task.date}
                  </div>
                </div>
                <div className="flex justify-end">
                  {task.status === 'pending' && (
                    <Button 
                      onClick={() => handleStatusChange(task.id, 'in_progress')} 
                      variant="outline" 
                      size="sm"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        'Start Collection'
                      )}
                    </Button>
                  )}
                  {task.status === 'in_progress' && task.collectorId === user?.id && (
                    <Button 
                      onClick={() => setSelectedTask(task)} 
                      variant="outline" 
                      size="sm"
                      disabled={isProcessing}
                    >
                      Complete & Verify
                    </Button>
                  )}
                  {task.status === 'in_progress' && task.collectorId !== user?.id && (
                    <span className="text-yellow-600 text-sm font-medium">In progress by another collector</span>
                  )}
                  {task.status === 'verified' && (
                    <span className="text-green-600 text-sm font-medium">Reward Earned</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="mr-2"
            >
              Previous
            </Button>
            <span className="mx-3 self-center text-sm text-gray-600">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              variant="outline"
              className="ml-2"
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-2">No waste collection tasks available in this area.</p>
          <p className="text-sm text-gray-400">Try adjusting your search or check back later.</p>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Verify Collection</h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Task Details:</span> {selectedTask.wasteType} ({selectedTask.amount}) at {selectedTask.location}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Status:</span> {selectedTask.status.replace('_', ' ')}
              </p>
            </div>
            
            {selectedTask.status === 'verified' ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium text-green-700">This task has already been verified and rewarded.</p>
                <p className="text-sm text-green-600 mt-2">You cannot verify this task again.</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  <strong>Important:</strong> Upload a photo of the collected waste to verify and earn your reward. 
                  The waste type must match what was reported ({selectedTask.wasteType}) for successful verification.
                </p>
                <div className="mb-4">
                  <label htmlFor="verification-image" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="verification-image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input id="verification-image" name="verification-image" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                {verificationImage && (
                  <img src={verificationImage} alt="Verification" className="mb-4 rounded-md w-full" />
                )}
                {verificationImage ? (
                  <Button
                    onClick={handleVerify}
                    className={`w-full ${selectedTask.status === 'completed' ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    disabled={verificationStatus === 'verifying' || isProcessing || selectedTask.status === 'completed'}
                  >
                    {verificationStatus === 'verifying' || isProcessing ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Verifying...
                      </>
                    ) : selectedTask.status === 'completed' ? 'Already Verified' : 'Verify Collection'}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-700">Please upload an image of the collected waste for verification.</p>
                  </div>
                )}
              </>
            )}
            
            {verificationStatus === 'success' && verificationResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium text-green-700 mb-2">Verification Results:</p>
                <p className="text-sm">Waste Type Match: {verificationResult.matches?.wasteTypeMatch ? '✅ Yes' : '❌ No'}</p>
                <p className="text-sm">Configuration: {verificationResult.summary || "Not provided"}</p>
                <p className="text-sm">Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                <p className="text-sm">Detected Waste: {verificationResult.wasteType}</p>
                {verificationResult.reasoning && (
                  <p className="text-sm mt-2">AI Analysis: {verificationResult.reasoning}</p>
                )}
                {reward !== null && (
                  <p className="mt-2 text-green-700 font-medium">🎉 You earned {reward} tokens!</p>
                )}
                {/* Additional verification status info */}
                {verificationResult.matches?.wasteTypeMatch ? (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                    <CheckCircle className="inline-block mr-1 h-4 w-4" />
                    This task is now verified and cannot be verified again.
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    <p>Verification failed. Please collect the correct waste type as assigned.</p>
                  </div>
                )}
              </div>
            )}
            
            {verificationStatus === 'failure' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 font-medium">Verification failed</p>
                {verificationError && (
                  <p className="mt-1 text-sm text-red-600">{verificationError}</p>
                )}
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium">Verification Tips:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Make sure the image clearly shows the waste type</li>
                    <li>Ensure good lighting and focus</li>
                    <li>Make sure you've collected the exact waste type specified in the task</li>
                    <li>Try to show the quantity accurately in the image</li>
                  </ul>
                </div>
                {verificationImage && user?.email?.includes('admin') && (
                  <Button 
                    onClick={handleManualVerify}
                    className="mt-3 w-full bg-blue-600"
                    disabled={isProcessing || selectedTask.status === 'verified'}
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Processing...
                      </>
                    ) : selectedTask.status === 'verified' ? 'Already Verified' : 'Admin Override: Manual Verification'}
                  </Button>
                )}
              </div>
            )}
            
            <Button 
              onClick={() => setSelectedTask(null)} 
              variant="outline" 
              className="w-full mt-4"
              disabled={isProcessing}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: CollectionTask['status'] }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    in_progress: { color: 'bg-blue-100 text-blue-800', icon: Trash2 },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    verified: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  }

  const { color, icon: Icon } = statusConfig[status]

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}>
      <Icon className="mr-1 h-3 w-3" />
      {status.replace('_', ' ')}
    </span>
  )
}