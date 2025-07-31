import { assets, dummyTestimonialData } from "../assets/assets";

export default function Testimonial() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-6 pt-14">
            {/* 第一个卡片 - John Doe */}
            <div className="text-sm w-80 border border-gray-200 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5">
                <div className="flex flex-col items-center px-5 py-4 relative">
                    <img className="h-24 w-24 absolute -top-14 rounded-full" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" alt="userImage1" />
                    <div className="pt-8 text-center">
                        <h1 className="text-lg font-medium text-gray-800">{dummyTestimonialData[0].name}</h1>
                        <p className="text-gray-800/80">{dummyTestimonialData[0].title}</p>
                    </div>
                </div>
                <p className="text-gray-500 px-6 text-center">{dummyTestimonialData[0].content}</p>
                <div className="flex justify-center pt-4">
                    <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, index) => (
                            <img key={index} src={index < dummyTestimonialData[0].rating ? assets.star_icon : assets.star_dull_icon} className='w-4 h-4' alt="star" />
                        ))}
                    </div>
                </div>
            </div>
        
            {/* 第二个卡片 - Jane Smith */}
            <div className="text-sm w-80 border border-gray-200 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5">
                <div className="flex flex-col items-center px-5 py-4 relative">
                    <img className="h-24 w-24 absolute -top-14 rounded-full" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200" alt="userImage2" />
                    <div className="pt-8 text-center">
                        <h1 className="text-lg font-medium text-gray-800">{dummyTestimonialData[1].name}</h1>
                        <p className="text-gray-800/80">{dummyTestimonialData[1].title}</p>
                    </div>
                </div>
                <p className="text-gray-500 px-6 text-center">{dummyTestimonialData[1].content}</p>
                <div className="flex justify-center pt-4">
                    <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, index) => (
                            <img key={index} src={index < dummyTestimonialData[1].rating ? assets.star_icon : assets.star_dull_icon} className='w-4 h-4' alt="star" />
                        ))}
                    </div>
                </div>
            </div>
        
            {/* 第三个卡片 - David Lee */}
            <div className="text-sm w-80 border border-gray-200 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5">
                <div className="flex flex-col items-center px-5 py-4 relative">
                    <img className="h-24 w-24 absolute -top-14 rounded-full" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop" alt="userImage3" />
                    <div className="pt-8 text-center">
                        <h1 className="text-lg font-medium text-gray-800">{dummyTestimonialData[2].name}</h1>
                        <p className="text-gray-800/80">{dummyTestimonialData[2].title}</p>
                    </div>
                </div>
                <p className="text-gray-500 px-6 text-center">{dummyTestimonialData[2].content}</p>
                <div className="flex justify-center pt-4">
                    <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, index) => (
                            <img key={index} src={index < dummyTestimonialData[2].rating ? assets.star_icon : assets.star_dull_icon} className='w-4 h-4' alt="star" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};