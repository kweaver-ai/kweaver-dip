import { useEffect, useState, useMemo } from 'react'
import { useAntdTable } from 'ahooks'
import { Table, Tooltip } from 'antd'
import classnames from 'classnames'
import { noop } from 'lodash'
import { ExplorOutlined } from '@/icons'
import {
    formatError,
    getVirtualEngineExample,
    getDatasheetViewDetails,
    IVirtualEngineExample,
} from '@/core'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import empty from '@/assets/dataEmpty.svg'
import __ from './locale'
import FieldsToolTips from './DataQuality/FieldsToolTips'
import { getFieldTypeEelment } from './helper'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Watermark } from '@/ui'
import { VIEWERRORCODElIST } from './const'

interface FormViewExampleDataType {
    id: string
    formViewStatus?: string
    // 样例数据是否需要权限控制，为true则传userid，否则不传
    isNeedPermisControl?: boolean
    // 是否数据服务超市
    isMarket?: boolean
    // 数据获取是否正常
    getDataNormal?: (value: boolean) => void
    scrollY?: any
}
const FormViewExampleData = ({
    id,
    formViewStatus,
    isNeedPermisControl = true,
    isMarket = false,
    getDataNormal = noop,
    scrollY,
}: FormViewExampleDataType) => {
    const [columns, setColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [isAI, setIsAI] = useState<boolean>(true)
    const [isErr, setIsErr] = useState<boolean>(false)
    const [userInfo] = useCurrentUser()
    const noData = ['delete']

    useEffect(() => {
        if (!noData.includes(formViewStatus || '') && userInfo?.Account) {
            run({ ...pagination, current: 1 })
        }
    }, [id, formViewStatus, userInfo])

    const initTableData = async () => {
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(id)
            const [catalog, schema] = res.view_source_catalog_name.split('.')
            // const data = await getDataCatalogSamples(id, { type: 1 })
            const sampleParams: IVirtualEngineExample = {
                catalog,
                schema,
                table: res.technical_name,
                user: userInfo?.Account || '',
                limit: 10,
                user_id: isNeedPermisControl ? userInfo?.ID || '' : '',
            }
            const data = await getVirtualEngineExample(sampleParams)
            getDataNormal(true)
            const list: any[] = []
            const resColumns =
                data?.columns?.map((item) => {
                    return {
                        ...item,
                        technical_name: item.name,
                        business_name: res?.fields?.find(
                            (it) => it.technical_name === item.name,
                        )?.business_name,
                    }
                }) || []
            const names = data?.columns?.map((item) => item.name)
            data?.data.forEach((item) => {
                const obj: any = {}
                names.forEach((it, inx) => {
                    // 二进制大对象不显示
                    obj[it] = it === 'long_blob_data' ? '[Record]' : item[inx]
                })
                list.push(obj)
            })

            // const reportRes = await getExploreReport({
            //     id,
            //     is_full_report: false,
            // })
            // setIsAI(data.is_ai)
            const reportRes: any = {}

            setColumns(
                resColumns.map((cItem) => {
                    const reportInfo = reportRes?.data?.explore_details.find(
                        (it) => it.field_name_en === cItem.technical_name,
                    )
                    return {
                        title: (
                            <div>
                                <div className={styles.tableTDContnet}>
                                    <span className={styles.nameIcon}>
                                        {getFieldTypeEelment(cItem, 20)}
                                    </span>
                                    <span
                                        title={`${cItem.business_name}`}
                                        className={styles.businessTitle}
                                    >
                                        {cItem.business_name}
                                    </span>
                                    {reportInfo && (
                                        <Tooltip
                                            // autoAdjustOverflow={false}
                                            color="white"
                                            placement="bottom"
                                            overlayClassName="reportInfoTitleTipsWrapper"
                                            title={
                                                <FieldsToolTips
                                                    ruleData={reportInfo}
                                                />
                                            }
                                        >
                                            <ExplorOutlined
                                                style={{ marginLeft: '5px' }}
                                            />
                                        </Tooltip>
                                    )}
                                </div>
                                <div
                                    className={classnames(
                                        styles.tableTDContnet,
                                        styles.subTableTDContnet,
                                    )}
                                    title={`${cItem.technical_name}`}
                                >
                                    {cItem.technical_name}
                                </div>
                            </div>
                        ),
                        dataIndex: cItem.technical_name,
                        key: cItem.technical_name,
                        ellipsis: true,
                        render: (text) => {
                            const name =
                                text === ''
                                    ? '--'
                                    : text === false ||
                                      text === true ||
                                      text === 0
                                    ? `${text}`
                                    : text
                            return (
                                <div className={styles.tableTDContnet}>
                                    <span
                                        title={`${name}`}
                                        className={styles.businessTitle}
                                    >
                                        {name}
                                    </span>
                                </div>
                            )
                        },
                    }
                }) || [],
            )
            setLoading(false)
            return {
                total: data?.total_count || 0,
                list,
            }
        } catch (err) {
            if (err?.data?.code === 'ERR_CANCELED') {
                return {
                    total: 0,
                    list: [],
                }
            }
            getDataNormal(false)
            if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                setIsErr(true)
            } else {
                formatError(err)
            }
            setLoading(false)
            return {
                total: 0,
                list: [],
            }
        }
    }
    const { tableProps, run, pagination } = useAntdTable(initTableData, {
        defaultPageSize: 20,
        manual: true,
    })

    const props: any = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])

    return loading ? (
        <Loader />
    ) : tableProps?.dataSource?.length > 0 ? (
        <div
            className={styles.tableWrapper}
            style={{
                height: isMarket
                    ? '100%'
                    : tableProps.dataSource.length === 0
                    ? undefined
                    : tableProps.pagination.total > 20
                    ? 'calc(100% - 50px)'
                    : 'calc(100% - 48px)',
                overflowY: 'auto',
            }}
        >
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            >
                <Table
                    {...props}
                    columns={columns}
                    className={styles.sampleTable}
                    rowKey={(record) => record.index}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered={false}
                    rowSelection={null}
                    scroll={
                        scrollY
                            ? {
                                  y: scrollY,
                                  x:
                                      columns.length > 3
                                          ? columns.length * 200
                                          : undefined,
                              }
                            : undefined
                    }
                />
            </Watermark>
        </div>
    ) : (
        <div
            style={{
                marginTop: 120,
            }}
        >
            <Empty
                desc={
                    isErr
                        ? __('源表已修改，请联系系统管理员重新发布后查看')
                        : formViewStatus === 'delete'
                        ? __('源表已删除，无法查看样例数据')
                        : __('暂无数据')
                }
                iconSrc={empty}
            />
        </div>
    )
}

export default FormViewExampleData
