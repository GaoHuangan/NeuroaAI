import React from 'react'
import { useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { Heart, Sparkles, TrendingUp, Calendar, FileText, Image, Globe, Lock, Trash2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

const Community = () => {

 const [creations, setCreations] = useState([])
 const [likedPosts, setLikedPosts] = useState(new Set())
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [viewMode, setViewMode] = useState('my') // 'my' or 'published'
 const { user } = useUser()
 const { getToken } = useAuth()

 // **ADDED: Fetch user's own creations**
 const fetchCreations = async () => {
   try {
     setLoading(true)
     setError(null)
     
     const { data } = await axios.get('/api/user/get-user-creations', {
       headers: {
         Authorization: `Bearer ${await getToken()}`
       }
     })

     if (!data.success) {
       setError(data.message)
       toast.error(data.message)
       return
     }

     setCreations(data.data || [])
     
     // Initialize liked posts based on actual data
     if (data.data && user) {
       const liked = new Set(
         data.data
           .map((creation, index) => ({ creation, index }))
           .filter(({ creation }) => creation.isLiked)
           .map(({ index }) => index)
       )
       setLikedPosts(liked)
     }

   } catch (error) {
     const errorMessage = error.response?.data?.message || 'Failed to fetch creations'
     setError(errorMessage)
     toast.error(errorMessage)
     console.error('Fetch creations error:', error)
   } finally {
     setLoading(false)
   }
 }

 // **ADDED: Fetch published creations from community**
 const fetchPublishedCreations = async () => {
   try {
     setLoading(true)
     setError(null)
     
     const { data } = await axios.get('/api/user/get-published-creations', {
       headers: {
         Authorization: `Bearer ${await getToken()}`
       }
     })

     if (!data.success) {
       setError(data.message)
       toast.error(data.message)
       return
     }

     setCreations(data.data || [])
     
     // Initialize liked posts for published creations
     if (data.data && user) {
       const liked = new Set(
         data.data
           .map((creation, index) => ({ creation, index }))
           .filter(({ creation }) => creation.isLiked)
           .map(({ index }) => index)
       )
       setLikedPosts(liked)
     }

   } catch (error) {
     const errorMessage = error.response?.data?.message || 'Failed to fetch published creations'
     setError(errorMessage)
     toast.error(errorMessage)
     console.error('Fetch published creations error:', error)
   } finally {
     setLoading(false)
   }
 }

 // **ADDED: Toggle like functionality**
 const handleLike = async (index) => {
   const creation = creations[index]
   if (!creation) return

   try {
     // Optimistic update
     const wasLiked = likedPosts.has(index)
     
     setLikedPosts(prev => {
       const newLiked = new Set(prev)
       if (newLiked.has(index)) {
         newLiked.delete(index)
       } else {
         newLiked.add(index)
       }
       return newLiked
     })

     // Update local state
     setCreations(prev => prev.map((item, i) => {
       if (i === index) {
         return {
           ...item,
           like_count: wasLiked ? (item.like_count || 0) - 1 : (item.like_count || 0) + 1,
           isLiked: !wasLiked
         }
       }
       return item
     }))

     // **ADDED: API call to toggle like**
     const { data } = await axios.post('/api/user/toggle-like-creation', 
       { creationId: creation.id },
       {
         headers: {
           Authorization: `Bearer ${await getToken()}`
         }
       }
     )

     if (!data.success) {
       throw new Error(data.message || 'Failed to toggle like')
     }

   } catch (error) {
     // Revert optimistic update on error
     setLikedPosts(prev => {
       const newLiked = new Set(prev)
       if (newLiked.has(index)) {
         newLiked.delete(index)
       } else {
         newLiked.add(index)
       }
       return newLiked
     })
     
     // Revert creation state
     setCreations(prev => prev.map((item, i) => {
       if (i === index) {
         const wasLiked = !likedPosts.has(index)
         return {
           ...item,
           like_count: wasLiked ? (item.like_count || 0) - 1 : (item.like_count || 0) + 1,
           isLiked: wasLiked
         }
       }
       return item
     }))
     
     toast.error(error.response?.data?.message || 'Failed to update like')
   }
 }

 // **ADDED: Delete creation functionality**
 const handleDelete = async (creationId, index) => {
   if (!window.confirm('Are you sure you want to delete this creation? This action cannot be undone.')) {
     return
   }

   try {
     const { data } = await axios.delete(`/api/user/delete-creation/${creationId}`, {
       headers: {
         Authorization: `Bearer ${await getToken()}`
       }
     })

     if (!data.success) {
       throw new Error(data.message || 'Failed to delete creation')
     }

     // Remove from local state
     setCreations(prev => prev.filter((_, i) => i !== index))
     setLikedPosts(prev => {
       const newLiked = new Set(prev)
       newLiked.delete(index)
       // Adjust indices for remaining items
       const adjustedLiked = new Set()
       newLiked.forEach(likedIndex => {
         if (likedIndex < index) {
           adjustedLiked.add(likedIndex)
         } else if (likedIndex > index) {
           adjustedLiked.add(likedIndex - 1)
         }
       })
       return adjustedLiked
     })

     toast.success('Creation deleted successfully')

   } catch (error) {
     toast.error(error.response?.data?.message || 'Failed to delete creation')
   }
 }

 // **ADDED: Switch between view modes**
 const handleViewModeChange = (mode) => {
   setViewMode(mode)
   if (mode === 'my') {
     fetchCreations()
   } else {
     fetchPublishedCreations()
   }
 }

 const getCreationIcon = (type) => {
   switch (type) {
     case 'article':
       return <FileText className='w-4 h-4' />
     case 'image':
       return <Image className='w-4 h-4' />
     case 'resume_review':
       return <FileText className='w-4 h-4' />
     default:
       return <Sparkles className='w-4 h-4' />
   }
 }

 const formatDate = (dateString) => {
   const date = new Date(dateString)
   return date.toLocaleDateString('en-US', { 
     month: 'short', 
     day: 'numeric',
     year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
   })
 }

 const isImageContent = (content, type) => {
   return type === 'image' || 
          (typeof content === 'string' && 
           (content.startsWith('http') || content.startsWith('data:image')))
 }

 useEffect(() => {
   if (user) {
     if (viewMode === 'my') {
       fetchCreations()
     } else {
       fetchPublishedCreations()
     }
   }
 }, [user])

 if (loading) {
   return (
     <div className='min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center'>
       <div className='flex flex-col items-center gap-4'>
         <div className='w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
         <p className='text-gray-600'>Loading creations...</p>
       </div>
     </div>
   )
 }

 if (error) {
   return (
     <div className='min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center'>
       <div className='flex flex-col items-center gap-4 text-center'>
         <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
           <Sparkles className='w-6 h-6 text-red-600' />
         </div>
         <div>
           <p className='text-gray-800 font-medium'>Failed to load creations</p>
           <p className='text-gray-500 text-sm mt-1'>{error}</p>
         </div>
         <button 
           onClick={viewMode === 'my' ? fetchCreations : fetchPublishedCreations}
           className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
         >
           Try Again
         </button>
       </div>
     </div>
   )
 }

 return (
   <div className='min-h-screen bg-gray-50 py-8 px-4'>
     {/* Header Section */}
     <div className='max-w-7xl mx-auto mb-8'>
       <div className='flex items-center justify-between mb-6'>
         <div className='flex items-center gap-3'>
           <Sparkles className='w-8 h-8 text-purple-600' />
           <h1 className='text-3xl font-bold text-gray-800'>
             {viewMode === 'my' ? 'My Creations' : 'Community'}
           </h1>
         </div>
         <div className='flex items-center gap-2 text-sm text-gray-600'>
           <TrendingUp className='w-4 h-4' />
           <span>{creations.length} creation{creations.length !== 1 ? 's' : ''}</span>
         </div>
       </div>

       {/* **ADDED: View mode toggle** */}
       <div className='flex items-center gap-4 mb-4'>
         <div className='flex bg-white rounded-lg p-1 border border-gray-200'>
           <button
             onClick={() => handleViewModeChange('my')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
               viewMode === 'my'
                 ? 'bg-purple-600 text-white'
                 : 'text-gray-600 hover:text-gray-900'
             }`}
           >
             <Eye className='w-4 h-4 mr-2 inline' />
             My Creations
           </button>
           <button
             onClick={() => handleViewModeChange('published')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
               viewMode === 'published'
                 ? 'bg-purple-600 text-white'
                 : 'text-gray-600 hover:text-gray-900'
             }`}
           >
             <Globe className='w-4 h-4 mr-2 inline' />
             Community
           </button>
         </div>
       </div>

       <p className='text-gray-600'>
         {viewMode === 'my' 
           ? 'Your AI-generated content collection' 
           : 'Discover amazing AI-generated content from our community'
         }
       </p>
     </div>

     {/* Grid Layout */}
     <div className='max-w-7xl mx-auto'>
       {creations.length > 0 ? (
         <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
           {creations.map((creation, index) => (
             <div 
               key={creation.id || index} 
               className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group relative'
             >
               {/* **ADDED: Delete button for own creations** */}
               {viewMode === 'my' && (
                 <button
                   onClick={() => handleDelete(creation.id, index)}
                   className='absolute top-2 left-2 z-10 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600'
                   title='Delete creation'
                 >
                   <Trash2 className='w-4 h-4' />
                 </button>
               )}

               {/* Content Container */}
               <div className='relative aspect-square overflow-hidden bg-gray-100'>
                 {isImageContent(creation.content, creation.type) ? (
                   <img 
                     src={creation.content} 
                     alt={creation.prompt}
                     className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                     onError={(e) => {
                       e.target.style.display = 'none'
                       e.target.nextSibling.style.display = 'flex'
                     }}
                   />
                 ) : (
                   <div className='w-full h-full flex items-center justify-center p-4'>
                     <div className='text-center'>
                       {getCreationIcon(creation.type)}
                       <p className='text-xs text-gray-500 mt-2 capitalize'>{creation.type}</p>
                     </div>
                   </div>
                 )}
                 
                 {/* Fallback for broken images */}
                 <div className='w-full h-full hidden items-center justify-center p-4 bg-gray-100'>
                   <div className='text-center'>
                     {getCreationIcon(creation.type)}
                     <p className='text-xs text-gray-500 mt-2 capitalize'>{creation.type}</p>
                   </div>
                 </div>

                 {/* **MODIFIED: Privacy badge - only show for own creations** */}
                 {viewMode === 'my' && (
                   <div className='absolute top-2 right-2'>
                     <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                       creation.visibility === 'public' 
                         ? 'bg-green-100 text-green-700' 
                         : 'bg-gray-100 text-gray-600'
                     }`}>
                       {creation.visibility === 'public' ? <Globe className='w-3 h-3' /> : <Lock className='w-3 h-3' />}
                       {creation.visibility}
                     </span>
                   </div>
                 )}

                 {/* Overlay gradient on hover */}
                 <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
               </div>

               {/* Content Section */}
               <div className='p-4'>
                 {/* Prompt text */}
                 <p className='text-sm text-gray-700 line-clamp-2 mb-3 min-h-[2.5rem]'>
                   {creation.prompt || 'No prompt available'}
                 </p>

                 {/* Footer with likes and date */}
                 <div className='flex items-center justify-between'>
                   <div className='flex items-center gap-2'>
                     <button
                       onClick={() => handleLike(index)}
                       className='p-2 rounded-full hover:bg-gray-100 transition-colors duration-200'
                     >
                       <Heart 
                         className={`w-5 h-5 transition-all duration-300 ${
                           likedPosts.has(index) 
                             ? 'fill-red-500 text-red-500 scale-110' 
                             : 'text-gray-500 hover:text-red-500'
                         }`} 
                       />
                     </button>
                     <span className={`text-sm font-medium ${
                       likedPosts.has(index) ? 'text-red-500' : 'text-gray-600'
                     }`}>
                       {creation.like_count || 0}
                     </span>
                   </div>

                   {/* Date */}
                   <div className='flex items-center gap-1 text-xs text-gray-400'>
                     <Calendar className='w-3 h-3' />
                     <span>{formatDate(creation.created_at)}</span>
                   </div>
                 </div>
               </div>
             </div>
           ))}
         </div>
       ) : (
         /* Empty State */
         <div className='flex flex-col items-center justify-center py-20'>
           <Sparkles className='w-12 h-12 text-gray-300 mb-4' />
           <p className='text-gray-500 text-lg'>
             {viewMode === 'my' ? 'No creations yet' : 'No published creations yet'}
           </p>
           <p className='text-gray-400 text-sm mt-2'>
             {viewMode === 'my' 
               ? 'Start creating with AI to see your work here!' 
               : 'Check back later for community content!'
             }
           </p>
         </div>
       )}
     </div>
   </div>
 )
}

export default Community