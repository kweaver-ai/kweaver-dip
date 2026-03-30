import Icon, { RightOutlined } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import { Drawer, Space, Table, message } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { reqSubGraph } from '@/core'
import {
    AppApiColored,
    AppDataContentColored,
    DatasheetViewColored,
} from '@/icons'
import { AssetType } from '../const'
import __ from '../locale'
import DerivationGraph from './DerivationGraph'
import styles from './styles.module.less'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import { transformExpand } from '../helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'

const layout = {
    height: 60,
    width: 210,
}

interface TitleBarType {
    title: string
}
const TitleBar = ({ title }: TitleBarType) => {
    return (
        <div className={styles['title-bar']}>
            <Icon component={icon1} className={styles['title-bar-icon']} />
            <div className={styles['title-bar-label']}>{title}</div>
        </div>
    )
}

const transform = (item, parentId) => {
    const result = {
        ...item,
        ...layout,
    }

    if (parentId) {
        result.parentId = parentId
    }

    result.children = (item?.children || [])?.map((o) =>
        transform(o, item?.vid),
    )

    return result
}

function DerivationModel({ open, item, handleClose, type, handleDetail }: any) {
    const { raw_title: title, recommend_detail: params } = item ?? {}
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<any>()
    const [visible, setVisible] = useState<boolean>(false)
    const [{ using }, updateUsing] = useGeneralConfig()
    // useCogAsstContext 已移除，相关功能已下线

    const extra = useMemo(() => {
        if (item?.table_name || item?.description) {
            return {
                table_name: item?.table_name,
                raw_table_name: item?.raw_table_name,
                description: item?.description,
                raw_description: item?.raw_description,
            }
        }
        return undefined
    }, [item])

    const getData = async (param) => {
        setLoading(true)
        const reqParams = {
            end: param?.end,
            start: param?.starts,
            'data-version': using === 1 ? 'data-catalog' : 'data-resource',
        }
        const res = await reqSubGraph(reqParams)
        if (res?.graph) {
            const ret = transform(res.graph, 'root')
            // 处理折叠
            setData(ret ? transformExpand({ ...ret, extra }) : ret)
        } else {
            setData(undefined)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (open && params) {
            getData(params)
        }
    }, [params, open])

    // const serviceCode = useMemo(() => {
    //     if (item?.type === AssetType.INTERFACESVC) {
    //         return item?.code
    //     }
    //     return item?.id
    // }, [item])

    const getDetailContent = () => {
        if (item?.type === AssetType.DATACATLG) {
            return (
                <DataCatlgContent
                    open={visible}
                    onClose={() => {
                        setVisible(false)
                    }}
                    assetsId={item?.id}
                    customBodyStyle={{ height: '100vh' }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                    }}
                    isIntroduced={false}
                    handleAssetBtnUpdate={() => {}}
                    errorCallback={() => {}}
                />
            )
        }
        if (item?.type === AssetType.INTERFACESVC) {
            return (
                <ApplicationServiceDetail
                    open={visible}
                    onClose={() => {
                        setVisible(false)
                    }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                    }}
                    serviceCode={item.id}
                    isIntroduced={false}
                    showShadow={false}
                />
            )
        }
        if (item?.type === AssetType.LOGICVIEW) {
            return (
                <LogicViewDetail
                    open={visible}
                    onClose={() => {
                        setVisible(false)
                    }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                    }}
                    id={item.id}
                    isIntroduced={false}
                    showShadow={false}
                />
            )
        }

        if (item?.type === AssetType.INDICATOR) {
            return (
                <IndicatorViewDetail
                    open={visible}
                    onClose={() => {
                        setVisible(false)
                    }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                    }}
                    id={item.id}
                    isIntroduced={false}
                    showShadow={false}
                    indicatorType={item?.indicator_type || ''}
                />
            )
        }

        return undefined
    }

    return (
        <Drawer
            width="80%"
            title={__('结果页面')}
            placement="right"
            closable
            onClose={() => {
                handleClose()
            }}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            open={open}
            getContainer={false}
            style={{
                position: 'fixed',
                top: using === 1 ? 52 : 100,
                width: '100%',
            }}
            footer={null}
            destroyOnClose
        >
            <div className={styles['graph-wrapper']}>
                {loading ? (
                    <div style={{ marginTop: '25%' }}>
                        <Loader />
                    </div>
                ) : (
                    <div className={styles['graph-wrapper-content']}>
                        <div
                            className={styles['top-info']}
                            onClick={handleDetail}
                        >
                            <div className={styles['top-info-title']}>
                                {type === AssetType.INTERFACESVC && (
                                    <AppApiColored
                                        style={{ fontSize: '18px' }}
                                    />
                                )}
                                {type === AssetType.LOGICVIEW && (
                                    <DatasheetViewColored
                                        style={{ fontSize: '18px' }}
                                    />
                                )}
                                {type === AssetType.DATACATLG && (
                                    <AppDataContentColored
                                        style={{ fontSize: '18px' }}
                                    />
                                )}
                                {type === AssetType.INDICATOR && (
                                    <div className={styles.iconContainer}>
                                        <IndicatorManagementOutlined
                                            style={{
                                                color: '#fff',
                                                fontSize: 20,
                                            }}
                                        />
                                    </div>
                                )}
                                <span>{title || '详情页'}</span>
                                <RightOutlined style={{ fontSize: '12px' }} />
                            </div>
                            <div>{/* 按钮 */}</div>
                        </div>

                        <div
                            style={{
                                marginTop: '10px',
                                padding: '0 20px',
                            }}
                        >
                            <TitleBar title={__('推荐详情')} />
                        </div>

                        {data ? (
                            <div
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    minHeight: '500px',
                                    marginTop: '4px',
                                }}
                            >
                                <DerivationGraph data={data} />
                            </div>
                        ) : (
                            <div style={{ marginTop: '30px' }}>
                                <Empty iconSrc={dataEmpty} desc="暂无数据" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Drawer>
    )
}

export default memo(DerivationModel)
