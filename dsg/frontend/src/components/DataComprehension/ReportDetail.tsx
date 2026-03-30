import { LeftOutlined } from '@ant-design/icons'
import { BackTop, Col, Divider, Drawer, Row, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import {
    formatError,
    formsEnumConfig,
    getDataComprehensionDetails,
    IdimensionModel,
    IFormEnumConfigModel,
} from '@/core'
import { ReturnTopOutlined } from '@/icons'
import { Empty, Loader } from '@/ui'
import dataEmpty from '../../assets/dataEmpty.svg'
import GlobalMenu from '../GlobalMenu'
import __ from './locale'
import Report from './Report'
import ReportAnchor from './ReportAnchor'
import styles from './styles.module.less'

function ReportDetail({ id, visible, isAudit, onClose }: any) {
    const [loading, setLoading] = useState(false)
    // 详情信息
    const [details, setDetails] = useState<IdimensionModel>()
    // 配置信息枚举
    const [enumConfigs, setEnumConfigs] = useState<IFormEnumConfigModel>()

    useEffect(() => {
        getEnumConfig()
        getDetails()
    }, [])
    // 获取枚举值
    const getEnumConfig = async () => {
        const res = await formsEnumConfig()
        setEnumConfigs(res)
    }

    // 理解详情
    const getDetails = async () => {
        if (!id) return
        try {
            setLoading(true)
            const res = await getDataComprehensionDetails(id)
            setDetails(res)
        } catch (err) {
            formatError(err)
            setDetails(undefined)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer
            open={visible}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles.dataUndsContentWrap}>
                <Row className={styles.duc_top}>
                    <Col className={styles.topLeft} span={8}>
                        <GlobalMenu />
                        <div
                            onClick={() => onClose?.()}
                            className={styles.returnInfo}
                            style={{
                                color: 'rgb(0 0 0 / 85%)',
                                cursor: 'pointer',
                            }}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                        <Divider className={styles.divider} type="vertical" />
                        <div
                            className={styles.nameWrap}
                            title={details?.catalog_info.name}
                        >
                            {details?.catalog_info.name}
                        </div>
                    </Col>
                </Row>
                <div className={styles.duc_bottom}>
                    {loading ? (
                        <Loader />
                    ) : details ? (
                        <>
                            <Report
                                details={details}
                                enumConfigs={enumConfigs}
                                isAudit={isAudit}
                            />
                            <ReportAnchor
                                details={details as any}
                                targetOffset={24}
                                style={{
                                    position: 'absolute',
                                    top: 76,
                                    right: 24,
                                    zIndex: 1000,
                                }}
                            />
                            <Tooltip title={__('回到顶部')}>
                                <BackTop
                                    visibilityHeight={100}
                                    className={styles.backTop}
                                    target={() =>
                                        document.getElementById('reportWrap')!
                                    }
                                >
                                    <ReturnTopOutlined
                                        style={{ fontSize: 40 }}
                                    />
                                </BackTop>
                            </Tooltip>
                        </>
                    ) : (
                        <div className={styles.empty}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    )
}

export default ReportDetail
