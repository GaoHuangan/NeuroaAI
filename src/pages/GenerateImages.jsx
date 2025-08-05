import React, { useState } from 'react'
import { Hash, Image, Sparkles } from 'lucide-react'

function GenerateImages() {

    const imageStyles = [
        'Realistic',
        'Cartoon',
        'Digital Art',
        'Watercolor',
        'Impressionist',
        'Pop Art',
        'Surrealist',
        'Minimalist',
        'Abstract',
        'Impressionist',
    ]

    const [selectedStyle, setSelectedStyle] = useState(imageStyles[0])
    const [input, setInput] = useState('')
    const [publish, setPublish] = useState(false)

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
            {/* left col */}
            <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
                <div className='flex items-center gap-3'>
                    <Sparkles className='w-6 text-[#0d9488]' />
                    <h1 className='text-xl font-semibold'>AI Image Generator</h1>
                </div>
                <p className='mt-6 text-sm font-medium'>
                    Describe Your Image
                </p>
                <textarea onChange={(e) => setInput(e.target.value)} value={input}
                    rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]'
                    placeholder='Describe what your want to see in the image!' required />
                <p className='mt-4 text-sm font-medium'>Style</p>

                <div className='flex flex-wrap sm:max-w-9/11 gap-3 mt-3'>
                    {imageStyles.map((item) => (
                        <span onClick={() => setSelectedStyle(item)} key={item}
                            className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition-all duration-200 ${selectedStyle === item ?
                                'bg-teal-50 text-[#0d9488] border-[#0d9488]'
                                :
                                'border-gray-300 text-gray-500 hover:border-[#0d9488] hover:text-[#0d9488]'}`}>
                            {item}
                        </span>
                    ))}
                </div>

                <div className='my-6 flex items-center justify-between'>
                    <p className='text-sm font-medium text-gray-700'>Make this image public</p>
                    <label className='relative cursor-pointer'>
                        <input 
                            type="checkbox" 
                            checked={publish} 
                            onChange={(e) => setPublish(e.target.checked)} 
                            className='sr-only peer' 
                        />
                        <div className={`w-11 h-6 rounded-full border-2 transition-all duration-200 relative ${
                            publish ? 'bg-[#0d9488] border-[#0d9488]' : 'bg-gray-200 border-gray-300'
                        }`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                publish ? 'translate-x-5' : 'translate-x-0'
                            }`}></span>
                        </div>
                    </label>
                </div>

                <button className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#0d9488] to-[#14b8a6] text-white px-4 py-2 mt-6
                    text-sm rounded-lg cursor-pointer hover:from-[#0f766e] hover:to-[#0d9488] transition-all duration-200 shadow-md hover:shadow-lg'>
                    <Image className='w-5' />
                    Generate Image
                </button>
            </form>
            {/* right col */}
            <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96'>
                <div className='flex items-center gap-3'>
                    <Image className='w-5 h-5 text-[#0d9488]' />
                    <h1 className='text-xl font-semibold'>Generated Image</h1>
                </div>
                <div className='flex-1 flex justify-center items-center'>
                    <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                        <Image className='w-9 h-9' />
                        <p>Enter a topic and click "Generate Image" to get started</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GenerateImages