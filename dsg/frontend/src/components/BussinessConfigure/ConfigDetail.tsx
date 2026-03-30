import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Drawer, Button, Tooltip } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons'
import { debounce } from 'lodash'
import styles from './styles.module.less'
import Details from './Details'
import { OptionModel } from '../MetricModel/const'
import __ from './locale'
import { ExpandStatus } from '../FormGraph/helper'

interface ConfigDetailType {
    graphData?: any
    mode: OptionModel
    modelId: string
    indicatorId?: string
    ref?: any
    form: any
    dataTypeOptions: any
}
const ConfigDetail: React.FC<ConfigDetailType> = forwardRef(
    (props: any, ref) => {
        const [open, setopen] = useState<boolean>(true)
        const [width, setWidth] = useState<number>(800)
        const drawerRef = useRef<HTMLDivElement>(null)
        const { graphData, mode, modelId, indicatorId, form, dataTypeOptions } =
            props
        const [expandStatus, setExpandStatus] = useState<boolean>(true)
        let startX = 0
        // 处理鼠标按下事件
        const onMouseDown = (e) => {
            startX = e.clientX
            if (drawerRef && drawerRef.current) {
                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
            }
        }
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
        // 处理鼠标移动事件
        // const onMouseMove = debounce((e) => {
        //     let newWidth = window.innerWidth - e.clientX
        //     const maxWidth = window.innerWidth * 0.7
        //     const minWidth = window.innerWidth * 0.4
        //     newWidth = newWidth < minWidth ? minWidth : newWidth
        //     newWidth = newWidth > maxWidth ? maxWidth : newWidth
        //     requestAnimationFrame(() => {
        //         setWidth(newWidth)
        //     })
        // }, 16)
        const onMouseMove = (e) => {
            let newWidth = window.innerWidth - e.clientX
            const maxWidth = window.innerWidth * 0.7
            const minWidth = window.innerWidth * 0.3
            newWidth = newWidth < minWidth ? minWidth : newWidth
            newWidth = newWidth > maxWidth ? maxWidth : newWidth
            requestAnimationFrame(() => {
                setWidth(newWidth)
            })
        }

        // 度量数据
        return (
            <Drawer
                title={
                    expandStatus ? (
                        <div className={styles.drawerTitle}>
                            <div>{__('业务指标配置')}</div>
                            <Tooltip title={__('收起')} placement="bottom">
                                <div
                                    onClick={() => {
                                        setExpandStatus(false)
                                    }}
                                    className={styles.btn}
                                >
                                    <MenuUnfoldOutlined />
                                </div>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className={styles.drawerUnexpandTitle}>
                            <Tooltip title={__('展开')} placement="bottom">
                                <div
                                    onClick={() => {
                                        setExpandStatus(true)
                                    }}
                                    className={styles.btn}
                                >
                                    <MenuFoldOutlined />
                                </div>
                            </Tooltip>
                            <div className={styles.titleText}>
                                {__('业务指标配置')}
                            </div>
                        </div>
                    )
                }
                placement="right"
                closable={false}
                mask={false}
                width={expandStatus ? width : 40}
                onClose={() => {
                    setopen(false)
                }}
                open={open}
                getContainer={false}
                footer={null}
                className={expandStatus ? '' : styles.unexpandDrawer}
                bodyStyle={{ paddingTop: 16 }}
            >
                {expandStatus ? (
                    <>
                        <div
                            ref={drawerRef}
                            onMouseDown={onMouseDown}
                            className={styles.line}
                        >
                            <div className={styles.borders}>|</div>
                            <div className={styles.borders}>|</div>
                        </div>
                        <Details
                            modelId={modelId}
                            indicatorId={indicatorId}
                            mode={mode}
                            graphData={graphData}
                            onClose={() => {}}
                            form={form}
                            dataTypeOptions={dataTypeOptions}
                        />
                    </>
                ) : null}
            </Drawer>
        )
    },
)

export default ConfigDetail
