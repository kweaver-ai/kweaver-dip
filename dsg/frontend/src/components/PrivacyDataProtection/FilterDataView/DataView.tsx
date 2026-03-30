import { useEffect, useState, useMemo } from 'react'
import { useAntdTable } from 'ahooks'
import { Table, Radio } from 'antd'
import classnames from 'classnames'
import { noop } from 'lodash'
import {
    formatError,
    testDataPrivacyPolicy,
    getDatasheetViewDetails,
} from '@/core'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import empty from '@/assets/dataEmpty.svg'
import __ from '../locale'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { VIEWERRORCODElIST } from '@/components/DatasheetView/const'

interface DataViewType {
    // 数据获取是否正常
    getDataNormal?: (value: boolean) => void
    scrollY?: any
    configInfo: any
}
const DataView = ({
    getDataNormal = noop,
    scrollY,
    configInfo,
}: DataViewType) => {
    const [columns, setColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [isErr, setIsErr] = useState<boolean>(false)
    const [mode, setMode] = useState<boolean>(false)

    useEffect(() => {
        if (configInfo.form_view_id) {
            run({ ...pagination, current: 1, mode })
        }
    }, [configInfo])

    const initTableData = async (params: any) => {
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(configInfo.form_view_id)
            const data = await testDataPrivacyPolicy({
                limit: 10,
                offset: 1,
                is_all: params.mode,
                form_view_id: configInfo.form_view_id,
                form_view_field_ids: configInfo.form_view_field_ids,
                desensitization_rule_ids: configInfo.desensitization_rule,
            })
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

            setColumns(
                resColumns.map((cItem) => {
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
    ) : (
        <div
            className={styles['fields-wrapper']}
            // style={{
            //     height: isMarket
            //         ? '100%'
            //         : tableProps.dataSource.length === 0
            //         ? undefined
            //         : tableProps.pagination.total > 20
            //         ? 'calc(100% - 50px)'
            //         : 'calc(100% - 48px)',
            //     overflowY: 'auto',
            // }}
        >
            <Radio.Group
                onChange={(e) => {
                    setMode(e.target.value)
                    run({ ...pagination, current: 1, mode: e.target.value })
                }}
                value={mode}
                className={styles['fields-wrapper-radio']}
                size="middle"
            >
                <Radio.Button value={false}>{__('脱敏数据')}</Radio.Button>
                <Radio.Button value>{__('全部数据')}</Radio.Button>
            </Radio.Group>
            {/* <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            > */}
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
                locale={{
                    emptyText: <Empty desc={__('暂无数据')} iconSrc={empty} />,
                }}
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
            {/* </Watermark> */}
        </div>
        // ) : (
        //     <div
        //         style={{
        //             marginTop: 120,
        //         }}
        //     >
        //         <Empty
        //             desc={
        //                 isErr
        //                     ? __('源表已修改，请联系系统管理员重新发布后查看')
        //                     : __('暂无数据')
        //             }
        //             iconSrc={empty}
        //         />
        //     </div>
    )
}

export default DataView
