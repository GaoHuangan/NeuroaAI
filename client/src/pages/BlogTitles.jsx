import React, { useState } from 'react'
import { Hash, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

function BlogTitles() {

    const blogCategories = [
        'Business',
        'Entertainment',
        'Health',
        'Lifestyle',
        'Politics',
        'Sports',
        'Technology',
        'Travel',
        'World',
    ]

    const [selectedCategory, setSelectedCategory] = useState(blogCategories[0])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState('')

    const { getToken } = useAuth()

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault()
            setLoading(true)
            
            const prompt = `Generate a title for ${input} with a category of ${selectedCategory}`
            const requestData = {
                prompt,
                category: selectedCategory,
            };

            const token = await getToken();

            const response = await axios.post('/api/ai/generate-blog-titles', requestData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                // 处理不同格式的响应数据，只提取纯标题内容
                const responseData = response.data.data;
                
                let titleContent = '';
                
                if (typeof responseData === 'string') {
                    // 如果直接是字符串
                    titleContent = responseData;
                } else if (typeof responseData === 'object' && responseData !== null) {
                    // 如果是对象，提取标题内容
                    titleContent = responseData.content || 
                                 responseData.title || 
                                 responseData.titles ||
                                 responseData.text ||
                                 '无法提取标题内容';
                } else {
                    titleContent = '生成的内容格式异常';
                }
                
                setContent(titleContent);
                toast.success('标题生成成功！');
            } else {
                toast.error(response.data.message || '生成标题失败');
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
                    <Sparkles className='w-6 text-[#8E37EB]' />
                    <h1 className='text-xl font-semibold'>AI Title Generator</h1>
                </div>
                <p className='mt-6 text-sm font-medium'>
                    Keyword
                </p>
                <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300'
                    placeholder='AI and machine learning trends...' required />
                <p className='mt-4 text-sm font-medium'>Category</p>

                <div className='flex flex-wrap sm:max-w-9/11 gap-3 mt-3'>
                    {blogCategories.map((item) => (
                        <span onClick={() => setSelectedCategory(item)} key={item}
                            className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ?
                                'bg-purple-50 text-purple-700'
                                :
                                'border-gray-300 text-gray-500'}`}>
                            {item}
                        </span>
                    ))}
                </div>
                <br />
                <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6
                    text-sm rounded-lg cursor-pointer'>
                    {loading ? (
                        <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            <span>Generating...</span>
                        </div>
                    ) : (
                        <Hash className='w-5' />
                    )}
                    Generate Title
                </button>
            </form>
            
            {/* right col */}
            {!content ? (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center gap-3'>
                        <Hash className='w-5 h-5 text-[#8E37EB]' />
                        <h1 className='text-xl font-semibold'>Generated Title</h1>
                    </div>
                    <div className='flex-1 flex justify-center items-center'>
                        <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                            <Hash className='w-9 h-9' />
                            <p>Enter a keyword and click "Generate Title" to get started</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96 max-h-[600px]'>
                    <div className='flex items-center gap-3 mb-4'>
                        <Hash className='w-5 h-5 text-[#8E37EB]' />
                        <h1 className='text-xl font-semibold'>Generated Title</h1>
                    </div>
                    <div className='flex-1 overflow-y-auto'>
                        <div className='whitespace-pre-wrap text-sm leading-relaxed reset-tw'>
                            <Markdown>{content}</Markdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BlogTitles