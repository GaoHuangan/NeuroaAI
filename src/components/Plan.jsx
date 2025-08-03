import React from 'react'
import { PricingTable } from '@clerk/clerk-react'

const Plan = () => {
  return (
    <div className='max-w-4xl mx-auto z-20 my-20 px-4'>
      <div className='text-center mb-12'>
        <h2 className='text-slate-700 text-[42px] font-semibold mb-4'>Choose Your Plan</h2>
        <p className='text-gray-500 max-w-lg mx-auto text-lg'>
          Start for free and upgrade when you're ready. Find the perfect plan for your content creation needs.
        </p>
      </div>
      <div className='w-full'>
        <PricingTable />
      </div>
    </div>
  )
}

export default Plan