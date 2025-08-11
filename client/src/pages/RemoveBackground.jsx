import React, { useState } from 'react'
import { Eraser, Sparkles } from 'lucide-react'

function RemoveBackground() {

    const [input, setInput] = useState('')
    const [previewUrl, setPreviewUrl] = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        setInput(file)
        
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

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
                    <Sparkles className='w-6 text-[#ea580c]' />
                    <h1 className='text-xl font-semibold'>Remove Background</h1>
                </div>
                <p className='mt-6 text-sm font-medium'>
                    Upload Image
                </p>
                <div className='mt-2'>
                    <input 
                        onChange={handleFileChange} 
                        type="file" 
                        accept='image/*' 
                        className='w-full p-2 px-3 outline-none text-sm rounded-md border border-gray-300 
                        focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] text-gray-600 
                        file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 
                        file:text-sm file:font-medium file:bg-orange-50 file:text-[#ea580c] 
                        file:cursor-pointer file:transition-all file:duration-200
                        hover:file:bg-orange-100'
                        required 
                    />
                    <p className='text-xs text-gray-500 mt-2'>Supports: .jpg, .jpeg, .png, .webp</p>
                </div>

                {previewUrl && (
                    <div className='mt-4 p-2 border border-gray-200 rounded-md'>
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className='w-full h-32 object-contain rounded'
                        />
                    </div>
                )}

                <button className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#ea580c] to-[#fb923c] 
                    text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer hover:from-[#c2410c] hover:to-[#ea580c] 
                    transition-all duration-200 shadow-md hover:shadow-lg'>
                    <Eraser className='w-5' />
                    Remove Background
                </button>
            </form>
            
            {/* right col */}
            <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96'>
                <div className='flex items-center gap-3'>
                    <Eraser className='w-5 h-5 text-[#ea580c]' />
                    <h1 className='text-xl font-semibold'>Processed Image</h1>
                </div>
                <div className='flex-1 flex justify-center items-center'>
                    <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                        <Eraser className='w-9 h-9' />
                        <p>Upload an image and click "Remove Background" to get started</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RemoveBackground