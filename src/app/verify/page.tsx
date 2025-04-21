// 'use client'
// import { useState } from 'react'
// import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react'
// import { Button } from '@/components/ui/button'

// export default function VerifyWastePage() {
//   const [file, setFile] = useState<File | null>(null)
//   const [preview, setPreview] = useState<string | null>(null)
//   const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
//   const [verificationResult, setVerificationResult] = useState<{
//     wasteType: string;
//     quantity: string;
//     confidence: number;
//   } | null>(null)

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const selectedFile = e.target.files[0]
//       setFile(selectedFile)
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         setPreview(e.target?.result as string)
//       }
//       reader.readAsDataURL(selectedFile)
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!file) return

//     setVerificationStatus('verifying')
    
//     // Simulating AI verification process
//     setTimeout(() => {
//       // This is where you would integrate with Galadriel or your AI service
//       const mockResult = {
//         wasteType: 'Plastic',
//         quantity: '2.5 kg',
//         confidence: 0.92
//       }
//       setVerificationResult(mockResult)
//       setVerificationStatus('success')
//     }, 3000)
//   }

//   return (
//     <div className="p-8 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold mb-8 text-gray-800">Verify Waste Collection</h1>
      
//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8">
//         <div className="mb-6">
//           <label htmlFor="waste-image" className="block text-sm font-medium text-gray-700 mb-2">
//             Upload Waste Image
//           </label>
//           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
//             <div className="space-y-1 text-center">
//               <Upload className="mx-auto h-12 w-12 text-gray-400" />
//               <div className="flex text-sm text-gray-600">
//                 <label
//                   htmlFor="waste-image"
//                   className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
//                 >
//                   <span>Upload a file</span>
//                   <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
//                 </label>
//                 <p className="pl-1">or drag and drop</p>
//               </div>
//               <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
//             </div>
//           </div>
//         </div>
        
//         {preview && (
//           <div className="mt-4 mb-6">
//             <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-lg" />
//           </div>
//         )}
        
//         <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={!file || verificationStatus === 'verifying'}>
//           {verificationStatus === 'verifying' ? (
//             <>
//               <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
//               Verifying...
//             </>
//           ) : 'Verify Waste'}
//         </Button>
//       </form>

//       {verificationStatus === 'success' && verificationResult && (
//         <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <CheckCircle className="h-5 w-5 text-green-400" />
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
//               <div className="mt-2 text-sm text-green-700">
//                 <p>Waste Type: {verificationResult.wasteType}</p>
//                 <p>Quantity: {verificationResult.quantity}</p>
//                 <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {verificationStatus === 'failure' && (
//         <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <XCircle className="h-5 w-5 text-red-400" />
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
//               <div className="mt-2 text-sm text-red-700">
//                 <p>Unable to verify the waste. Please try again with a clearer image.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }








'use client'
import { useState } from 'react'
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import { toast } from 'react-hot-toast'

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

export default function VerifyWastePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please upload an image first')
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

      const prompt = `You are an expert in waste management and recycling. Analyze this image of waste and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)
        
        Respond ONLY in JSON format like this:
        {
          "wasteType": "type of waste",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`

      const generationConfig = {
        temperature: 0.4,
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
        
        if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence !== undefined) {
          setVerificationResult(parsedResult)
          setVerificationStatus('success')
          toast.success('Waste verification successful!')
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
    setVerificationResult({
      wasteType: 'General Waste',
      quantity: '1-2 kg',
      confidence: 0.8
    })
    setVerificationStatus('success')
    toast.success('Manual classification applied')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Verify Waste Collection</h1>
      
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
        
        {preview && (
          <div className="mt-4 mb-6">
            <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-lg mx-auto" />
          </div>
        )}
        
        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            disabled={!file || verificationStatus === 'verifying'}
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

      {verificationStatus === 'success' && verificationResult && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Waste Type:</strong> {verificationResult.wasteType}</p>
                <p><strong>Quantity:</strong> {verificationResult.quantity}</p>
                <p><strong>Confidence:</strong> {(verificationResult.confidence * 100).toFixed(2)}%</p>
              </div>
              <div className="mt-4 bg-white p-3 rounded-md border border-green-200">
                <p className="text-xs text-gray-500">This information can be used for better waste management and recycling. The AI model has analyzed the image to provide these details.</p>
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