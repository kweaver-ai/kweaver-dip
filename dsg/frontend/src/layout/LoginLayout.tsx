import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Loader } from '@/ui'

const LoginLayout: React.FC = () => {
    return (
        <Suspense fallback={<Loader />}>
            <Outlet />
        </Suspense>
    )
}

export default LoginLayout
