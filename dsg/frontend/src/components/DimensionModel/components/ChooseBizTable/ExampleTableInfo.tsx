import { useAntdTable } from 'ahooks'
import { message, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import empty from '@/assets/dataEmpty.svg'
import { Empty, Loader, Watermark } from '@/ui'
import {
    formatError,
    getVirtualEngineExample,
    IVirtualEngineExample,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import __ from '../../locale'
import styles from './styles.module.less'
import { VIEWERRORCODElIST } from '@/components/DatasheetView/const'

const ExampleTableInfo = ({
    catalog,
    schema,
    table,
}: IVirtualEngineExample) => {
    const [columns, setColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [userInfo] = useCurrentUser()

    useEffect(() => {
        if (table) {
            run({ ...pagination, current: 1 })
        }
    }, [table])

    const initTableData = async () => {
        try {
            setLoading(true)
            const data = await getVirtualEngineExample({
                catalog,
                schema,
                table,
                user: userInfo?.Account || '',
                limit: 10,
                user_id: userInfo?.ID || '',
            })
            const list: any[] = []
            const resColumns = data?.columns?.map((item) => item.name)
            data?.data.forEach((item) => {
                const obj: any = {}
                resColumns.forEach((it, inx) => {
                    obj[it] = item[inx]
                })
                list.push(obj)
            })
            setColumns(
                data?.columns?.map((cItem) => {
                    return {
                        // title: (
                        //     <div
                        //         // className={styles.tableTDContnet}
                        //         title={`${cItem.name} `}
                        //         key={cItem.name}
                        //     >
                        //         {cItem.name}
                        //     </div>
                        // ),
                        title: cItem.name,
                        dataIndex: cItem.name,
                        key: cItem.name,
                        // ellipsis: true,
                        render: (text) => {
                            return (
                                <div className={styles.tableTDContnet}>
                                    {text}
                                </div>
                            )
                        },
                    }
                }) || [],
            )
            return {
                total: data?.total_count || 0,
                list,
            }
        } catch (err) {
            if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                message.error(__('库表有更新，请重新发布'))
            } else {
                formatError(err)
            }
            return {
                total: 0,
                list: [],
            }
        } finally {
            setLoading(false)
        }
    }
    const { tableProps, run, pagination } = useAntdTable(initTableData, {
        defaultPageSize: 20,
        manual: true,
    })

    const props: any = useMemo(() => {
        const p: { dataSource; onChange; [key: string]: any } = tableProps
        return p
    }, [tableProps])
    return (
        <div className={styles.exampleTableInfoWrapper}>
            {loading ? (
                <div className={styles.contentLoader}>
                    <Loader />
                </div>
            ) : tableProps?.dataSource?.length > 0 ? (
                <div
                    className={styles.tableWrapper}
                    style={{
                        height:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : tableProps.pagination.total > 20
                                ? 'calc(100% - 50px)'
                                : 'calc(100% - 24px)',
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
                            scroll={{
                                y: 410,
                                x: 'auto',
                            }}
                        />
                    </Watermark>
                </div>
            ) : (
                <div>
                    <Empty desc={__('无样例数据')} iconSrc={empty} />
                </div>
            )}
        </div>
    )
}

export default ExampleTableInfo
