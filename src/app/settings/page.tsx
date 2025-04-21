// 'use client'
// import { useState } from 'react'
// import { User, Mail, Phone, MapPin, Save } from 'lucide-react'
// import { Button } from '@/components/ui/button'

// type UserSettings = {
//   name: string
//   email: string
//   phone: string
//   address: string
//   notifications: boolean
// }

// export default function SettingsPage() {
//   const [settings, setSettings] = useState<UserSettings>({
//     name: 'John Doe',
//     email: 'john.doe@example.com',
//     phone: '+1 234 567 8900',
//     address: '123 Eco Street, Green City, 12345',
//     notifications: true,
//   })

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target
//     setSettings(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value,
//     }))
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Here you would typically send the updated settings to your backend
//     console.log('Updated settings:', settings)
//     alert('Settings updated successfully!')
//   }

//   return (
//     <div className="p-8 max-w-2xl mx-auto">
//       <h1 className="text-3xl font-semibold mb-6 text-gray-800">Account Settings</h1>
      
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
//           <div className="relative">
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={settings.name}
//               onChange={handleInputChange}
//               className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
//             />
//             <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//           </div>
//         </div>

//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
//           <div className="relative">
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={settings.email}
//               onChange={handleInputChange}
//               className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
//             />
//             <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//           </div>
//         </div>

//         <div>
//           <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
//           <div className="relative">
//             <input
//               type="tel"
//               id="phone"
//               name="phone"
//               value={settings.phone}
//               onChange={handleInputChange}
//               className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
//             />
//             <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//           </div>
//         </div>

//         <div>
//           <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//           <div className="relative">
//             <input
//               type="text"
//               id="address"
//               name="address"
//               value={settings.address}
//               onChange={handleInputChange}
//               className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
//             />
//             <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//           </div>
//         </div>

//         <div className="flex items-center">
//           <input
//             type="checkbox"
//             id="notifications"
//             name="notifications"
//             checked={settings.notifications}
//             onChange={handleInputChange}
//             className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//           />
//           <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
//             Receive email notifications
//           </label>
//         </div>

//         <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white">
//           <Save className="w-4 h-4 mr-2" />
//           Save Changes
//         </Button>
//       </form>
//     </div>
//   )
// }







'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Save, Loader, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type UserSettings = {
  name: string
  email: string
  phone: string
  address: string
  notifications: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user settings from localStorage or API
    const fetchUserSettings = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if user is logged in
        const userEmail = localStorage.getItem('userEmail')
        if (!userEmail) {
          toast.error('User not logged in. Please log in first.')
          router.push('/login')
          return
        }

        // In a real app, you would fetch settings from an API
        // For now, we'll use mock data or localStorage if available
        const savedSettings = localStorage.getItem('userSettings')
        
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        } else {
          // Use placeholder data if no saved settings exist
          setSettings({
            name: userEmail.split('@')[0] || 'Your Name',
            email: userEmail,
            phone: 'Your phone number',
            address: 'Your address',
            notifications: true
          })
        }
      } catch (error) {
        console.error('Error fetching user settings:', error)
        setError('Failed to load settings. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserSettings()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      // Validate inputs
      if (!settings.name.trim()) {
        throw new Error('Name is required')
      }
      
      if (!settings.email.trim() || !/^\S+@\S+\.\S+$/.test(settings.email)) {
        throw new Error('Valid email is required')
      }
      
      // In a real app, you would send this data to your API
      // For demonstration, we'll save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success('Settings updated successfully!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError(error.message || 'Failed to save settings. Please try again.')
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-gray-800">Account Settings</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={settings.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={settings.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={settings.phone}
              onChange={handleInputChange}
              placeholder="+1 (123) 456-7890"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Include country code for international numbers</p>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="relative">
            <input
              type="text"
              id="address"
              name="address"
              value={settings.address}
              onChange={handleInputChange}
              placeholder="123 Green Street, Eco City, 12345"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            id="notifications"
            name="notifications"
            checked={settings.notifications}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
            Receive email notifications about collection opportunities and rewards
          </label>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-green-500 hover:bg-green-600 text-white mt-6"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-md font-medium text-gray-700 mb-2">Data Privacy</h3>
        <p className="text-sm text-gray-600">
          Your personal information is used only to facilitate waste collection and rewards. 
          We never share your data with third parties without your consent.
        </p>
      </div>
    </div>
  )
}