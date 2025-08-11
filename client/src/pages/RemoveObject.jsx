import React, { useState } from 'react'
import { Scissors, Sparkles } from 'lucide-react'

function RemoveObject() {

    const [objectName, setObjectName] = useState('')
    const [input, setInput] = useState('')
    const [previewUrl, setPreviewUrl] = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        
        if (file) {
            const url = URL.createObjectURL(file)
            setInput(file)
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
                    <Sparkles className='w-6 text-[#e11d48]' />
                    <h1 className='text-xl font-semibold'>Remove Object</h1>
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
                        focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] text-gray-600 
                        file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 
                        file:text-sm file:font-medium file:bg-rose-50 file:text-[#e11d48] 
                        file:cursor-pointer file:transition-all file:duration-200
                        hover:file:bg-rose-100'
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

                <p className='mt-4 text-sm font-medium'>
                    Describe object to remove
                </p>
                <textarea 
                    onChange={(e) => setObjectName(e.target.value)} 
                    value={objectName}
                    rows={4} 
                    className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 
                    focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] transition-colors duration-200'
                    placeholder='e.g., watch, spoon, or any single object name' 
                    required 
                />

                <button className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#e11d48] to-[#f43f5e] 
                    text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer hover:from-[#be123c] hover:to-[#e11d48] 
                    transition-all duration-200 shadow-md hover:shadow-lg'>
                    <Scissors className='w-5' />
                    Remove Object
                </button>
            </form>

            {/* right col */}
            <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96'>
                <div className='flex items-center gap-3'>
                    <Scissors className='w-5 h-5 text-[#e11d48]' />
                    <h1 className='text-xl font-semibold'>Processed Image</h1>
                </div>
                <div className='flex-1 flex justify-center items-center'>
                    <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                        <Scissors className='w-9 h-9' />
                        <p>Upload an image and click "Remove Object" to get started</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RemoveObject