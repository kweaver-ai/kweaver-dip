import React, { memo, useEffect, useRef, useState } from 'react'
import { loadMicroApp } from 'qiankun'
import { Loader } from '@/ui'
import { DocAuditClientApp, AuditGeneralProps } from '@/registryApp'

let microApp

const workflowPluginInfo = {
    name: `${DocAuditClientApp.name}_widget`,
    entry: DocAuditClientApp.entry,
}

const DocAuditClientPlugin: React.FC<{ basePath: string }> = ({ basePath }) => {
    const container = useRef<any>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        onLoad()
        return () => {
            microApp?.unmount()
            microApp = undefined
        }
    }, [])

    const onLoad = async () => {
        try {
            microApp = await loadMicroApp(
                {
                    ...workflowPluginInfo,
                    container: container.current,
                    props: {
                        ...AuditGeneralProps,
                        microWidgetProps: {
                            ...AuditGeneralProps.microWidgetProps,
                            history: {
                                getBasePath: basePath,
                            },
                        },
                    },
                },
                {
                    sandbox: {
                        strictStyleIsolation: false,
                        experimentalStyleIsolation: true,
                    },
                },
                {
                    afterMount: () => setLoading(false) as any,
                },
            )
        } catch {
            //
        } finally {
            setLoading(false)
        }
    }

    return (
        <div ref={container} style={{ width: '100%', height: '100%' }}>
            <div
                style={{
                    marginTop: '104px',
                }}
            >
                {loading && <Loader />}
            </div>
        </div>
    )
}

export default memo(DocAuditClientPlugin)
