'use client'
import { useState, useRef } from 'react'
import { Upload, CheckCircle, XCircle, Loader, Camera, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import { toast } from 'react-hot-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WasteVerificationResult } from '@/utils/db/gemini'

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

export default function VerifyWastePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [expectedWaste, setExpectedWaste] = useState<string>('')
  const [expectedQuantity, setExpectedQuantity] = useState<string>('')
  const [verificationResult, setVerificationResult] = useState<WasteVerificationResult | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [strictMode, setStrictMode] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isUsingCamera, setIsUsingCamera] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Reset states when a new file is selected
      setVerificationStatus('idle')
      setVerificationResult(null)
      setVerificationError(null)
      
      // Check file size
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit. Please choose a smaller file.')
        return
      }
      
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Get new stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsUsingCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Failed to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsUsingCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL('image/jpeg')
    setPreview(dataUrl)
    
    // Convert to Blob and then to File
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], 'captured-waste.jpg', { type: 'image/jpeg' })
        setFile(capturedFile)
      }
    }, 'image/jpeg', 0.95)
    
    // Reset states
    setVerificationStatus('idle')
    setVerificationResult(null)
    setVerificationError(null)
    
    // Stop camera after capture
    stopCamera()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please upload an image first')
      return
    }

    if (!expectedWaste.trim()) {
      toast.error('Please enter the expected waste type for verification')
      return
    }

    setVerificationStatus('verifying')
    setVerificationError(null)
    
    try {
      if (!geminiApiKey) {
        throw new Error('Gemini API key is missing')
      }
      
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      })

      const base64Data = await readFileAsBase64(file)
      const base64ImageData = base64Data.split(',')[1] // Remove the data URL prefix

      if (!base64ImageData) {
        throw new Error("Failed to process image data")
      }

      const imageParts = [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: file.type,
          },
        },
      ]

      // Enhanced prompt that includes expected waste type verification
      const prompt = `You are an expert in waste management and recycling. Analyze this image of waste and provide:
        1. The type of waste you can identify in the image (e.g., plastic, paper, glass, metal, organic, mixed)
        2. A brief summary of the waste configuration and appearance
        3. Your confidence level in this assessment (as a percentage)
        
        Additionally, compare with the reported waste type: "${expectedWaste}"
        and determine if it matches what's shown in the image.
        
        ${strictMode ? 'Be STRICT in your verification. If the waste type in the image is different than reported, it should fail verification.' : 'Be reasonable in your verification, allowing some flexibility if the waste is similar but not exactly as reported.'}
        
        Respond ONLY in JSON format like this:
        {
          "wasteType": "detailed description of waste type identified",
          "actualWasteType": "concise general category (e.g., plastic, paper, organic)",
          "quantity": "placeholder value",
          "summary": "brief description of waste configuration and appearance",
          "confidence": confidence level as a number between 0 and 1,
          "matches": {
            "wasteTypeMatch": true/false
          },
          "reasoning": "brief explanation of your decision, especially if there's a mismatch"
        }`

      const generationConfig = {
        temperature: 0.2, // Lower temperature for more consistent, accurate results
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      }

      // Set timeout for the Gemini API call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Gemini API request timed out")), 30000)
      })

      const responsePromise = model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
        generationConfig,
      })

      // Race between the API call and the timeout
      const result = await Promise.race([responsePromise, timeoutPromise]) as any
      
      const response = await result.response
      const text = response.text().trim()
      
      console.log("Raw Gemini response:", text)
      
      try {
        // Try to extract JSON from the response if it's not pure JSON
        let jsonText = text
        if (text.includes('{') && text.includes('}')) {
          const jsonStart = text.indexOf('{')
          const jsonEnd = text.lastIndexOf('}') + 1
          jsonText = text.slice(jsonStart, jsonEnd)
        }
        
        const parsedResult = JSON.parse(jsonText)
        
        if (parsedResult.wasteType && parsedResult.confidence !== undefined) {
          // Ensure the result matches our interface
          if (!parsedResult.summary && parsedResult.quantity) {
            parsedResult.summary = `Waste appearance: about ${parsedResult.quantity}`;
          }
          
          setVerificationResult(parsedResult)
          setVerificationStatus('success')
          
          // Determine verification status based on wasteTypeMatch
          const isVerified = parsedResult.matches?.wasteTypeMatch === true
          
          if (isVerified) {
            toast.success('Waste type verified successfully!', {
              duration: 5000,
              position: 'top-center',
            })
          } else {
            // More detailed failure message
            const reason = parsedResult.reasoning || 
              `The waste type in the image (${parsedResult.actualWasteType || parsedResult.wasteType}) does not match the expected type (${expectedWaste}).`
            
            toast.error(`Verification failed: ${reason}`, {
              duration: 5000,
              position: 'top-center',
            })
          }
        } else {
          console.error('Missing required fields in verification result:', parsedResult)
          setVerificationStatus('failure')
          setVerificationError('Invalid response format from Gemini API')
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text, error)
        setVerificationStatus('failure')
        setVerificationError('Could not parse the AI response. Please try again with a clearer image.')
      }
    } catch (error: any) {
      console.error('Error verifying waste:', error)
      setVerificationStatus('failure')
      setVerificationError(error.message || 'Unknown error occurred during verification')
    }
  }

  const handleManualClassification = () => {
    // Create a verification result with warning flags
    setVerificationResult({
      wasteType: expectedWaste || 'Unspecified waste',
      actualWasteType: expectedWaste || 'Unspecified waste',
      quantity: expectedQuantity || '1-2 kg',
      summary: "Manually classified waste configuration",
      confidence: 0.7,
      matches: {
        wasteTypeMatch: true
      },
      reasoning: "Manual classification applied - no AI verification performed"
    })
    setVerificationStatus('success')
    toast.success('Manual classification applied', {
      icon: '⚠️',
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Waste Verification System</h1>
      <p className="text-gray-600 mb-8">Verify waste type and quantity using AI vision analysis</p>
      
      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
        <div className="mb-4">
          <label htmlFor="expected-waste" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Waste Type
          </label>
          <input
            id="expected-waste"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="e.g. Plastic bottles, paper waste, organic materials"
            value={expectedWaste}
            onChange={(e) => setExpectedWaste(e.target.value)}
          />
        </div>
        

        
        <div className="mb-4 flex items-center">
          <button 
            type="button" 
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
            <Info className="ml-1 h-4 w-4" />
          </button>
        </div>
        
        {showAdvancedSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <label htmlFor="strict-mode" className="text-sm font-medium text-gray-700">
                Strict Verification Mode
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  id="strict-mode" 
                  checked={strictMode}
                  onChange={() => setStrictMode(!strictMode)}
                  className="sr-only"
                />
                <div className={`block h-6 rounded-full w-10 ${strictMode ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white border-2 rounded-full h-4 w-4 transition-transform ${strictMode ? 'transform translate-x-4 border-green-400' : 'border-gray-300'}`}></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {strictMode 
                ? 'Strict mode requires exact waste type matching for verification to pass.' 
                : 'Flexible mode allows some variation between expected and detected waste types.'}
            </p>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="upload" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="camera">Use Camera</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="mb-6">
              <label htmlFor="waste-image" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Waste Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex flex-col sm:flex-row text-sm text-gray-600">
                    <label
                      htmlFor="waste-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Upload a file</span>
                      <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
            
            {preview && !isUsingCamera && (
              <div className="mt-4 mb-6">
                <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-lg mx-auto" />
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                disabled={!file || verificationStatus === 'verifying' || !expectedWaste.trim()}
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Verifying...
                  </>
                ) : 'Verify Waste with AI'}
              </Button>
              
              {verificationStatus === 'failure' && (
                <Button 
                  type="button"
                  onClick={handleManualClassification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue with Manual Classification
                </Button>
              )}
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="camera">
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="mb-6">
              {!isUsingCamera ? (
                <Button 
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Camera
                </Button>
              ) : (
                <div>
                  <div className="relative rounded-md overflow-hidden mb-4">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="absolute top-0 left-0 w-full bg-black bg-opacity-50 p-2 flex justify-between">
                      <span className="text-white text-sm">Camera Preview</span>
                      <button 
                        type="button" 
                        onClick={stopCamera} 
                        className="text-white text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={capturePhoto}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mb-2"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Capture Photo
                  </Button>
                </div>
              )}
            </div>
            
            {preview && !isUsingCamera && (
              <div className="mt-4 mb-6">
                <img src={preview} alt="Captured waste" className="max-w-full h-auto rounded-lg mx-auto" />
              </div>
            )}
            
            {preview && !isUsingCamera && (
              <Button 
                type="button"
                onClick={handleSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                disabled={verificationStatus === 'verifying' || !expectedWaste.trim()}
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Verifying...
                  </>
                ) : 'Verify Waste with AI'}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {verificationStatus === 'success' && verificationResult && (
        <div className={`${verificationResult.matches?.wasteTypeMatch ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-8 rounded-r-md`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {verificationResult.matches?.wasteTypeMatch ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                {verificationResult.matches?.wasteTypeMatch ? 'Verification Successful' : 'Verification Results (Mismatch Detected)'}
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <p><strong>Expected Waste Type:</strong> {expectedWaste}</p>
                <p><strong>Detected Waste Type:</strong> {verificationResult.wasteType}</p>
                <p><strong>Configuration:</strong> {verificationResult.summary || "Not provided"}</p>
                <p><strong>Confidence:</strong> {(verificationResult.confidence * 100).toFixed(2)}%</p>
                
                {verificationResult.matches && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <p className={verificationResult.matches.wasteTypeMatch ? 'text-green-600' : 'text-red-600'}>
                      Waste Type Match: {verificationResult.matches.wasteTypeMatch ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                )}
                
                {verificationResult.reasoning && (
                  <div className="mt-2 p-2 bg-gray-50 border-l-2 border-gray-300">
                    <p className="text-xs text-gray-600"><strong>AI Analysis:</strong> {verificationResult.reasoning}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-500">
                  This information can be used for better waste management and recycling. 
                  The AI model analyzes images to verify waste types and quantities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'failure' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{verificationError || 'Unable to verify the waste. Please try again with a clearer image.'}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-600">Tips for better results:</p>
                <ul className="text-xs text-gray-600 list-disc pl-5 mt-1">
                  <li>Ensure good lighting</li>
                  <li>Take photo from multiple angles</li>
                  <li>Make sure the waste is clearly visible</li>
                  <li>Avoid blurry or dark images</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}