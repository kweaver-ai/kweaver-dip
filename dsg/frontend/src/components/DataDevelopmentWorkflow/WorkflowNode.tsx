import React, { useState, useEffect, useMemo } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Dropdown, MenuProps, Popover } from 'antd'
import classnames from 'classnames'
import { EllipsisOutlined, InfotipOutlined } from '@/icons'
import styles from './styles.module.less'
import { OperateType, deafultPorts, modelTypeInfo } from './const'
import { PopContent, modelTypeIcon } from './helper'
import __ from './locale'
import { hex2rgba } from '@/utils'

let callbackColl: any = []

const WorkflowNodeComponent = (props: any) => {
    const { node, graph } = props
    const { data } = node
    const { name, model_type, selected } = data

    const callback = (index: number): any => {
        if (callbackColl.length > index) {
            return callbackColl[index]()
        }
        return null
    }

    // 更多的显示/隐藏
    const [hidden, setHidden] = useState(true)
    // 更多的背景色
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')
    // 菜单项显示/隐藏
    const [open, setOpen] = useState(false)
    // 菜单项
    const items: MenuProps['items'] = [
        {
            key: OperateType.EXECUTE,
            label: (
                <div style={{ color: 'rgba(0,0,0,0.85)' }}>
                    {__('立即执行')}
                </div>
            ),
        },
        {
            key: OperateType.LOGS,
            label: (
                <div style={{ color: 'rgba(0,0,0,0.85)' }}>
                    {__('查看日志')}
                </div>
            ),
        },
    ]

    // 菜单项选中
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        setOpen(false)
        const optionNode = callback(1)
        optionNode(node, e.key)
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classnames(styles.wfNodeWrap, 'seletdNode')}
                style={{
                    borderLeftColor: selected
                        ? 'rgb(18 110 227 / 86%)'
                        : modelTypeInfo[model_type].color,
                }}
                onFocus={() => {}}
                onMouseOver={() => {
                    setHidden(false)
                }}
                onMouseLeave={() => {
                    setHidden(open !== true)
                }}
            >
                <div
                    className={styles.wfn_leftLine}
                    style={{
                        background: modelTypeInfo[model_type].color,
                    }}
                />
                <div
                    className={styles.wfn_icon}
                    style={{
                        backgroundColor: hex2rgba(
                            modelTypeInfo[model_type].color.substring(1),
                            0.1,
                        ),
                    }}
                >
                    {modelTypeIcon(model_type, 20)}
                </div>
                <div className={styles.wfn_rightWrap}>
                    <div className={styles.wfn_nameWrap}>
                        <div className={styles.wfn_name} title={name}>
                            {name}
                        </div>
                        <Popover
                            placement="bottom"
                            content={
                                <PopContent data={data} type={model_type} />
                            }
                            getPopupContainer={(n) => graph.container}
                        >
                            <InfotipOutlined className={styles.wfn_infoIcon} />
                        </Popover>
                    </div>
                    <span
                        className={styles.wfn_more}
                        style={{ backgroundColor: bg }}
                        hidden={callback(0) !== OperateType.PREVIEW || hidden}
                        onFocus={() => {}}
                        onMouseOver={() => {
                            setBg('rgba(0, 0, 0, 0.04)')
                        }}
                        onMouseLeave={() => {
                            setHidden(true)
                            setBg('rgba(0, 0, 0, 0)')
                        }}
                    >
                        <Dropdown
                            menu={{
                                items,
                                onClick: handleMenuClick,
                                onFocus: () => setBg('rgba(0, 0, 0, 0.04)'),
                                onMouseOver: () => setBg('rgba(0, 0, 0, 0.04)'),
                            }}
                            placement="bottomLeft"
                            trigger={['click']}
                            getPopupContainer={(n) => graph.container}
                            overlayStyle={{ minWidth: 90 }}
                            onOpenChange={setOpen}
                            open={open}
                        >
                            <EllipsisOutlined
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 20,
                                    height: 20,
                                }}
                            />
                        </Dropdown>
                    </span>
                </div>
            </div>
        </ConfigProvider>
    )
}

const WorkflowNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'workflow_node',
        effect: ['data'],
        component: WorkflowNodeComponent,
        ports: { ...deafultPorts },
    })
    return 'workflow_node'
}

export default WorkflowNode
