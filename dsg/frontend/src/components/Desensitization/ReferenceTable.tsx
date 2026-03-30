import { Table, Button, Popconfirm } from 'antd'
import { Key, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { ColumnType } from 'antd/lib/table'
import styles from './styles.module.less'
import __ from './locale'
import { delDesenRule, formatError, getDesenRulePolicy } from '@/core'
import { useBatchDel } from './useBatchDel'
import ProgressModal from './ProgressModal'

export interface Props {
    single?: boolean
    onCheck: (id: string, type: 'Desensitization' | 'policy') => void
    ids: string[]
}

const DelConfirm = ({
    children,
    onConfirm,
}: PropsWithChildren<{ onConfirm: () => void }>) => {
    return (
        <Popconfirm
            title={
                <div>
                    <div className={`${styles.title} ${styles.mb8}`}>
                        确定要解除关系并删除脱敏算法吗？
                    </div>
                    <div className={styles.descText}>
                        解除关系后，之前引用此算法的字段将不再受脱敏保护，请确认操作。
                    </div>
                </div>
            }
            overlayClassName={styles.popConfirmWrapper}
            onConfirm={onConfirm}
        >
            {children}
        </Popconfirm>
    )
}

interface ReferenceRelation {
    id: string
    name: string
    description: string
    relate_policy_list: Array<{
        policy_form_view_name: string
        policy_id: string
    }>
}

const ReferenceTable = (props: Props) => {
    const { single = false, ids, onCheck } = props
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
    const [dataSource, setDataSource] = useState<ReferenceRelation[]>([])
    const progressModalRef = useRef<{
        setTrue: () => void
        setFalse: () => void
    }>()

    const getRelatedPolicy = async (params: { ids: string[] }) => {
        try {
            const res = await getDesenRulePolicy(params)

            if (res.entries) {
                setDataSource(res.entries)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const { batchDel, ...rest } = useBatchDel({
        onComplete(delIds) {
            setDataSource((prevData) => {
                // 表格去掉已经解除关系的脱敏算法
                const newData = prevData.filter(
                    (item) => !delIds.includes(item.id),
                )

                return newData
            })
        },
    })

    useEffect(() => {
        if (ids.length) {
            getRelatedPolicy({ ids })
        }
    }, [ids])

    const forceDelRule = async (delIds: string[]) => {
        batchDel(delIds.map((id) => ({ id, mode: 'force' })))

        if (progressModalRef.current) {
            progressModalRef.current.setTrue()
        }
        // await Promise.all(delIds.map((id) => delDesenRule(id, 'force')))
        //     .then(() => {
        //         setDataSource((prevData) => {
        //             // 表格去掉已经解除关系的脱敏算法
        //             const newData = prevData.filter(
        //                 (item) => !delIds.includes(item.id),
        //             )

        //             return newData
        //         })
        //     })
        //     .catch((err) => {
        //         formatError(err)
        //     })
    }

    const columns: ColumnType<ReferenceRelation>[] = [
        {
            title: __('算法名称（描述）'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 200,
            render(text: string, record: any) {
                return (
                    <>
                        <div
                            className={styles.referenceTableText}
                            onClick={() => {
                                onCheck(record.id, 'Desensitization')
                            }}
                        >
                            {text}
                        </div>
                        <div className={styles.descText}>
                            {record.description}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('作用策略'),
            dataIndex: 'strategies',
            key: 'strategies',
            ellipsis: true,
            className: styles.customColumn,
            render(text, record) {
                return (
                    <div className={styles.strategiesWrapper}>
                        {record.relate_policy_list.map((item) => {
                            return (
                                <div
                                    key={item.policy_id}
                                    onClick={() => {
                                        onCheck(item.policy_id, 'policy')
                                    }}
                                >
                                    {item.policy_form_view_name}
                                </div>
                            )
                        })}
                    </div>
                )
            },
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            ellipsis: true,
            width: 160,
            render(_, record: any) {
                return (
                    <DelConfirm
                        onConfirm={() => {
                            forceDelRule([record.id])
                        }}
                    >
                        <Button type="link">
                            {__('解除关系，并删除算法')}
                        </Button>
                    </DelConfirm>
                )
            },
        },
    ]

    const onChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange,
    }

    return (
        <>
            {!single && selectedRowKeys.length > 0 && (
                <div>
                    <span>已选 {selectedRowKeys.length} 项</span>
                    <DelConfirm
                        onConfirm={() => {
                            forceDelRule(
                                selectedRowKeys.map((item) => item.toString()),
                            )
                        }}
                    >
                        <Button type="link">
                            {__('解除关系，并删除算法')}
                        </Button>
                    </DelConfirm>
                </div>
            )}
            <Table
                rowKey="id"
                rowSelection={single ? undefined : rowSelection}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                scroll={{ y: 400 }}
            />
            <ProgressModal ref={progressModalRef} {...rest} />
        </>
    )
}

export default ReferenceTable
