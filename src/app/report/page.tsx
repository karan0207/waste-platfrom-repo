// // 'use client'
// // import { useState, useCallback, useEffect } from 'react'
// // import {  MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
// // import { Button } from '@/components/ui/button'
// // import { GoogleGenerativeAI } from "@google/generative-ai";
// // import { StandaloneSearchBox,  useJsApiLoader } from '@react-google-maps/api'
// // import { Libraries } from '@react-google-maps/api';
// // import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions';
// // import { useRouter } from 'next/navigation';
// // import { toast } from 'react-hot-toast'

// // const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// // const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// // const libraries: Libraries = ['places'];

// // export default function ReportPage() {
// //   const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
// //   const router = useRouter();

// //   const [reports, setReports] = useState<Array<{
// //     id: number;
// //     location: string;
// //     wasteType: string;
// //     amount: string;
// //     createdAt: string;
// //   }>>([]);

// //   const [newReport, setNewReport] = useState({
// //     location: '',
// //     type: '',
// //     amount: '',
// //   })

// //   const [file, setFile] = useState<File | null>(null)
// //   const [preview, setPreview] = useState<string | null>(null)
// //   const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
// //   const [verificationResult, setVerificationResult] = useState<{
// //     wasteType: string;
// //     quantity: string;
// //     confidence: number;
// //   } | null>(null)
// //   const [isSubmitting, setIsSubmitting] = useState(false)

// //   const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

// //   const { isLoaded } = useJsApiLoader({
// //     id: 'google-map-script',
// //     googleMapsApiKey: googleMapsApiKey!,
// //     libraries: libraries
// //   });

// //   const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
// //     setSearchBox(ref);
// //   }, []);

// //   const onPlacesChanged = () => {
// //     if (searchBox) {
// //       const places = searchBox.getPlaces();
// //       if (places && places.length > 0) {
// //         const place = places[0];
// //         setNewReport(prev => ({
// //           ...prev,
// //           location: place.formatted_address || '',
// //         }));
// //       }
// //     }
// //   };

// //   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
// //     const { name, value } = e.target
// //     setNewReport({ ...newReport, [name]: value })
// //   }

// //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     if (e.target.files && e.target.files[0]) {
// //       const selectedFile = e.target.files[0]
// //       setFile(selectedFile)
// //       const reader = new FileReader()
// //       reader.onload = (e) => {
// //         setPreview(e.target?.result as string)
// //       }
// //       reader.readAsDataURL(selectedFile)
// //     }
// //   }

// //   const readFileAsBase64 = (file: File): Promise<string> => {
// //     return new Promise((resolve, reject) => {
// //       const reader = new FileReader();
// //       reader.onload = () => resolve(reader.result as string);
// //       reader.onerror = reject;
// //       reader.readAsDataURL(file);
// //     });
// //   };

// //   const handleVerify = async () => {
// //     if (!file) return

// //     setVerificationStatus('verifying')
    
// //     try {
// //       const genAI = new GoogleGenerativeAI(geminiApiKey!);
// //       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// //       const base64Data = await readFileAsBase64(file);

// //       const imageParts = [
// //         {
// //           inlineData: {
// //             data: base64Data.split(',')[1],
// //             mimeType: file.type,
// //           },
// //         },
// //       ];

// //       const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
// //         1. The type of waste (e.g., plastic, paper, glass, metal, organic)
// //         2. An estimate of the quantity or amount (in kg or liters)
// //         3. Your confidence level in this assessment (as a percentage)
        
// //         Respond in JSON format like this:
// //         {
// //           "wasteType": "type of waste",
// //           "quantity": "estimated quantity with unit",
// //           "confidence": confidence level as a number between 0 and 1
// //         }`;

// //       const result = await model.generateContent([prompt, ...imageParts]);
// //       const response = await result.response;
// //       const text = response.text();
      
// //       try {
// //         const parsedResult = JSON.parse(text);
// //         if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence) {
// //           setVerificationResult(parsedResult);
// //           setVerificationStatus('success');
// //           setNewReport({
// //             ...newReport,
// //             type: parsedResult.wasteType,
// //             amount: parsedResult.quantity
// //           });
// //         } else {
// //           console.error('Invalid verification result:', parsedResult);
// //           setVerificationStatus('failure');
// //         }
// //       } catch (error) {
// //         console.error('Failed to parse JSON response:', text);
// //         setVerificationStatus('failure');
// //       }
// //     } catch (error) {
// //       console.error('Error verifying waste:', error);
// //       setVerificationStatus('failure');
// //     }
// //   }

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (verificationStatus !== 'success' || !user) {
// //       toast.error('Please verify the waste before submitting or log in.');
// //       return;
// //     }
    
// //     setIsSubmitting(true);
// //     try {
// //       const report = await createReport(
// //         user.id,
// //         newReport.location,
// //         newReport.type,
// //         newReport.amount,
// //         preview || undefined,
// //         verificationResult ? JSON.stringify(verificationResult) : undefined
// //       ) as any;
      
// //       const formattedReport = {
// //         id: report.id,
// //         location: report.location,
// //         wasteType: report.wasteType,
// //         amount: report.amount,
// //         createdAt: report.createdAt.toISOString().split('T')[0]
// //       };
      
// //       setReports([formattedReport, ...reports]);
// //       setNewReport({ location: '', type: '', amount: '' });
// //       setFile(null);
// //       setPreview(null);
// //       setVerificationStatus('idle');
// //       setVerificationResult(null);
      

// //       toast.success(`Report submitted successfully! You've earned points for reporting waste.`);
// //     } catch (error) {
// //       console.error('Error submitting report:', error);
// //       toast.error('Failed to submit report. Please try again.');
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   useEffect(() => {
// //     const checkUser = async () => {
// //       const email = localStorage.getItem('userEmail');
// //       if (email) {
// //         let user = await getUserByEmail(email);
// //         if (!user) {
// //           user = await createUser(email, 'Anonymous User');
// //         }
// //         setUser(user);
        
// //         const recentReports = await getRecentReports();
// //         const formattedReports = recentReports.map(report => ({
// //           ...report,
// //           createdAt: report.createdAt.toISOString().split('T')[0]
// //         }));
// //         setReports(formattedReports);
// //       } else {
// //         router.push('/login'); 
// //       }
// //     };
// //     checkUser();
// //   }, [router]);

// //   return (
// //     <div className="p-8 max-w-4xl mx-auto">
// //       <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report waste</h1>
      
// //       <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12">
// //         <div className="mb-8">
// //           <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
// //             Upload Waste Image
// //           </label>
// //           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
// //             <div className="space-y-1 text-center">
// //               <Upload className="mx-auto h-12 w-12 text-gray-400" />
// //               <div className="flex text-sm text-gray-600">
// //                 <label
// //                   htmlFor="waste-image"
// //                   className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
// //                 >
// //                   <span>Upload a file</span>
// //                   <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
// //                 </label>
// //                 <p className="pl-1">or drag and drop</p>
// //               </div>
// //               <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
// //             </div>
// //           </div>
// //         </div>
        
// //         {preview && (
// //           <div className="mt-4 mb-8">
// //             <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md" />
// //           </div>
// //         )}
        
// //         <Button 
// //           type="button" 
// //           onClick={handleVerify} 
// //           className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
// //           disabled={!file || verificationStatus === 'verifying'}
// //         >
// //           {verificationStatus === 'verifying' ? (
// //             <>
// //               <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
// //               Verifying...
// //             </>
// //           ) : 'Verify Waste'}
// //         </Button>

// //         {verificationStatus === 'success' && verificationResult && (
// //           <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
// //             <div className="flex items-center">
// //               <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
// //               <div>
// //                 <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
// //                 <div className="mt-2 text-sm text-green-700">
// //                   <p>Waste Type: {verificationResult.wasteType}</p>
// //                   <p>Quantity: {verificationResult.quantity}</p>
// //                   <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
// //           <div>
// //             <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
// //             {isLoaded ? (
// //               <StandaloneSearchBox
// //                 onLoad={onLoad}
// //                 onPlacesChanged={onPlacesChanged}
// //               >
// //                 <input
// //                   type="text"
// //                   id="location"
// //                   name="location"
// //                   value={newReport.location}
// //                   onChange={handleInputChange}
// //                   required
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
// //                   placeholder="Enter waste location"
// //                 />
// //               </StandaloneSearchBox>
// //             ) : (
// //               <input
// //                 type="text"
// //                 id="location"
// //                 name="location"
// //                 value={newReport.location}
// //                 onChange={handleInputChange}
// //                 required
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
// //                 placeholder="Enter waste location"
// //               />
// //             )}
// //           </div>
// //           <div>
// //             <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
// //             <input
// //               type="text"
// //               id="type"
// //               name="type"
// //               value={newReport.type}
// //               onChange={handleInputChange}
// //               required
// //               className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
// //               placeholder="Verified waste type"
// //               readOnly
// //             />
// //           </div>
// //           <div>
// //             <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
// //             <input
// //               type="text"
// //               id="amount"
// //               name="amount"
// //               value={newReport.amount}
// //               onChange={handleInputChange}
// //               required
// //               className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
// //               placeholder="Verified amount"
// //               readOnly
// //             />
// //           </div>
// //         </div>
// //         <Button 
// //           type="submit" 
// //           className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
// //           disabled={isSubmitting}
// //         >
// //           {isSubmitting ? (
// //             <>
// //               <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
// //               Submitting...
// //             </>
// //           ) : 'Submit Report'}
// //         </Button>
// //       </form>

// //       <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
// //       <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
// //         <div className="max-h-96 overflow-y-auto">
// //           <table className="w-full">
// //             <thead className="bg-gray-50 sticky top-0">
// //               <tr>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
// //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
// //               </tr>
// //             </thead>
// //             <tbody className="divide-y divide-gray-200">
// //               {reports.map((report) => (
// //                 <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                     <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
// //                     {report.location}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }











// 'use client'
// import { useState, useCallback, useEffect } from 'react'
// import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api'
// import { Libraries } from '@react-google-maps/api';
// import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions';
// import { useRouter } from 'next/navigation';
// import { toast } from 'react-hot-toast'

// const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// const libraries: Libraries = ['places'];

// export default function ReportPage() {
//   const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
//   const router = useRouter();

//   const [reports, setReports] = useState<Array<{
//     id: number;
//     location: string;
//     wasteType: string;
//     amount: string;
//     createdAt: string;
//   }>>([]);

//   const [newReport, setNewReport] = useState({
//     location: '',
//     type: '',
//     amount: '',
//   })

//   const [file, setFile] = useState<File | null>(null)
//   const [preview, setPreview] = useState<string | null>(null)
//   const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
//   const [verificationResult, setVerificationResult] = useState<{
//     wasteType: string;
//     quantity: string;
//     confidence: number;
//   } | null>(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [geminiError, setGeminiError] = useState<string | null>(null)

//   const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

//   const { isLoaded } = useJsApiLoader({
//     id: 'google-map-script',
//     googleMapsApiKey: googleMapsApiKey || '',
//     libraries: libraries
//   });

//   const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
//     setSearchBox(ref);
//   }, []);

//   const onPlacesChanged = () => {
//     if (searchBox) {
//       const places = searchBox.getPlaces();
//       if (places && places.length > 0) {
//         const place = places[0];
//         setNewReport(prev => ({
//           ...prev,
//           location: place.formatted_address || '',
//         }));
//       }
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target
//     setNewReport({ ...newReport, [name]: value })
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const selectedFile = e.target.files[0]
      
//       // Reset verification states when a new file is uploaded
//       setVerificationStatus('idle')
//       setVerificationResult(null)
//       setGeminiError(null)
      
//       // Check file size (limit to 10MB)
//       if (selectedFile.size > 10 * 1024 * 1024) {
//         toast.error('File size exceeds 10MB limit. Please choose a smaller file.');
//         return;
//       }

//       setFile(selectedFile)
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         setPreview(e.target?.result as string)
//       }
//       reader.readAsDataURL(selectedFile)
//     }
//   }

//   // Convert file to base64 with proper error handling
//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         if (reader.result) {
//           resolve(reader.result as string);
//         } else {
//           reject(new Error("Failed to read file"));
//         }
//       };
//       reader.onerror = (error) => reject(error);
//       reader.readAsDataURL(file);
//     });
//   };

//   // Manual waste type input
//   const handleManualInput = () => {
//     if (verificationStatus === 'failure') {
//       // Allow manual input if verification failed
//       setNewReport({
//         ...newReport,
//         type: 'General Waste', // Default value
//         amount: '1 kg'         // Default value
//       });
//       setVerificationStatus('success');
//       setVerificationResult({
//         wasteType: 'General Waste',
//         quantity: '1 kg',
//         confidence: 1.0
//       });
//     }
//   };

//   const handleVerify = async () => {
//     if (!file) {
//       toast.error('Please upload an image first.');
//       return;
//     }

//     if (!geminiApiKey) {
//       toast.error('Gemini API key is missing. Using manual input instead.');
//       setVerificationStatus('failure');
//       setGeminiError('API key is missing');
//       return;
//     }

//     setVerificationStatus('verifying');
//     setGeminiError(null);
    
//     try {
//       const genAI = new GoogleGenerativeAI(geminiApiKey);
//       const model = genAI.getGenerativeModel({ 
//         model: "gemini-1.5-flash",
//         safetySettings: [
//           {
//             category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//             threshold: HarmBlockThreshold.BLOCK_NONE,
//           },
//           {
//             category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//             threshold: HarmBlockThreshold.BLOCK_NONE,
//           },
//           {
//             category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//             threshold: HarmBlockThreshold.BLOCK_NONE,
//           },
//           {
//             category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//             threshold: HarmBlockThreshold.BLOCK_NONE,
//           },
//         ],
//       });

//       const base64Data = await readFileAsBase64(file);
//       const base64ImageData = base64Data.split(',')[1]; // Remove the data URL prefix

//       if (!base64ImageData) {
//         throw new Error("Failed to process image data");
//       }

//       const imageParts = [
//         {
//           inlineData: {
//             data: base64ImageData,
//             mimeType: file.type,
//           },
//         },
//       ];

//       const prompt = `You are an expert in waste management and recycling. Analyze this image of waste and provide:
//         1. The type of waste (e.g., plastic, paper, glass, metal, organic)
//         2. An estimate of the quantity or amount (in kg or liters)
//         3. Your confidence level in this assessment (as a percentage)
        
//         Respond ONLY in JSON format like this:
//         {
//           "wasteType": "type of waste",
//           "quantity": "estimated quantity with unit",
//           "confidence": confidence level as a number between 0 and 1
//         }`;

//       const generationConfig = {
//         temperature: 0.4,
//         topK: 32,
//         topP: 0.95,
//         maxOutputTokens: 2048,
//       };

//       // Set timeout for the Gemini API call
//       const timeoutPromise = new Promise((_, reject) => {
//         setTimeout(() => reject(new Error("Gemini API request timed out")), 30000);
//       });

//       const responsePromise = model.generateContent({
//         contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
//         generationConfig,
//       });

//       // Race between the API call and the timeout
//       const result = await Promise.race([responsePromise, timeoutPromise]) as any;
      
//       const response = await result.response;
//       const text = response.text().trim();
      
//       console.log("Raw Gemini response:", text);
      
//       try {
//         // Try to extract JSON from the response if it's not pure JSON
//         let jsonText = text;
//         if (text.includes('{') && text.includes('}')) {
//           const jsonStart = text.indexOf('{');
//           const jsonEnd = text.lastIndexOf('}') + 1;
//           jsonText = text.slice(jsonStart, jsonEnd);
//         }
        
//         const parsedResult = JSON.parse(jsonText);
        
//         if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence !== undefined) {
//           setVerificationResult(parsedResult);
//           setVerificationStatus('success');
//           setNewReport({
//             ...newReport,
//             type: parsedResult.wasteType,
//             amount: parsedResult.quantity
//           });
//         } else {
//           console.error('Missing required fields in verification result:', parsedResult);
//           setVerificationStatus('failure');
//           setGeminiError('Invalid response format from Gemini API');
//         }
//       } catch (error) {
//         console.error('Failed to parse JSON response:', text, error);
//         setVerificationStatus('failure');
//         setGeminiError('Could not parse the AI response. Try manual input instead.');
//       }
//     } catch (error: any) {
//       console.error('Error verifying waste:', error);
//       setVerificationStatus('failure');
//       setGeminiError(error.message || 'Unknown error occurred during verification');
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!user) {
//       toast.error('Please log in before submitting a report.');
//       router.push('/login');
//       return;
//     }
    
//     if (verificationStatus !== 'success') {
//       toast.error('Please verify the waste before submitting.');
//       return;
//     }
    
//     if (!newReport.location || !newReport.type || !newReport.amount) {
//       toast.error('Please fill in all required fields.');
//       return;
//     }
    
//     setIsSubmitting(true);
//     try {
//       const reportData = await createReport(
//         user.id,
//         newReport.location,
//         newReport.type,
//         newReport.amount,
//         preview || undefined,
//         verificationResult ? JSON.stringify(verificationResult) : undefined
//       );
      
//       if (!reportData) {
//         throw new Error('Failed to create report');
//       }

//       const report = reportData as any;
      
//       // Format the timestamp properly
//       const timestamp = report.createdAt instanceof Date 
//         ? report.createdAt 
//         : new Date(report.createdAt);
      
//       const formattedReport = {
//         id: report.id,
//         location: report.location,
//         wasteType: report.wasteType || newReport.type,
//         amount: report.amount || newReport.amount,
//         createdAt: timestamp.toISOString().split('T')[0]
//       };
      
//       // Add the new report to the top of the list
//       setReports(prevReports => [formattedReport, ...prevReports]);
      
//       // Reset form
//       setNewReport({ location: '', type: '', amount: '' });
//       setFile(null);
//       setPreview(null);
//       setVerificationStatus('idle');
//       setVerificationResult(null);
//       setGeminiError(null);
      
//       toast.success(`Report submitted successfully! You've earned points for reporting waste.`);
//     } catch (error: any) {
//       console.error('Error submitting report:', error);
//       toast.error(`Failed to submit report: ${error.message || 'Unknown error'}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   useEffect(() => {
//     const checkUser = async () => {
//       try {
//         const email = localStorage.getItem('userEmail');
//         if (!email) {
//           // Redirect to login if no email found
//           toast.error('Please log in to report waste');
//           router.push('/login');
//           return;
//         }
        
//         let userResult = await getUserByEmail(email);
//         if (!userResult) {
//           userResult = await createUser(email, 'Anonymous User');
//           if (!userResult) {
//             throw new Error('Failed to create user');
//           }
//         }
        
//         setUser(userResult);
        
//         // Fetch recent reports
//         const recentReports = await getRecentReports();
//         if (Array.isArray(recentReports)) {
//           const formattedReports = recentReports.map(report => {
//             // Format the timestamp properly
//             const timestamp = report.createdAt instanceof Date 
//               ? report.createdAt 
//               : new Date(report.createdAt);
              
//             return {
//               id: report.id,
//               location: report.location,
//               wasteType: report.wasteType,
//               amount: report.amount,
//               createdAt: timestamp.toISOString().split('T')[0]
//             };
//           });
          
//           setReports(formattedReports);
//         }
//       } catch (error) {
//         console.error('Error checking user:', error);
//         toast.error('Failed to load user data. Please try logging in again.');
//       }
//     };
    
//     checkUser();
//   }, [router]);

//   return (
//     <div className="p-8 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report waste</h1>
      
//       <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12">
//         <div className="mb-8">
//           <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
//             Upload Waste Image
//           </label>
//           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
//             <div className="space-y-1 text-center">
//               <Upload className="mx-auto h-12 w-12 text-gray-400" />
//               <div className="flex text-sm text-gray-600">
//                 <label
//                   htmlFor="waste-image"
//                   className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
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
//           <div className="mt-4 mb-8">
//             <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md" />
//           </div>
//         )}
        
//         <Button 
//           type="button" 
//           onClick={handleVerify} 
//           className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
//           disabled={!file || verificationStatus === 'verifying'}
//         >
//           {verificationStatus === 'verifying' ? (
//             <>
//               <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
//               Verifying...
//             </>
//           ) : 'Verify Waste'}
//         </Button>

//         {verificationStatus === 'success' && verificationResult && (
//           <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
//             <div className="flex items-center">
//               <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
//               <div>
//                 <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
//                 <div className="mt-2 text-sm text-green-700">
//                   <p>Waste Type: {verificationResult.wasteType}</p>
//                   <p>Quantity: {verificationResult.quantity}</p>
//                   <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {verificationStatus === 'failure' && (
//           <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-xl">
//             <div className="flex flex-col">
//               <h3 className="text-lg font-medium text-red-800">Verification Failed</h3>
//               {geminiError && (
//                 <p className="mt-1 text-sm text-red-700">{geminiError}</p>
//               )}
//               <Button 
//                 type="button" 
//                 onClick={handleManualInput} 
//                 className="mt-3 bg-gray-600 hover:bg-gray-700 text-white py-2 text-sm rounded-lg transition-colors duration-300"
//               >
//                 Continue with Manual Input
//               </Button>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
//           <div>
//             <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
//             {isLoaded ? (
//               <StandaloneSearchBox
//                 onLoad={onLoad}
//                 onPlacesChanged={onPlacesChanged}
//               >
//                 <input
//                   type="text"
//                   id="location"
//                   name="location"
//                   value={newReport.location}
//                   onChange={handleInputChange}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
//                   placeholder="Enter waste location"
//                 />
//               </StandaloneSearchBox>
//             ) : (
//               <input
//                 type="text"
//                 id="location"
//                 name="location"
//                 value={newReport.location}
//                 onChange={handleInputChange}
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
//                 placeholder="Enter waste location"
//               />
//             )}
//           </div>
//           <div>
//             <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
//             <input
//               type="text"
//               id="type"
//               name="type"
//               value={newReport.type}
//               onChange={handleInputChange}
//               required
//               className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${verificationStatus === 'success' ? 'bg-gray-100' : 'bg-white'}`}
//               placeholder="Waste type"
//               readOnly={verificationStatus === 'success'}
//             />
//           </div>
//           <div>
//             <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
//             <input
//               type="text"
//               id="amount"
//               name="amount"
//               value={newReport.amount}
//               onChange={handleInputChange}
//               required
//               className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${verificationStatus === 'success' ? 'bg-gray-100' : 'bg-white'}`}
//               placeholder="Estimated amount"
//               readOnly={verificationStatus === 'success'}
//             />
//           </div>
//         </div>
//         <Button 
//           type="submit" 
//           className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? (
//             <>
//               <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
//               Submitting...
//             </>
//           ) : 'Submit Report'}
//         </Button>
//       </form>

//       <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
//       <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//         <div className="max-h-96 overflow-y-auto">
//           {reports.length > 0 ? (
//             <table className="w-full">
//               <thead className="bg-gray-50 sticky top-0">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {reports.map((report) => (
//                   <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
//                       {report.location}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <div className="p-8 text-center text-gray-500">
//               No reports available yet. Be the first to report waste!
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



'use client'
import { useState, useCallback, useEffect } from 'react'
import { MapPin, Upload, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api'
import { Libraries } from '@react-google-maps/api';
import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const libraries: Libraries = ['places'];

export default function ReportPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const router = useRouter();

  const [reports, setReports] = useState<Array<{
    id: number;
    location: string;
    wasteType: string;
    amount: string;
    createdAt: string;
  }>>([]);

  const [newReport, setNewReport] = useState({
    location: '',
    type: '',
    amount: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [geminiError, setGeminiError] = useState<string | null>(null)

  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: libraries
  });

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        setNewReport(prev => ({
          ...prev,
          location: place.formatted_address || '',
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewReport({ ...newReport, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Reset verification states when a new file is uploaded
      setVerificationStatus('idle')
      setVerificationResult(null)
      setGeminiError(null)
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
      }

      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  // Convert file to base64 with proper error handling
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Manual waste type input
  const handleManualInput = () => {
    if (verificationStatus === 'failure') {
      // Allow manual input if verification failed
      setNewReport({
        ...newReport,
        type: 'General Waste', // Default value
        amount: '1 kg'         // Default value
      });
      setVerificationStatus('success');
      setVerificationResult({
        wasteType: 'General Waste',
        quantity: '1 kg',
        confidence: 1.0
      });
    }
  };

  const handleVerify = async () => {
    if (!file) {
      toast.error('Please upload an image first.');
      return;
    }

    if (!geminiApiKey) {
      toast.error('Gemini API key is missing. Using manual input instead.');
      setVerificationStatus('failure');
      setGeminiError('API key is missing');
      return;
    }

    setVerificationStatus('verifying');
    setGeminiError(null);
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
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
      });

      const base64Data = await readFileAsBase64(file);
      const base64ImageData = base64Data.split(',')[1]; // Remove the data URL prefix

      if (!base64ImageData) {
        throw new Error("Failed to process image data");
      }

      const imageParts = [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are an expert in waste management and recycling. Analyze this image of waste and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)
        
        Respond ONLY in JSON format like this:
        {
          "wasteType": "type of waste",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`;

      const generationConfig = {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      };

      // Set timeout for the Gemini API call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Gemini API request timed out")), 30000);
      });

      const responsePromise = model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
        generationConfig,
      });

      // Race between the API call and the timeout
      const result = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      const response = await result.response;
      const text = response.text().trim();
      
      console.log("Raw Gemini response:", text);
      
      try {
        // Try to extract JSON from the response if it's not pure JSON
        let jsonText = text;
        if (text.includes('{') && text.includes('}')) {
          const jsonStart = text.indexOf('{');
          const jsonEnd = text.lastIndexOf('}') + 1;
          jsonText = text.slice(jsonStart, jsonEnd);
        }
        
        const parsedResult = JSON.parse(jsonText);
        
        if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence !== undefined) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: parsedResult.wasteType,
            amount: parsedResult.quantity
          });
        } else {
          console.error('Missing required fields in verification result:', parsedResult);
          setVerificationStatus('failure');
          setGeminiError('Invalid response format from Gemini API');
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text, error);
        setVerificationStatus('failure');
        setGeminiError('Could not parse the AI response. Try manual input instead.');
      }
    } catch (error: any) {
      console.error('Error verifying waste:', error);
      setVerificationStatus('failure');
      setGeminiError(error.message || 'Unknown error occurred during verification');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in before submitting a report.');
      router.push('/login');
      return;
    }
    
    if (verificationStatus !== 'success') {
      toast.error('Please verify the waste before submitting.');
      return;
    }
    
    if (!newReport.location || !newReport.type || !newReport.amount) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const reportData = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      );
      
      if (!reportData) {
        throw new Error('Failed to create report');
      }

      const report = reportData as any;
      
      // Format the timestamp properly
      const timestamp = report.createdAt instanceof Date 
        ? report.createdAt 
        : new Date(report.createdAt);
      
      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType || newReport.type,
        amount: report.amount || newReport.amount,
        createdAt: timestamp.toISOString().split('T')[0]
      };
      
      // Add the new report to the top of the list
      setReports(prevReports => [formattedReport, ...prevReports]);
      
      // Reset form
      setNewReport({ location: '', type: '', amount: '' });
      setFile(null);
      setPreview(null);
      setVerificationStatus('idle');
      setVerificationResult(null);
      setGeminiError(null);
      
      toast.success(`Report submitted successfully! You've earned points for reporting waste.`);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(`Failed to submit report: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          // Redirect to login if no email found
          toast.error('Please log in to report waste');
          router.push('/login');
          return;
        }
        
        let userResult = await getUserByEmail(email);
        if (!userResult) {
          userResult = await createUser(email, 'Anonymous User');
          if (!userResult) {
            throw new Error('Failed to create user');
          }
        }
        
        setUser(userResult);
        
        // Fetch recent reports
        const recentReports = await getRecentReports();
        if (Array.isArray(recentReports)) {
          const formattedReports = recentReports.map(report => {
            // Format the timestamp properly
            const timestamp = report.createdAt instanceof Date 
              ? report.createdAt 
              : new Date(report.createdAt);
              
            return {
              id: report.id,
              location: report.location,
              wasteType: report.wasteType,
              amount: report.amount,
              createdAt: timestamp.toISOString().split('T')[0]
            };
          });
          
          setReports(formattedReports);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        toast.error('Failed to load user data. Please try logging in again.');
      }
    };
    
    checkUser();
  }, [router]);

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-5 text-gray-800">Report waste</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg mb-6 sm:mb-8 md:mb-12">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <label htmlFor="waste-image" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
            Upload Waste Image
          </label>
          <div className="mt-1 flex justify-center px-4 py-4 sm:px-6 sm:pt-5 sm:pb-6 border-2 border-gray-300 border-dashed rounded-lg sm:rounded-xl hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
              <div className="flex flex-col sm:flex-row text-sm text-gray-600">
                <label
                  htmlFor="waste-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <p className="pl-0 sm:pl-1 mt-1 sm:mt-0">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
        
        {preview && (
          <div className="mt-3 sm:mt-4 mb-4 sm:mb-6 md:mb-8">
            <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-lg sm:rounded-xl shadow-md" />
          </div>
        )}
        
        <Button 
          type="button" 
          onClick={handleVerify} 
          className="w-full mb-4 sm:mb-6 md:mb-8 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-base sm:text-lg rounded-lg sm:rounded-xl transition-colors duration-300" 
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" />
              Verifying...
            </>
          ) : 'Verify Waste'}
        </Button>

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8 rounded-r-lg sm:rounded-r-xl">
            <div className="flex items-start sm:items-center">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="text-base sm:text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: {verificationResult.quantity}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'failure' && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8 rounded-r-lg sm:rounded-r-xl">
            <div className="flex flex-col">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mr-2 sm:mr-3 mt-0.5" />
                <h3 className="text-base sm:text-lg font-medium text-red-800">Verification Failed</h3>
              </div>
              {geminiError && (
                <p className="mt-1 text-xs sm:text-sm text-red-700 ml-7 sm:ml-9">{geminiError}</p>
              )}
              <Button 
                type="button" 
                onClick={handleManualInput} 
                className="mt-3 bg-gray-600 hover:bg-gray-700 text-white py-2 text-xs sm:text-sm rounded-lg transition-colors duration-300 ml-7 sm:ml-9"
              >
                Continue with Manual Input
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
          <div>
            <label htmlFor="location" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Location</label>
            {isLoaded ? (
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="Enter waste location"
                />
              </StandaloneSearchBox>
            ) : (
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="Enter waste location"
              />
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Waste Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className={`w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${verificationStatus === 'success' ? 'bg-gray-100' : 'bg-white'}`}
              placeholder="Waste type"
              readOnly={verificationStatus === 'success'}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className={`w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ${verificationStatus === 'success' ? 'bg-gray-100' : 'bg-white'}`}
              placeholder="Estimated amount"
              readOnly={verificationStatus === 'success'}
            />
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 text-base sm:text-lg rounded-lg sm:rounded-xl transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" />
              Submitting...
            </>
          ) : 'Submit Report'}
        </Button>
      </form>

      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-5 text-gray-800">Recent Reports</h2>
      
      {/* Mobile Card View (visible on small screens) */}
      <div className="sm:hidden bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {reports.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start mb-2">
                  <MapPin className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium line-clamp-2">{report.location}</span>
                </div>
                <div className="ml-6 grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="block text-gray-400">Type</span>
                    {report.wasteType}
                  </div>
                  <div>
                    <span className="block text-gray-400">Amount</span>
                    {report.amount}
                  </div>
                  <div>
                    <span className="block text-gray-400">Date</span>
                    {report.createdAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No reports available yet. Be the first to report waste!
          </div>
        )}
      </div>
      
      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden sm:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="max-h-80 md:max-h-96 overflow-y-auto">
          {reports.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="inline-block w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="line-clamp-2">{report.location}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">{report.wasteType}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">{report.amount}</td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm text-gray-500">{report.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No reports available yet. Be the first to report waste!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}