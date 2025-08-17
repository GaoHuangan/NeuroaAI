import React, { useState } from 'react'
import { Image, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

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
    ]

    const [selectedStyle, setSelectedStyle] = useState(imageStyles[0])
    const [input, setInput] = useState('')
    const [publish, setPublish] = useState(false)
    const [loading, setLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState('') 

    const { getToken } = useAuth()

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
            setLoading(true)
            
            const prompt = `Generate an image of ${input} with a style of ${selectedStyle}`
            const requestData = {
                prompt,
                style: selectedStyle,
                publish: publish, 
            };
            
            const token = await getToken();

            const response = await axios.post('/api/ai/generate-image', requestData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                // 处理不同格式的响应数据，提取图片URL
                const responseData = response.data.data;
                
                let generatedImageUrl = '';
                
                if (typeof responseData === 'string') {
                    // 如果直接是字符串（图片URL）
                    generatedImageUrl = responseData;
                } else if (typeof responseData === 'object' && responseData !== null) {
                    // 如果是对象，提取图片URL
                    generatedImageUrl = responseData.imageUrl || 
                                      responseData.url || 
                                      responseData.image ||
                                      responseData.content ||
                                      '';
                }
                
                setImageUrl(generatedImageUrl);
                toast.success('图片生成成功！');
            } else {
                toast.error(response.data.message || '生成图片失败');
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || '发生未知错误';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
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
                    placeholder='Describe what you want to see in the image!' required />
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

                <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#0d9488] to-[#14b8a6] text-white px-4 py-2 mt-6
                    text-sm rounded-lg cursor-pointer hover:from-[#0f766e] hover:to-[#0d9488] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'>
                    {loading ? (
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            <span>Generating...</span>
                        </div>
                    ) : (
                        <Image className='w-5' />
                    )}
                    Generate Image
                </button>
            </form>

            {/* right col */}
            {!imageUrl ? (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center gap-3'>
                        <Image className='w-5 h-5 text-[#0d9488]' />
                        <h1 className='text-xl font-semibold'>Generated Image</h1>
                    </div>
                    <div className='flex-1 flex justify-center items-center'>
                        <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                            <Image className='w-9 h-9' />
                            <p>Describe your image and click "Generate Image" to get started</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center gap-3 mb-4'>
                        <Image className='w-5 h-5 text-[#0d9488]' />
                        <h1 className='text-xl font-semibold'>Generated Image</h1>
                    </div>
                    <div className='flex-1 overflow-hidden rounded-lg'>
                        <img 
                            src={imageUrl} 
                            alt="Generated image" 
                            className='w-full h-full object-cover rounded-lg shadow-lg'
                            onError={(e) => {
                                e.target.src = '/placeholder-image.png'; 
                                toast.error('图片加载失败');
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default GenerateImages