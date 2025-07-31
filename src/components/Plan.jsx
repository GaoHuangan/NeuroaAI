import React from 'react'

const Plan = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "5 AI image generations",
        "Basic templates",
        "Community support",
        "Standard quality images"
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-gray-100 text-gray-900 hover:bg-gray-200"
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month", 
      description: "Best for content creators",
      features: [
        "100 AI image generations",
        "Premium templates",
        "Priority support",
        "High-quality images",
        "Background removal",
        "Object removal"
      ],
      popular: true,
      buttonText: "Start Pro Plan",
      buttonStyle: "bg-blue-500 text-white hover:bg-blue-600"
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "/month",
      description: "For teams and businesses",
      features: [
        "Unlimited AI generations",
        "All premium features",
        "Team collaboration",
        "Custom integrations",
        "Dedicated support",
        "API access",
        "White-label options"
      ],
      buttonText: "Contact Sales",
      buttonStyle: "bg-gray-900 text-white hover:bg-gray-800"
    }
  ]

  return (
    <div className='max-w-6xl mx-auto z-20 my-20 px-4'>
      <div className='text-center mb-16'>
        <h2 className='text-slate-700 text-[42px] font-semibold mb-4'>Choose Your Plan</h2>
        <p className='text-gray-500 max-w-lg mx-auto text-lg'>
          Start for free and upgrade when you're ready. Find the perfect plan for your content creation needs.
        </p>
      </div>
      
      <div className='grid md:grid-cols-3 gap-8'>
        {plans.map((plan, index) => (
          <div key={index} className={`relative bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl ${
            plan.popular ? 'ring-2 ring-blue-500 scale-105' : 'border border-gray-200'
          }`}>
            {plan.popular && (
              <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                <span className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg'>
                  Most Popular
                </span>
              </div>
            )}
            
            <div className='text-center'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>{plan.name}</h3>
              <p className='text-gray-500 text-sm mb-6'>{plan.description}</p>
              
              <div className='mb-8'>
                <span className='text-5xl font-bold text-gray-900'>{plan.price}</span>
                <span className='text-gray-500 text-lg'>{plan.period}</span>
              </div>
              
              <ul className='space-y-4 mb-8 text-left'>
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className='flex items-start text-gray-600'>
                    <svg className='w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${plan.buttonStyle}`}>
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* 底部说明 */}
      <div className='text-center mt-16'>
        <p className='text-gray-500 text-sm'>
          All plans include 24/7 customer support and a 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}

export default Plan