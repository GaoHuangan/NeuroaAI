import React from 'react'
import { useUser } from '@clerk/clerk-react'
import { dummyPublishedCreationData } from '../assets/assets'
import { useState, useEffect } from 'react'
import { Heart, Sparkles, TrendingUp } from 'lucide-react'

const Community = () => {

  const [creations, setCreations] = useState([])
  const [likedPosts, setLikedPosts] = useState(new Set())
  const { user } = useUser()

  const fetchCreations = async () => {
    setCreations(dummyPublishedCreationData)
    // 初始化已点赞的帖子
    const liked = new Set(
      dummyPublishedCreationData
        .filter(creation => creation.likes.includes(user?.id))
        .map((_, index) => index)
    )
    setLikedPosts(liked)
  }

  const handleLike = (index) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev)
      if (newLiked.has(index)) {
        newLiked.delete(index)
      } else {
        newLiked.add(index)
      }
      return newLiked
    })
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      {/* Header Section */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <Sparkles className='w-8 h-8 text-purple-600' />
            <h1 className='text-3xl font-bold text-gray-800'>Community Creations</h1>
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <TrendingUp className='w-4 h-4' />
            <span>{creations.length} creations</span>
          </div>
        </div>
        <p className='text-gray-600'>Discover amazing AI-generated content from our community</p>
      </div>

      {/* Grid Layout */}
      <div className='max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {creations.map((creation, index) => (
            <div 
              key={index} 
              className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group'
            >
              {/* Image Container */}
              <div className='relative aspect-square overflow-hidden bg-gray-100'>
                <img 
                  src={creation.content} 
                  alt={creation.prompt}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' 
                />
                {/* Overlay gradient on hover */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              </div>

              {/* Content Section */}
              <div className='p-4'>
                {/* Prompt text */}
                <p className='text-sm text-gray-700 line-clamp-2 mb-3 min-h-[2.5rem]'>
                  {creation.prompt}
                </p>

                {/* Footer with likes */}
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
                      {creation.likes.length + (likedPosts.has(index) && !creation.likes.includes(user?.id) ? 1 : 0)}
                    </span>
                  </div>

                  {/* Optional: Add creator info or date */}
                  <span className='text-xs text-gray-400'>
                    {creation.date || '2 days ago'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {creations.length === 0 && (
          <div className='flex flex-col items-center justify-center py-20'>
            <Sparkles className='w-12 h-12 text-gray-300 mb-4' />
            <p className='text-gray-500 text-lg'>No creations yet</p>
            <p className='text-gray-400 text-sm mt-2'>Be the first to share your creation!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community