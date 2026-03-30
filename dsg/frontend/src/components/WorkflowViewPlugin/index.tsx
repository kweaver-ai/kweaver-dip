import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { loadMicroApp } from 'qiankun'

import { getGeneralProps, workflowPluginInfo } from './helper'
import { Loader } from '@/ui'

/**
 * 访问类型
 */
export enum VisitType {
    /**
     * 不展示插件
     */
    None = 'none',

    /**
     * 新建审核流程
     */
    New = 'new',

    /**
     * 更新
     */
    Update = 'update',

    /**
     * 预览已有审核流程
     */
    Preview = 'preview',
}

/**
 * 流程配置参数
 */
export interface IConfigData {
    type: VisitType
    key: string
    flow_xml: string
    name: string
    tenant_id: string
    [key: string]: any
}

/**
 * 审核流程信息
 */
export interface IWorkflowInfo {
    /**
     * 流程id
     */
    process_def_id: string

    /**
     * 流程key
     */
    process_def_key: string

    /**
     * 流程名称
     */
    process_def_name: string

    /**
     * 新建/编辑审核流程参数，当saveFlow为false返回
     */
    process_data?: {
        type: VisitType.Update | VisitType.New
        configData: IConfigData
    }

    /**
     * 返回一个随机key, 如Process_ASDFrweFA
     */
    generateKey?: () => string
}

export interface IWorkflowViewPlugin {
    /**
     * 是否全局定位
     */
    isFixed?: boolean

    /**
     * 流程的信息
     */
    flowProps: {
        /**
         * 审核流程对应的业务类型
         */
        process_type: string
        /**
         * 访问插件类型(新建/编辑)
         */
        visit: VisitType
        /**
         * 编辑时传入的流程key
         */
        process_def_key?: string
        /**
         * 编辑时传入的流程id
         */
        process_def_id?: string
        /**
         * 当为编辑状态且没有传入process_def_id时生效
         */
        configData?: IConfigData
        /**
         * 关闭流程
         */
        onCloseAuditFlow?: () => any
        /**
         * 保存流程
         */
        onSaveAuditFlow?: (data: IWorkflowInfo) => any
        /**
         * 是否直接生成流程，默认为true
         */
        saveFlow?: boolean
        /**
         * 仅保存流程时是否弹出名称输入框，默认为true
         */
        allowEditName?: boolean
        /**
         * 预览画布高度和背景颜色配置，高度单位为px
         */
        previewBox?: {
            height?: number
            background?: string
        }
    }

    /**
     * className
     */
    className?: string
    /**
     * 刷新标识
     */
    refreshKey?: number
}

let microApp

function WorkflowViewPlugin({
    isFixed = true,
    flowProps,
    className,
    refreshKey,
}: IWorkflowViewPlugin) {
    const container = useRef<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const prevFlowPropsRef = useRef<any>(null)
    const prevRefreshKeyRef = useRef<any>(null)
    const microAppRef = useRef<any>(null)

    const hasFlowPropsChanged = useCallback((newProps: any, oldProps: any) => {
        if (!oldProps) return true

        // 关键属性变化检查
        const keyProps = [
            'process_type',
            'visit',
            'process_def_key',
            'process_def_id',
        ]

        return keyProps.some((key) => newProps[key] !== oldProps[key])
    }, [])

    const onLoad = useCallback(async () => {
        try {
            const generalProps = getGeneralProps()
            const newMicroApp = await loadMicroApp(
                {
                    ...workflowPluginInfo,
                    container: container.current,
                    props: {
                        ...generalProps,
                        arbitrailyAudit: flowProps,
                    },
                },
                {},
                {
                    afterMount: () => setLoading(false) as any,
                },
            )

            // 保存引用
            microAppRef.current = newMicroApp
            microApp = newMicroApp
        } catch (error) {
            console.error('Failed to load micro app:', error)
        } finally {
            setLoading(false)
        }
    }, [flowProps])

    const cleanup = useCallback(() => {
        if (microAppRef.current) {
            try {
                microAppRef.current.unmount()
                microAppRef.current = undefined
                microApp = undefined
            } catch (error) {
                console.error('Failed to unmount micro app:', error)
            }
        }
    }, [])

    useEffect(() => {
        const shouldReload =
            hasFlowPropsChanged(flowProps, prevFlowPropsRef.current) ||
            refreshKey !== prevRefreshKeyRef.current
        if (shouldReload) {
            cleanup()
            onLoad()
            prevFlowPropsRef.current = flowProps
            prevRefreshKeyRef.current = refreshKey
        }

        return () => {
            cleanup()
        }
    }, [flowProps, onLoad, cleanup, hasFlowPropsChanged, refreshKey])

    useEffect(() => {
        return () => {
            cleanup()
        }
    }, [cleanup])

    return (
        <div ref={container} className={className}>
            <div
                style={{
                    position: isFixed ? 'fixed' : 'relative',
                    height: '100%',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: '#fff',
                    zIndex: 200,
                }}
            >
                {loading && <Loader />}
            </div>
        </div>
    )
}

export default memo(WorkflowViewPlugin, (prevProps, nextProps) => {
    // 自定义比较函数，避免不必要的重新渲染
    if (prevProps.isFixed !== nextProps.isFixed) return false
    if (prevProps.className !== nextProps.className) return false
    if (prevProps.refreshKey !== nextProps.refreshKey) return false

    const prevFlowProps = prevProps.flowProps
    const nextFlowProps = nextProps.flowProps

    if (!prevFlowProps && !nextFlowProps) return true
    if (!prevFlowProps || !nextFlowProps) return false

    // 关键属性比较
    const keyProps = [
        'process_type',
        'visit',
        'process_def_key',
        'process_def_id',
    ]
    return keyProps.every((key) => prevFlowProps[key] === nextFlowProps[key])
})

/**
 * 通过key生成流程xml
 */
export const changeFlowXmlByKey = (flowXml: string, key: string) => {
    const decodeXml = atob(flowXml)
    const xml = decodeURIComponent(decodeXml)
    const newXml = xml.replace(/Process_*.{8}/, key)
    const encodeXml = encodeURIComponent(newXml)
    return btoa(encodeXml)
}

/**
 * 格式化流程配置数据
 */
export const formateConfigDataByKey = (
    generateKey: () => string,
    configData: IConfigData,
): IConfigData => {
    const key = generateKey()
    const xml = changeFlowXmlByKey(configData.flow_xml, key)
    return {
        ...configData,
        key,
        flow_xml: xml,
    }
}
