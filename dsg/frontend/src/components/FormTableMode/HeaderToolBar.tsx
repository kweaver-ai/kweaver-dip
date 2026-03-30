import * as React from 'react'
import { useState, useEffect, FC } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Layout, Row, Col, Button, Tooltip } from 'antd'
import { LeftOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import { getActualUrl, useQuery } from '@/utils'
import __ from './locale'

import FlowchartIconOutlined from '@/icons/FlowchartOutlined'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import GlobalMenu from '../GlobalMenu'
import styles from './styles.module.less'
import { ViewModel } from './const'
import { combUrl } from '../FormGraph/helper'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    model: ViewModel
    // 地址栏对象
    queryData: any

    // 切换预览模式
    onSwitchModel: () => void

    // 保存
    onSave: () => void

    saveDisabled?: boolean

    formInfo: any
    isShowEdit?: boolean
}

const HeaderToolBar: FC<GraphToolBarType> = ({
    model,
    queryData,
    onSwitchModel,
    onSave,
    saveDisabled = false,
    formInfo,
    isShowEdit = true,
}) => {
    const navigator = useNavigate()
    // 地址栏参数
    const query = useQuery()

    const [loadingSave, setLoadingSave] = useState(false)
    const { isButtonDisabled } = useBusinessModelContext()

    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        if (query.get('jumpMode') === 'win') {
            window.open(getActualUrl(combUrl(queryData)), '_self')
        } else {
            navigator(combUrl(queryData))
        }
    }
    return (
        <div className={styles.headerWrapper}>
            <AntdHeader className={styles.header}>
                <Row
                    style={{
                        width: '100%',
                    }}
                >
                    <Col span={6}>
                        <div className={styles.returnBox}>
                            <GlobalMenu />
                            <div
                                aria-hidden
                                className={styles.returnWrapper}
                                onClick={() => {
                                    if (model === 'view') {
                                        handleReturnBack()
                                    } else {
                                        ReturnConfirmModal({
                                            onCancel: handleReturnBack,
                                        })
                                    }
                                }}
                            >
                                <LeftOutlined className={styles.returnIcon} />
                                <div className={styles.return}>
                                    {__('返回')}
                                </div>
                                <div>
                                    {queryData.flowchart_id && (
                                        <FlowchartIconOutlined
                                            className={styles.pi_icon}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className={styles.nameWrapper}>
                                <div
                                    className={styles.domainName}
                                    title={formInfo?.name}
                                >
                                    {formInfo?.name}
                                </div>
                            </div>
                        </div>
                    </Col>
                    {/**
                     * 预留中间位置
                     */}
                    <Col span={12} />
                    {model === 'view' ? (
                        <Col span={6}>
                            {isShowEdit && (
                                <div className={styles.toolSaveWrapper}>
                                    <Button
                                        type="primary"
                                        className={styles.toolSaveButton}
                                        onClick={() => onSwitchModel()}
                                        disabled={isButtonDisabled}
                                        title={
                                            isButtonDisabled
                                                ? __('审核中，无法操作')
                                                : ''
                                        }
                                    >
                                        {__('编辑')}
                                    </Button>
                                </div>
                            )}
                        </Col>
                    ) : (
                        <Col span={6}>
                            <div className={styles.toolSaveWrapper}>
                                <Tooltip
                                    title={
                                        saveDisabled
                                            ? __('请先完成或取消批量配置属性')
                                            : ''
                                    }
                                >
                                    <Button
                                        className={styles.toolSaveButton}
                                        type="primary"
                                        icon={
                                            loadingSave ? (
                                                <LoadingOutlined
                                                    style={{
                                                        marginRight: '5px',
                                                    }}
                                                />
                                            ) : null
                                        }
                                        style={
                                            loadingSave
                                                ? {
                                                      backgroundColor:
                                                          'rab(127.182.246)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                        onClick={async (e) => {
                                            if (loadingSave) {
                                                e.preventDefault()
                                            }
                                            await setLoadingSave(true)
                                            await onSave()
                                            await setLoadingSave(false)
                                        }}
                                        title={
                                            isButtonDisabled
                                                ? __('审核中，无法操作')
                                                : ''
                                        }
                                        disabled={
                                            saveDisabled || isButtonDisabled
                                        }
                                    >
                                        {__('保存')}
                                    </Button>
                                </Tooltip>
                            </div>
                        </Col>
                    )}
                </Row>
            </AntdHeader>
        </div>
    )
}

export default HeaderToolBar
