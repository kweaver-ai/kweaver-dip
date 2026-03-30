import React, { lazy } from 'react'
import { useRoutes, Navigate } from 'react-router-dom'

const SmartDataQuery = lazy(() => import('../../components/SmartDataQuery'))
const Assistant = lazy(() => import('../../components/Assistant'))
const ChatKit = lazy(() => import('../../components/Chatkit'))

const routes = [
    {
        path: '/',
        element: <SmartDataQuery />,
    },
    {
        path: '/Assistant',
        element: <Assistant />,
    },
    {
        path: '/chatkit/:agentKey',
        element: <ChatKit />,
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]

const Routes: React.FC = () => {
    const element = useRoutes(routes)
    return element
}

export default Routes
