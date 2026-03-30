import * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Row, Col, Button, Modal } from 'antd'
import {
    ExclamationCircleFilled,
    LeftOutlined,
    LoadingOutlined,
} from '@ant-design/icons'
import { noop } from 'lodash'

import styles from './styles.module.less'

import { getPlatformPrefix, useQuery } from '@/utils'
import __ from './locale'

import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import GlobalMenu from '../GlobalMenu'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    onSaveGraph: () => void
    loading: boolean
    isUpdate: boolean
}

const GraphToolBar = ({
    onSaveGraph = noop,
    loading,
    isUpdate,
}: GraphToolBarType) => {
    const navigator = useNavigate()
    const query = useQuery()
    const [loadingSave, setLoadingSave] = useState(false)

    const name = query.get('name')

    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        ReturnConfirmModal({
            onCancel: () => {
                const platform = getPlatformPrefix()
                navigator(
                    platform === '/cd'
                        ? '/dataLevelManage/recognitionRules'
                        : '/standards/business-domain',
                )
            },
        })
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
                                onClick={() => handleReturnBack()}
                            >
                                <LeftOutlined className={styles.returnIcon} />
                                <div className={styles.return}>返回</div>
                            </div>
                            <div className={styles.nameWrapper}>
                                <div
                                    className={styles.domainName}
                                    title={name || ''}
                                >
                                    {name}
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col span={12} />
                    <Col span={6}>
                        <div className={styles.toolSaveWrapper}>
                            <Button
                                className={styles.toolSaveButton}
                                icon={
                                    loadingSave ? (
                                        <LoadingOutlined
                                            style={{ marginRight: '5px' }}
                                        />
                                    ) : null
                                }
                                type="primary"
                                style={
                                    loadingSave
                                        ? {
                                              backgroundColor:
                                                  'rab(127.182.246)',
                                              cursor: 'default',
                                          }
                                        : {}
                                }
                                loading={loading}
                                onClick={async (e) => {
                                    if (loadingSave) {
                                        e.preventDefault()
                                    }
                                    // await setLoadingSave(true)
                                    onSaveGraph()
                                    // await setLoadingSave(false)
                                }}
                                // disabled={saveDisabled}
                            >
                                {__('保存')}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </AntdHeader>
        </div>
    )
}

export default GraphToolBar
