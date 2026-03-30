/* eslint-disable no-underscore-dangle */
import { ConfigProvider, message } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import 'moment/locale/zh-cn'
import 'normalize.css'
import 'antd/dist/antd.less'
import '../../common.less'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import React, { Suspense, useEffect, useMemo, lazy } from 'react'
import { Provider } from 'react-redux'
import { i18n } from '@/utils'
import { MicroWidgetPropsProvider } from '@/context'
import { MicroWidgetPlatformsType } from '@/core'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import store from '../../redux/store'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

const lazyLoad = (moduleName) => {
    const Module = lazy(() => import(`../../components/ASFrame/${moduleName}`))
    return <Module />
}

function App(props: any) {
    const {
        props: { microWidgetProps },
    } = props
    // const language: string =
    //     props?.props?.microWidgetProps?.language?.getLanguage || 'zh-cn'
    const language: string = 'zh-cn'

    const getAntdLocal = (lang: string) => {
        switch (lang) {
            case 'zh-cn':
                return zhCN

            case 'zh-tw':
                return zhTW

            default:
                return enUS
        }
    }

    useEffect(() => {
        i18n.setup({
            locale: language,
        })
    }, [language])

    const [Router, basename] = useMemo(() => {
        const basePath =
            (microWidgetProps?.history?.getBasePath as string) ||
            'afPluginFrameworkForAs.html'

        if (
            microWidgetProps?.config?.systemInfo?.platform ===
            MicroWidgetPlatformsType.Electron
        ) {
            return [HashRouter, basePath.split('#')[1]] as const
        }
        return [BrowserRouter, basePath] as const
    }, [microWidgetProps?.config?.systemInfo?.platform])

    return (
        <Suspense fallback={<Loader />}>
            <Router basename={basename}>
                <Provider store={store}>
                    <ConfigProvider
                        locale={getAntdLocal(language)}
                        prefixCls="any-fabric-ant"
                        iconPrefixCls="any-fabric-anticon"
                        autoInsertSpaceInButton={false}
                        getPopupContainer={() =>
                            document.getElementById(
                                'af-plugin-framework-for-as',
                            ) || document.body
                        }
                    >
                        <MicroWidgetPropsProvider
                            initMicroWidgetProps={microWidgetProps}
                        >
                            <div className={styles.afWrapper}>
                                {lazyLoad('ASRoutes')}
                            </div>
                        </MicroWidgetPropsProvider>
                    </ConfigProvider>
                </Provider>
            </Router>
        </Suspense>
    )
}

export default App
