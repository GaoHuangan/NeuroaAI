import React, { useState, useEffect } from 'react'
import { FileText, Sparkles, Download, CheckCircle, AlertCircle, Info, Star, X, Upload } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

function ReviewResume() {

    const [input, setInput] = useState(null)
    const [fileName, setFileName] = useState('')
    const [fileSize, setFileSize] = useState(0)
    const [loading, setLoading] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)

    // **ADDED: useAuth hook for authentication**
    const { getToken } = useAuth()
    // **WHY: Need authentication token for API calls**

    const handleFileChange = (e) => {
        const file = e.target.files[0]

        if (file) {
            // **ADDED: File size validation**
            const maxSize = 10 * 1024 * 1024 // 10MB
            if (file.size > maxSize) {
                toast.error('File size cannot exceed 10MB')
                e.target.value = ''
                return
            }
            // **WHY: Prevent server errors and provide user feedback**

            // **ADDED: File type validation**
            const allowedTypes = ['application/pdf', 'text/plain'];
            const isValidType = allowedTypes.includes(file.type) ||
                file.name.toLowerCase().endsWith('.pdf') ||
                file.name.toLowerCase().endsWith('.txt');

            if (!isValidType) {
                toast.error('Only PDF and TXT files are supported')
                e.target.value = ''
                return
            }
            // **WHY: Ensure only supported file formats are uploaded**

            setInput(file)
            setFileName(file.name)
            // **ADDED: Store file size**
            setFileSize(file.size)
            // **WHY: Display file information to user**

            // **ADDED: Clear previous analysis**
            setAnalysisResult(null)
            // **WHY: Remove old results when new file is selected**
        } else {
            clearFile()
        }
    }

    // **ADDED: Clear file function**
    const clearFile = () => {
        setInput(null)
        setFileName('')
        setFileSize(0)
        setAnalysisResult(null)
    }
    // **WHY: Centralized file clearing logic**

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()

            // **ADDED: Input validation**
            if (!input) {
                toast.error('Please select a PDF or TXT file first')
                return
            }
            // **WHY: Prevent empty submissions**

            setLoading(true)

            // **ADDED: FormData creation for file upload**
            const formData = new FormData()
            formData.append('resume', input)
            // **WHY: Required for multipart file uploads**

            // **ADDED: Get authentication token**
            const token = await getToken()
            // **WHY: API requires authentication**

            // **ADDED: API call to resume review endpoint**
            const response = await axios.post('/api/ai/resume-review', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            // **WHY: Send file to backend for AI analysis**

            // **ADDED: Response handling**
            if (response.data.success) {
                const responseData = response.data.data
                setAnalysisResult(responseData)
                toast.success('Resume analysis completed!')
            } else {
                toast.error(response.data.message || 'Resume analysis failed')
            }
            // **WHY: Handle success and error responses appropriately**

        } catch (error) {
            console.error('Resume review error:', error)

            // **ADDED: Enhanced error handling**
            let errorMessage = 'An unknown error occurred'

            if (error.response?.status === 403) {
                errorMessage = 'This feature is only available for premium users. Please upgrade your account.'
            } else if (error.response?.status === 413) {
                errorMessage = 'File is too large. Please select a file smaller than 10MB.'
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid file format or request'
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.error(errorMessage)
            // **WHY: Provide specific, actionable error messages**
        } finally {
            setLoading(false)
        }
    }

    // **ADDED: Download report function**
    const downloadReport = () => {
        if (!analysisResult) return

        try {
            // **ADDED: Extract content from different possible response formats**
            const reportContent = analysisResult.analysis?.detailed_feedback ||
                analysisResult.review ||
                JSON.stringify(analysisResult, null, 2)
            // **WHY: Handle different response formats from backend**

            const blob = new Blob([reportContent], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `resume-analysis-${Date.now()}.txt`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('Analysis report downloaded successfully!')
        } catch (error) {
            toast.error('Download failed, please try again later')
        }
    }
    // **WHY: Allow users to save their analysis results**

    // **ADDED: Parse AI analysis data**
    const parseAnalysisData = () => {
        if (!analysisResult) return null

        let analysis = analysisResult.analysis || analysisResult

        // **ADDED: Handle string responses**
        if (typeof analysis === 'string') {
            try {
                analysis = JSON.parse(analysis)
            } catch (error) {
                return { rawText: analysis }
            }
        }
        // **WHY: AI might return JSON string that needs parsing**

        // **ADDED: Handle review field**
        if (analysisResult.review && typeof analysisResult.review === 'string') {
            try {
                const parsedReview = JSON.parse(analysisResult.review)
                analysis = { ...analysis, ...parsedReview }
            } catch (error) {
                analysis.rawText = analysisResult.review
            }
        }
        // **WHY: Different response formats need to be handled**

        return analysis
    }

    // **ADDED: Score circle visualization**
    const renderScoreCircle = (score) => {
        const percentage = score || 0
        const strokeDasharray = `${percentage * 2.51} 251`

        return (
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f3f4f6"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#eab308"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#eab308]">{percentage}</span>
                </div>
            </div>
        )
    }
    // **WHY: Visual representation of resume score is more engaging**

    // **ADDED: Analysis content renderer**
    // **MODIFIED: Change how you handle the analysis result**
    const renderAnalysisContent = () => {
        if (!analysisResult) return null

        // **ADDED: Extract the markdown string from backend response**
        const markdownContent = analysisResult.analysis || ''

        // **MODIFIED: Return the markdown string directly, not JSX**
        return markdownContent
    }

    // **MODIFIED: Update the JSX to handle markdown properly**
    <div className='flex-1 overflow-y-auto p-4'>
        {analysisResult ? (
            <Markdown className="prose prose-sm max-w-none text-gray-700 reset-tw">
                {renderAnalysisContent()}
            </Markdown>
        ) : (
            <div className='flex justify-center items-center h-full'>
                <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                    <FileText className='w-9 h-9' />
                    <p className='text-center'>Upload a PDF resume and click "Review Resume" to get started</p>
                </div>
            </div>
        )}
    </div>

    // **ADDED: File size formatter**
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    // **WHY: Display human-readable file sizes**

    return (
        <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
            {/* left col */}
            <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
                {/* **ADDED: shadow-sm for better visual hierarchy** */}
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
                        accept='.pdf,.txt,application/pdf,text/plain'
                        // **MODIFIED: Accept both PDF and TXT files**
                        // **WHY: Support multiple common resume formats**
                        className='w-full p-2 px-3 outline-none text-sm rounded-md border border-gray-300 
                        focus:border-[#eab308] focus:ring-1 focus:ring-[#eab308] text-gray-600 
                        file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 
                        file:text-sm file:font-medium file:bg-yellow-50 file:text-[#ca8a04] 
                        file:cursor-pointer file:transition-all file:duration-200
                        hover:file:bg-yellow-100'
                        required
                    />
                    <p className='text-xs text-gray-500 mt-2'>
                        {/* **MODIFIED: Updated supported formats** */}
                        Supports: PDF and TXT files (Max: 10MB)
                        {/* **WHY: Accurate format information** */}
                    </p>
                </div>

                {/* **MODIFIED: Enhanced file info display** */}
                {fileName && (
                    <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2'>
                        <FileText className='w-4 h-4 text-[#eab308]' />
                        <div className='flex-1'>
                            <span className='text-sm text-gray-700 truncate block'>{fileName}</span>
                            <span className='text-xs text-gray-500'>
                                {formatFileSize(fileSize)}
                            </span>
                        </div>
                        {/* **ADDED: Clear file button** */}
                        <button
                            type="button"
                            onClick={clearFile}
                            className='text-gray-400 hover:text-red-500 transition-colors'
                        >
                            <X className='w-4 h-4' />
                        </button>
                    </div>
                )}
                {/* **WHY: Show file details and allow easy removal** */}

                {/* **MODIFIED: Enhanced button with loading state** */}
                <button
                    disabled={loading || !input}
                    className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#eab308] to-[#facc15] 
                    text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer hover:from-[#ca8a04] hover:to-[#eab308] 
                    transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'>
                    {loading ? (
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            <span>Analyzing...</span>
                        </div>
                    ) : (
                        <FileText className='w-5' />
                    )}
                    Review Resume
                </button>
                {/* **WHY: Visual feedback during processing improves UX** */}

                {/* **ADDED: Premium feature notice** */}
                <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                    <div className='flex items-start gap-2'>
                        <AlertCircle className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
                        <div className='text-xs text-blue-700'>
                            <p className='font-medium mb-1'>Premium Feature</p>
                            <p>AI-powered resume analysis with detailed feedback and improvement suggestions.</p>
                        </div>
                    </div>
                </div>
                {/* **WHY: Set expectations and promote premium features** */}
            </form>

            {/* right col */}
            {!analysisResult ? (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col min-h-96 max-h-[600px]'>
                    {/* **ADDED: shadow-sm and max-height** */}
                    <div className='flex items-center gap-3'>
                        <FileText className='w-5 h-5 text-[#eab308]' />
                        <h1 className='text-xl font-semibold'>Analysis Results</h1>
                    </div>
                    <div className='flex-1 flex justify-center items-center'>
                        <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                            <FileText className='w-9 h-9' />
                            <p className='text-center'>Upload a PDF or TXT resume and click "Review Resume" to get started</p>
                            {/* **MODIFIED: Updated instruction text** */}
                        </div>
                    </div>
                </div>
            ) : (
                // **ADDED: Complete analysis results panel**
                <div className='w-full max-w-lg bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col max-h-[600px]'>
                    <div className='flex items-center justify-between p-4 border-b border-gray-100'>
                        <div className='flex items-center gap-3'>
                            <FileText className='w-5 h-5 text-[#eab308]' />
                            <h1 className='text-xl font-semibold'>Analysis Results</h1>
                        </div>
                        <button
                            onClick={downloadReport}
                            className='flex items-center gap-2 px-3 py-1 bg-[#eab308] text-white text-sm rounded-md 
                            hover:bg-[#ca8a04] transition-all duration-200'
                        >
                            <Download className='w-4 h-4' />
                            Download
                        </button>
                    </div>

                    <div className='flex-1 overflow-y-auto p-4'>
                        <Markdown>{renderAnalysisContent()}</Markdown>
                    </div>

                    {/* **ADDED: Footer with file information** */}
                    <div className='p-4 border-t border-gray-100 bg-gray-50'>
                        <div className='text-center'>
                            <span className='text-xs text-gray-500'>Analysis completed for: </span>
                            <span className='text-xs font-medium text-[#eab308]'>{fileName}</span>
                        </div>
                        <div className='text-center mt-1'>
                            <span className='text-xs text-gray-400'>
                                Click download to save the detailed report
                            </span>
                        </div>
                    </div>
                </div>
                // **WHY: Complete analysis display with structured sections**
            )}
        </div>
    )
}

export default ReviewResume