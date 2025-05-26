// utils/gemini.ts
// This is a centralized file for handling all Gemini AI image analysis

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

// Common interface for verification results across all components
export interface WasteVerificationResult {
  wasteType: string;
  actualWasteType?: string;
  quantity: string;
  confidence: number;
  matches?: {
    wasteTypeMatch: boolean;
    quantityMatch: boolean;
  };
  reasoning?: string;
}

// Configuration for the Gemini API
const getGeminiConfiguration = () => {
  return {
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
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };
};

// Create a hash of the image to identify it
export const createImageHash = async (imageData: string): Promise<string> => {
  // Simple hash function for demo - in production use a proper hashing algorithm
  const data = imageData.slice(0, 1000); // Take first 1000 chars for simplicity
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Cache to store results for previously analyzed images
type CacheEntry = {
  timestamp: number;
  result: WasteVerificationResult;
};

const cache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 3600 * 1000; // Cache results for 1 hour

// Clear expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const key in cache) {
    if (now - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key];
    }
  }
};

// Setup the Gemini API
export const setupGeminiAPI = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Gemini API key is missing');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Main function to analyze waste images
export async function analyzeWasteImage(
  apiKey: string, 
  imageData: string,
  options: {
    expectedWasteType?: string;
    expectedQuantity?: string;
    strictMode?: boolean;
    mode: 'report' | 'collect' | 'verify';
  }
): Promise<WasteVerificationResult> {
  try {
    // Clean up expired cache entries
    cleanupCache();
    
    // Extract base64 data from the imageData
    const parts = imageData.split(',');
    const base64ImageData = parts.length > 1 ? parts[1] : imageData;
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    // Generate hash for the image 
    const imageHash = await createImageHash(base64ImageData.slice(0, 5000));
    const cacheKey = `${imageHash}-${options.mode}-${options.expectedWasteType || ''}`;
    
    // Check if we have cached results
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log('Using cached analysis result');
      return cache[cacheKey].result;
    }
    
    // Set up the Gemini API
    const genAI = setupGeminiAPI(apiKey);
    const config = getGeminiConfiguration();
    const model = genAI.getGenerativeModel(config);

    // Prepare the image for analysis
    const imageParts = [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      },
    ];

    // Create the appropriate prompt based on the mode
    let prompt = '';
    
    if (options.mode === 'report') {
      // Simple identification prompt for reporting
      prompt = `You are an expert in waste management and recycling. Analyze this image of waste and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)
        
        BE CONSISTENT AND PRECISE in your classification. Use general categories first, then specifics.
        
        Respond ONLY in JSON format like this:
        {
          "wasteType": "type of waste",
          "actualWasteType": "general category (plastic, paper, glass, metal, organic, mixed)",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`;
    } else if (options.mode === 'collect' || options.mode === 'verify') {
      // Verification prompt for collection or verification
      prompt = `You are an expert in waste management and recycling verification. 
        Analyze this image carefully and provide verification of waste collection claims:
        
        1. Does the waste in the image match this reported waste type: "${options.expectedWasteType || 'Not specified'}"?
           ${options.strictMode ? 'Be STRICT in your verification. If the waste does not exactly match the reported type, mark it as false.' 
                               : 'Allow reasonable flexibility in matching similar waste types.'}
           
        2. Does the quantity in the image appear to match the reported amount: "${options.expectedQuantity || 'Not specified'}"?
           
        3. Provide your confidence level in this assessment (as a percentage)
        
        BE CONSISTENT AND PRECISE in your classification. Use general categories first, then specifics.
        
        Respond ONLY in JSON format like this:
        {
          "wasteType": "detailed description of waste type identified",
          "actualWasteType": "general category (plastic, paper, glass, metal, organic, mixed)",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1,
          "matches": {
            "wasteTypeMatch": true/false,
            "quantityMatch": true/false
          },
          "reasoning": "brief explanation of your decision, especially if there's a mismatch"
        }`;
    }

    // Set timeout for the Gemini API call
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API request timed out")), 30000);
    });

    // Make the API request
    const responsePromise = model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
    });

    // Race between the API call and the timeout
    const result = await Promise.race([responsePromise, timeoutPromise]);
    
    const response = await result.response;
    const text = response.text().trim();
    
    console.log("Raw Gemini response:", text);
    
    // Try to extract JSON from the response
    let jsonText = text;
    if (text.includes('{') && text.includes('}')) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      jsonText = text.slice(jsonStart, jsonEnd);
    }
    
    const parsedResult = JSON.parse(jsonText) as WasteVerificationResult;
    
    // Validate the response
    if (!parsedResult.wasteType || !parsedResult.quantity || parsedResult.confidence === undefined) {
      throw new Error('Missing required fields in Gemini response');
    }

    // For reporting mode, add placeholder matches to maintain consistency
    if (options.mode === 'report' && !parsedResult.matches) {
      parsedResult.matches = {
        wasteTypeMatch: true,
        quantityMatch: true
      };
    }
    
    // Cache the result
    cache[cacheKey] = {
      timestamp: Date.now(),
      result: parsedResult
    };
    
    return parsedResult;
    
  } catch (error: any) {
    console.error('Error in waste image analysis:', error);
    throw new Error(error.message || 'Unknown error in waste analysis');
  }
}