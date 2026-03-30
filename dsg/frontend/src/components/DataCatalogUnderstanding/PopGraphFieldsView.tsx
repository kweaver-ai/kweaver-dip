import React, { useEffect, useMemo, useState } from 'react'
import { ColumnsType } from 'antd/es/table'
import { Skeleton, Table } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import RemovableView from '@/ui/RemovableView'
import styles from './styles.module.less'
import { formatError, getDataComprehensionAi, getInfoItems } from '@/core'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import { ViewMode } from './const'
import Loader from '@/ui/Loader'
import { FieldUndsData } from './FieldUndsData'
import { getSource } from '@/utils'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'
import { typeOptoins } from '../ResourcesDir/const'

interface IPopGraphFieldsView {
    visible: boolean
    showHeight: number
    title: string
    catalogId: string
    // viewMode: ViewMode
    fieldsData: FieldUndsData
    onClose: () => void
    onUpdateData: (data) => void
}

/**
 * 弹出属性窗口
 * @param visible 显示/隐藏
 * @param showHeight 显示高度
 * @param catalogId 目录ID
 * @param title 标题
 * @param viewMode 当前显示模式
 * @param fieldsData 存储数据
 * @param onClose
 * @param onUpdateData
 */
const PopGraphFieldsView: React.FC<IPopGraphFieldsView> = ({
    visible,
    showHeight = 480,
    catalogId,
    title,
    // viewMode,
    fieldsData,
    onClose,
    onUpdateData,
}) => {
    const { viewMode } = useUndsGraphContext()
    // 加载
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [first, setFirst] = useState(true)
    // ai结果定时器
    const [timer, setTimer] = useState<any>()
    // 列表数据集
    const [items, setItems] = useState<any[]>([])
    // 列表选中集
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    // 表格选项属性
    const rowSelection = {
        onChange: (val: React.Key[]) => {
            setSelectedRowKeys(val)
            updateFieldDate(val)
        },
        selectedRowKeys,
        getCheckboxProps: (record) => {
            return {
                disabled: !record?.ai_comment,
            }
        },
    }

    // 窗口高度
    const hei = useMemo(() => {
        if (showHeight < 348) {
            return 348
        }
        if (showHeight > 540) {
            return 540
        }
        return showHeight
    }, [showHeight])
    // 是否显示ai数据
    const showAiData = useMemo(() => {
        if (items.filter((info) => info.ai_comment).length > 0) {
            return true
        }
        return false
    }, [items])
    // 是否显示ai按钮
    const showAi = useMemo(
        () => viewMode === ViewMode.EDIT && items.length > 0,
        [items, viewMode],
    )

    useEffect(() => {
        if (visible) {
            setFirst(true)
            setLoading(true)
            setFetching(false)
            setItems([])
            setSelectedRowKeys(fieldsData?.data?.map((info) => info.id) || [])
            getFieldsList()
        }
    }, [visible])

    const updateFieldDate = (val) => {
        onUpdateData(items.filter((info) => val.includes(info.id)))
    }

    // 获取字段列表
    const getFieldsList = async () => {
        try {
            const res = await getInfoItems(catalogId, {
                limit: 0,
            })
            if (res?.columns && res.columns.length > 0) {
                setItems(
                    res.columns.map((info) => {
                        const { id, business_name, technical_name, data_type } =
                            info
                        return {
                            id,
                            column_name: technical_name,
                            name_cn: business_name,
                            data_type,
                            ai_comment: fieldsData.data?.find(
                                (f) => f.id === id,
                            )?.ai_comment,
                            sync: true,
                        }
                    }),
                )
            } else {
                setItems([])
            }
        } catch (error) {
            formatError(error)
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    // 获取ai理解列表
    const getComprehensionList = async () => {
        if (fetching) return
        setFirst(false)
        setFetching(true)
        getDataComprehensionAi(catalogId)
            .then((res) => {
                if (!res || res.length === 0) {
                    setSelectedRowKeys([])
                    updateFieldDate([])
                    setItems(
                        items.map((info) => {
                            return {
                                ...info,
                                ai_comment: '',
                            }
                        }),
                    )
                    setFetching(false)
                    return
                }
                const time = setTimeout(() => {
                    setSelectedRowKeys([])
                    updateFieldDate([])
                    setItems(
                        items.map((info) => {
                            const aiItem = res.find((a) => a.id === info.id)
                            return {
                                ...info,
                                ai_comment: aiItem?.ai_comment,
                            }
                        }),
                    )
                    setFetching(false)
                }, 2000)
                setTimer(time)
            })
            .catch((err) => {
                if (err?.data?.code !== 'ERR_CANCELED') {
                    formatError(err)
                }
                setFetching(false)
            })
    }

    const { run } = useDebounceFn(getComprehensionList, {
        wait: 400,
        leading: true,
        trailing: false,
    })

    // 弹窗关闭
    const handleClose = () => {
        // 清定时器
        if (timer) {
            clearTimeout(timer)
        }
        // 取消请求
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (info.config?.params?.dimension === '字段注释') {
                    info.source.cancel()
                }
            })
        }
        onClose()
    }

    // 表格项
    const columns = (): ColumnsType<any> => {
        let cols: ColumnsType<any> = [
            {
                title: __('字段中文名称'),
                dataIndex: 'name_cn',
                key: 'name_cn',
                ellipsis: true,
                render: (value) => value || '--',
            },
            {
                title: __('数据类型'),
                dataIndex: 'data_type',
                key: 'data_type',
                ellipsis: true,
                render: (value) =>
                    typeOptoins.find((item) => item.value === value)?.label ||
                    '--',
            },
        ]

        // 有ai理解显示
        if (showAiData || fetching) {
            cols = [
                ...cols,
                {
                    title: (
                        <span style={{ color: '#547EE8 ' }}>
                            {__('AI 字段理解')}
                        </span>
                    ),
                    dataIndex: 'ai_comment',
                    key: 'ai_comment',
                    width: 200,
                    ellipsis: true,
                    render: (value) =>
                        fetching ? (
                            <Skeleton.Input
                                active
                                style={{
                                    width: 160,
                                    height: 20,
                                }}
                            />
                        ) : (
                            <div
                                className={
                                    first
                                        ? styles.pfv_aiWrap
                                        : styles.pfv_aiWrapAm
                                }
                            >
                                {value || '--'}
                            </div>
                        ),
                },
            ]
        }
        return cols
    }

    return (
        <RemovableView
            visible={visible}
            modalWid={520}
            modalHgt={hei}
            paddingLeft={50}
            saveArea={[52, 8, 8, 0]}
        >
            <div className={styles.popFieldsViewWrap}>
                <div className={styles.pfv_top}>
                    <span className={styles.pfv_topTitle} title={title}>
                        {title}
                    </span>
                    <div className={styles.pfv_topOperateWrap}>
                        {/* <Tooltip title={__('AI 字段理解')}>
                            <CommonIcon
                                icon={aiUnderstandingOutlined}
                                className={classnames(
                                    styles.pfv_aiIcon,
                                    fetching && styles.pfv_aiIconDisabled,
                                )}
                                hidden={!showAi}
                                onClick={run}
                            />
                        </Tooltip>
                        <div className={styles.pfv_divid} hidden={!showAi} /> */}
                        <CloseOutlined
                            className={styles.pfv_close}
                            onClick={handleClose}
                        />
                    </div>
                </div>
                {loading ? (
                    <Loader />
                ) : items.length > 0 ? (
                    <Table
                        className={styles.pfv_table}
                        columns={columns()}
                        dataSource={items}
                        pagination={false}
                        scroll={{
                            y:
                                viewMode === ViewMode.VIEW
                                    ? hei - 117
                                    : hei - 141,
                        }}
                        rowKey="id"
                        rowSelection={
                            viewMode === ViewMode.EDIT && showAiData
                                ? rowSelection
                                : undefined
                        }
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    if (
                                        viewMode === ViewMode.VIEW ||
                                        !record?.ai_comment
                                    ) {
                                        return
                                    }
                                    // 单行点击处理
                                    const idx = selectedRowKeys.indexOf(
                                        record.id,
                                    )
                                    let val = selectedRowKeys
                                    if (idx === -1) {
                                        val = [...selectedRowKeys, record.id]
                                    } else {
                                        val = [
                                            ...selectedRowKeys.filter(
                                                (k) => k !== record.id,
                                            ),
                                        ]
                                    }
                                    setSelectedRowKeys(val)
                                    updateFieldDate(val)
                                },
                            }
                        }}
                    />
                ) : (
                    <div className={styles.pfv_empty}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                )}
                {/* <div className={styles.pfv_bottom} hidden={!showAi}>
                    <div className={styles.pfv_bottomTitle}>
                        <ExclamationCircleFilled
                            style={{ color: '#126EE3', marginRight: 8 }}
                        />
                        <span>
                            {__(
                                '点击「AI」生成字段理解并勾选，画布发布/更新后可同步至数据服务超市',
                            )}
                        </span>
                    </div>
                </div> */}
            </div>
        </RemovableView>
    )
}

export default PopGraphFieldsView
