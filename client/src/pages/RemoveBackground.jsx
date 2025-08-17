import React, { useState } from 'react'
import { Eraser, Sparkles, Download } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

function RemoveBackground() {

    const [input, setInput] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [processedImageUrl, setProcessedImageUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const { getToken } = useAuth()

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        setInput(file)
        
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            // 清除之前的处理结果
            setProcessedImageUrl('')
        }
    }

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
            
            if (!input) {
                toast.error('请先选择一张图片')
                return
            }

            setLoading(true)
            
            // 创建 FormData 对象用于文件上传
            const formData = new FormData()
            formData.append('image', input)
            
            const token = await getToken()

            const response = await axios.post('/api/ai/remove-background', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (response.data.success) {
                // 处理不同格式的响应数据，提取处理后的图片URL
                const responseData = response.data.data
                
                let imageUrl = ''
                
                if (typeof responseData === 'string') {
                    // 如果直接是字符串（图片URL）
                    imageUrl = responseData
                } else if (typeof responseData === 'object' && responseData !== null) {
                    // 如果是对象，提取图片URL
                    imageUrl = responseData.imageUrl || 
                              responseData.url || 
                              responseData.processedImage ||
                              responseData.result ||
                              ''
                }
                
                setProcessedImageUrl(imageUrl)
                toast.success('背景移除成功！')
            } else {
                toast.error(response.data.message || '背景移除失败')
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || '发生未知错误'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const downloadImage = async () => {
        if (!processedImageUrl) return
        
        try {
            const response = await fetch(processedImageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `removed-background-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('图片下载成功！')
        } catch (error) {
            toast.error('下载失败，请稍后再试')
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
                    <p className='text-xs text-gray-500 mt-2'>Supports: .jpg, .jpeg, .png, .webp (Max: 10MB)</p>
                </div>

                {previewUrl && (
                    <div className='mt-4 p-3 border border-gray-200 rounded-md bg-gray-50'>
                        <p className='text-xs text-gray-600 mb-2'>Preview:</p>
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className='w-full h-40 object-contain rounded bg-white'
                        />
                    </div>
                )}

                <button 
                    disabled={loading || !input}
                    className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#ea580c] to-[#fb923c] 
                    text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer hover:from-[#c2410c] hover:to-[#ea580c] 
                    transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'>
                    {loading ? (
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            <span>Processing...</span>
                        </div>
                    ) : (
                        <Eraser className='w-5' />
                    )}
                    Remove Background
                </button>
            </form>
            
            {/* right col */}
            {!processedImageUrl ? (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center gap-3'>
                        <Eraser className='w-5 h-5 text-[#ea580c]' />
                        <h1 className='text-xl font-semibold'>Processed Image</h1>
                    </div>
                    <div className='flex-1 flex justify-center items-center'>
                        <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                            <Eraser className='w-9 h-9' />
                            <p className='text-center'>Upload an image and click "Remove Background" to get started</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                            <Eraser className='w-5 h-5 text-[#ea580c]' />
                            <h1 className='text-xl font-semibold'>Processed Image</h1>
                        </div>
                        <button
                            onClick={downloadImage}
                            className='flex items-center gap-2 px-3 py-1 bg-[#ea580c] text-white text-sm rounded-md 
                            hover:bg-[#c2410c] transition-all duration-200'
                        >
                            <Download className='w-4 h-4' />
                            Download
                        </button>
                    </div>
                    <div className='flex-1 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center'>
                        <img 
                            src={processedImageUrl} 
                            alt="Processed image with background removed" 
                            className='max-w-full max-h-full object-contain rounded-lg shadow-lg'
                            style={{
                                // 添加棋盘背景来显示透明度
                                backgroundImage: `
                                    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                                `,
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                            onError={(e) => {
                                toast.error('图片加载失败')
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default RemoveBackground