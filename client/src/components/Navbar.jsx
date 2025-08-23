import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'

const Navbar = () => {
    const navigate = useNavigate()
    const { user } = useUser()
    const { openSignIn, openSignUp } = useClerk()


    return (
        <nav className='fixed top-0 left-0 right-0 z-[999] w-full backdrop-blur-2xl bg-white/90 flex justify-between items-center py-3 px-4 sm:px-20 xl:px-32 border-b border-gray-100 cursor-pointer'>
            <img
                src={assets.logo}
                alt="logo"
                className='w-14 sm:w-20 cursor-pointer'
                onClick={() => navigate('/')}
            />

            {user ? (
                <UserButton />
            ) : (
                <button
                    className='flex items-center gap-2 px-10 py-2.5 rounded-full text-sm cursor-pointer bg-primary text-white hover:bg-primary/90 transition-colors'
                    onClick={() =>  openSignIn()}
                >
                    Get Started
                    <ArrowRight className='w-4 h-4' />
                </button>
            )}
        </nav>
    )
}

export default Navbar