import React, { memo, useEffect, useState } from 'react'
import classnames from 'classnames'
import ScrollTable from './ScrollTable'
import ToolSideBar from './ToolSideBar'
import styles from './styles.module.less'
import __ from './locale'
import { useDataViewContext } from '../../DataViewProvider'
import {
    formatError,
    getDataPreviewConfig,
    saveDataPreviewConfig,
} from '@/core'
/**
 * 滚动筛选
 * @returns
 */
function ScrollFilter(props: any) {
    const { id, isDownloadPage, onConfigChange, fields, showButton } = props
    const [isToolOpen, setIsToolOpen] = useState<boolean>(true)
    const [previewConfig, setPreviewConfig] = useState<any>()
    const { isValueEvaluation } = useDataViewContext()

    useEffect(() => {
        onConfigChange?.(previewConfig)
    }, [previewConfig])

    const getConfig = async () => {
        try {
            const res = await getDataPreviewConfig(id)
            const conf = JSON.parse(res?.config || '{}')
            setPreviewConfig(conf)
        } catch (error) {
            formatError(error)
        }
    }

    const saveConfig = async (conf) => {
        try {
            await saveDataPreviewConfig({
                form_view_id: id,
                config: JSON.stringify(conf || {}),
            })
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        // 非下载页加载配置
        if (!isDownloadPage && id) {
            getConfig()
        }
    }, [id, isDownloadPage])

    const handleConfigChange = (conf: any) => {
        // const { filters, fields, direction, sort_field_id } = conf
        const curConf = {
            ...previewConfig,
            ...(conf || {}),
        }
        setPreviewConfig(curConf)
        if (!isDownloadPage) {
            saveConfig(curConf)
        }
    }

    return (
        <div
            className={classnames(
                styles['scroll-filter'],
                showButton && styles['scroll-filter-height'],
            )}
        >
            <div
                className={styles['scroll-filter-table']}
                style={{
                    width:
                        !fields.length || isValueEvaluation
                            ? '100%'
                            : `calc(100% - ${isToolOpen ? 300 : 40}px)`,
                }}
            >
                <ScrollTable
                    {...props}
                    fields={fields}
                    scrollY={
                        showButton
                            ? 'calc(100vh - 460px)'
                            : 'calc(100vh - 400px)'
                    }
                    config={previewConfig}
                    onConfigChange={handleConfigChange}
                    hasDownloadPermission={isDownloadPage}
                />
            </div>
            <div
                className={styles['scroll-filter-tool']}
                hidden={!fields?.length || isValueEvaluation}
            >
                <ToolSideBar
                    fields={fields}
                    tableId={id}
                    config={previewConfig}
                    onConfigChange={handleConfigChange}
                    onExpandChange={(isOpen) => setIsToolOpen(isOpen)}
                />
            </div>
        </div>
    )
}
export default memo(ScrollFilter)
