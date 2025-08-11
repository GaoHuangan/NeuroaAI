import React, { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

function ReviewResume() {

    const [input, setInput] = useState('')
    const [fileName, setFileName] = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        setInput(file)
        
        if (file) {
            setFileName(file.name)
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
                    <Sparkles className='w-6 text-[#eab308]' />
                    <h1 className='text-xl font-semibold'>Review Resume</h1>
                </div>
                <p className='mt-6 text-sm font-medium'>
                    Upload Resume
                </p>
                <div className='mt-2'>
                    <input 
                        onChange={handleFileChange} 
                        type="file" 
                        accept='application/pdf'
                        className='w-full p-2 px-3 outline-none text-sm rounded-md border border-gray-300 
                        focus:border-[#eab308] focus:ring-1 focus:ring-[#eab308] text-gray-600 
                        file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 
                        file:text-sm file:font-medium file:bg-yellow-50 file:text-[#ca8a04] 
                        file:cursor-pointer file:transition-all file:duration-200
                        hover:file:bg-yellow-100'
                        required 
                    />
                    <p className='text-xs text-gray-500 mt-2'>Supports: PDF files only</p>
                </div>

                {fileName && (
                    <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2'>
                        <FileText className='w-4 h-4 text-[#eab308]' />
                        <span className='text-sm text-gray-700 truncate'>{fileName}</span>
                    </div>
                )}

                <button className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#eab308] to-[#facc15] 
                    text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer hover:from-[#ca8a04] hover:to-[#eab308] 
                    transition-all duration-200 shadow-md hover:shadow-lg'>
                    <FileText className='w-5' />
                    Review Resume
                </button>
            </form>
            
            {/* right col */}
            <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96'>
                <div className='flex items-center gap-3'>
                    <FileText className='w-5 h-5 text-[#eab308]' />
                    <h1 className='text-xl font-semibold'>Analysis Results</h1>
                </div>
                <div className='flex-1 flex justify-center items-center'>
                    <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                        <FileText className='w-9 h-9' />
                        <p>Upload a resume and click "Review Resume" to get started</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReviewResume