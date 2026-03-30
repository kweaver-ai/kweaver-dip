import React, { useEffect, lazy, useState, useContext } from 'react'
import { useRoutes, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { FrameStatus, getUrlByCommand, sso } from '@/core'
import NoAccess from './NoAccess'
import requests, { axiosInstance } from '@/utils'
import { Loader } from '@/ui'
import { MicroWidgetPropsContext } from '@/context'
import { tokenManager } from '@/utils/tokenManager'

const lazyLoadLayout = (moduleName) => {
    const Module = lazy(() => import(`./layouts/${moduleName}`))
    return <Module />
}

const lazyLoadPage = (moduleName) => {
    const Module = lazy(() => import(`./pages/${moduleName}`))
    return <Module />
}

const routes = [
    {
        path: '/',
        element: <Loader />,
    },
    {
        path: 'data-assets',
        element: lazyLoadLayout('ASLayout'),
        children: [
            {
                index: true,
                element: lazyLoadPage('DataAssetsPage'),
            },
        ],
    },
    {
        path: 'my-assets',
        element: lazyLoadLayout('ASLayout'),
        children: [
            {
                index: true,
                element: lazyLoadPage('MyAssetsPage'),
            },
        ],
    },
    {
        path: 'demand-application',
        element: lazyLoadLayout('ASLayout'),
        children: [
            {
                index: true,
                element: lazyLoadPage('DemandPage'),
            },
        ],
    },
    {
        path: 'demand-mgt',
        element: lazyLoadLayout('ASFullScreenLayout'),
        children: [
            {
                path: 'create',
                element: lazyLoadPage('DemandAddPage'),
            },
            {
                path: 'details',
                element: lazyLoadPage('DemandDetailPage'),
            },
            {
                path: 'analysisConfirm',
                element: lazyLoadPage('DemandConfirmPage'),
            },
            {
                path: 'implementAcceptance',
                element: lazyLoadPage('DemandAccept'),
            },
        ],
    },
    {
        path: '403',
        element: <NoAccess />,
    },
    {
        path: '*',
        element: <Navigate to="/403" />,
    },
]

const ASRoutes: React.FC = () => {
    const element = useRoutes(routes)
    const navigate = useNavigate()
    const location = useLocation()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    // 登录状态
    const [loginStatus, setLoginStatus] = useState(FrameStatus.Loading)
    // 错误信息
    const [errorInfo, setErrorInfo] = useState<any>()

    useEffect(() => {
        tokenManager.initCleanupMechanism()
    }, [])

    async function ASSso(code) {
        try {
            axiosInstance.defaults.baseURL = getUrlByCommand({
                microWidgetProps,
            })

            const { access_token } = await sso({ code })

            axiosInstance.defaults.headers.common.Authorization = `Bearer ${access_token}`

            requests.default.micro = microWidgetProps

            requests.default.accessToken = access_token

            tokenManager.setMicroAppProps(microWidgetProps)

            setLoginStatus(FrameStatus.Normal)
        } catch (error) {
            setLoginStatus(FrameStatus.Error)
            setErrorInfo(error)
        }
    }

    useEffect(() => {
        ASSso(microWidgetProps?.token?.getToken?.access_token)
    }, [microWidgetProps?.token?.getToken])

    useEffect(() => {
        if (loginStatus === FrameStatus.Normal) {
            navigate(
                location?.pathname === '/'
                    ? '/data-assets'
                    : `${location?.pathname}${location?.search}`,
            )
        }
        if (loginStatus === FrameStatus.Error && errorInfo) {
            navigate(`/403?errCode=${errorInfo?.data?.code}`)
        }
    }, [loginStatus, errorInfo])

    return element
}

export default ASRoutes
