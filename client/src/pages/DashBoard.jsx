import React, { useState, useEffect } from 'react'
import { dummyCreationData } from '../assets/assets'
import { Sparkle, Gem } from 'lucide-react'
import { Protect } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'

const DashBoard = () => {
    const [creations, setCreations] = useState([])

    const getDashboardData = async () => {
        setCreations(dummyCreationData)
    }

    useEffect(() => {
        getDashboardData()
    }, [])

    return (
        <div className='h-full overflow-y-scroll p-6'>
            <div className='flex justify-start gap-4 flex-wrap'>
                {/* Total Creations Card */}
                <div className='flex justify-between items-center w-72 py-4 px-6 bg-white rounded-xl border border-gray-200 shadow-sm'>
                    <div>
                        <p className='text-gray-600 text-sm mb-1'>Total Creations</p>
                        <h2 className='text-2xl font-bold text-gray-900'>{creations.length}</h2>
                    </div>
                    <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center'>
                        <Sparkle className='w-6 h-6 text-white' />
                    </div>
                </div>

                {/* Active plan Card */}
                <div className='flex justify-between items-center w-72 py-4 px-6 bg-white rounded-xl border border-gray-200 shadow-sm'>
                    <div>
                        <p className='text-gray-600 text-sm mb-1'>Active Plan</p>
                        <h2 className='text-2xl font-bold'>
                            <Protect
                                plan='premium'
                                fallback={<span className="text-gray-500">Free</span>}
                            >
                                <span className="text-purple-600">Premium</span>
                            </Protect>
                        </h2>
                    </div>
                    <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center'>
                        <Gem className='w-6 h-6 text-white' />
                    </div>
                </div>
            </div>
            <div className='space-y-3'>
                <p className='mt-6 mb-4'>Recent Creations</p>
                {
                    creations.map((item) => (
                        <CreationItem key={item.id} item={item} />
                    ))
                }
            </div>
        </div>
    )
}

export default DashBoard