import { Table, Tooltip } from 'antd'
import classnames from 'classnames'
import { useEffect, useState } from 'react'
import empty from '@/assets/dataEmpty.svg'
import { formatError } from '@/core'
import { ExplorOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import { getFieldTypeEelment } from '../DatasheetView/helper'
import FieldsToolTips from '@/components/DatasheetView/DataQuality/FieldsToolTips'
import __ from './locale'
import styles from './styles.module.less'
import { Loader, Watermark } from '@/ui'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { VIEWERRORCODElIST } from '../DatasheetView/const'

function TabSimpleData({ detail, data }: any) {
    const [userInfo] = useCurrentUser()
    const [columns, setColumns] = useState<Array<any>>([])
    const [dataSource, setDataSource] = useState<any[]>([])
    const [isErr, setIsErr] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [formViewStatus, setFormViewStatus] = useState<string>('')

    const onLoad = async () => {
        try {
            setLoading(true)
            const res = detail
            setFormViewStatus(
                !res?.last_publish_time && res.status !== 'delete'
                    ? 'unPublished'
                    : res.status,
            )
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
                    obj[it] = item[inx]
                })
                list.push(obj)
            })
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
                                        className={styles.name}
                                        title={`${cItem.business_name}`}
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
                            return (
                                <div className={styles.tableTDContnet}>
                                    {/* {isNumber(text) || !!text ? text : '--'} */}
                                    <span
                                        className={styles.name}
                                        title={text || '--'}
                                    >
                                        {text || '--'}
                                    </span>
                                </div>
                            )
                        },
                    }
                }) || [],
            )

            setDataSource(list)
        } catch (err) {
            if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                setIsErr(true)
            } else {
                formatError(err)
            }
            setDataSource([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (detail) {
            onLoad()
        }
    }, [data, detail])

    return loading ? (
        <div style={{ paddingTop: '20vh' }}>
            <Loader />
        </div>
    ) : dataSource?.length > 0 ? (
        <div
            className={styles.tableWrapper}
            style={{
                height:
                    dataSource.length === 0 ? undefined : 'calc(100% - 50px)',
            }}
        >
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            >
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    className={styles.sampleTable}
                    rowKey={(record) => record.index}
                    pagination={{
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered={false}
                    rowSelection={undefined}
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

export default TabSimpleData
