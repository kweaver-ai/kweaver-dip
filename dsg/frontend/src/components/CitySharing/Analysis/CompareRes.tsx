import { Button, Col, Drawer, Row, Table, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { ResTypeEnum } from '../helper'
import { ApplyResource } from '../const'

interface ICompareResProps {
    items: any[]
    open: boolean
    onClose: () => void
}
const CompareRes = ({ items, open, onClose }: ICompareResProps) => {
    const [isShow, setIsShow] = useState(true)

    const showItems = useMemo(() => {
        return items.filter(
            (item) =>
                item.res_type === ResTypeEnum.Catalog &&
                item.apply_conf.supply_type === ApplyResource.Database,
        )
    }, [items])

    const columns = [
        {
            title: __('资源名称'),
            dataIndex: 'res_name',
            key: 'res_name',
            width: 193,
        },
        {
            title: __('分析结果'),
            dataIndex: 'is_reasonable',
            key: 'is_reasonable',
            width: 130,
            render: (text: boolean) => {
                return text ? __('合理') : __('不合理')
            },
        },
        {
            title: __('信息项'),
            dataIndex: 'columns',
            key: 'columns',
            render: (_, record) => {
                const oldColumns = JSON.parse(
                    record.apply_conf.view_apply_conf.column_names || '[]',
                )
                const newColumns = record.column_names
                    ? JSON.parse(record.column_names || '[]')
                    : []
                const columnNames = Array.from(
                    new Set([...oldColumns, ...newColumns]),
                )
                return (
                    <div className={styles['column-list']}>
                        {columnNames.map((name: string, nameIdx: number) => {
                            const isDel =
                                oldColumns.includes(name) &&
                                newColumns.length > 0 &&
                                !newColumns.includes(name)
                            const isAdd =
                                !oldColumns.includes(name) &&
                                newColumns.includes(name)
                            return nameIdx < 3 ? (
                                <Tooltip
                                    title={
                                        isDel
                                            ? __('已删除')
                                            : isAdd
                                            ? __('新增字段')
                                            : name
                                    }
                                >
                                    <div
                                        key={name}
                                        className={classNames(
                                            styles['column-item'],
                                            {
                                                [styles['column-item-del']]:
                                                    isDel,
                                                [styles['column-item-add']]:
                                                    isAdd,
                                            },
                                        )}
                                    >
                                        {name}
                                    </div>
                                </Tooltip>
                            ) : null
                        })}
                        {columnNames.length > 3 && (
                            <Tooltip
                                color="#fff"
                                getPopupContainer={(node) =>
                                    node.parentNode as HTMLElement
                                }
                                title={
                                    <Row
                                        gutter={8}
                                        className={
                                            styles['column-list-tooltip']
                                        }
                                    >
                                        {columnNames.map((name) => {
                                            const isDel =
                                                oldColumns.includes(name) &&
                                                newColumns.length > 0 &&
                                                !newColumns.includes(name)
                                            const isAdd =
                                                !oldColumns.includes(name) &&
                                                newColumns.includes(name)
                                            return (
                                                <Tooltip
                                                    title={
                                                        isDel
                                                            ? __('已删除')
                                                            : isAdd
                                                            ? __('新增字段')
                                                            : name
                                                    }
                                                >
                                                    <Col
                                                        span={11}
                                                        className={classNames(
                                                            styles[
                                                                'column-item'
                                                            ],
                                                            {
                                                                [styles[
                                                                    'column-item-del'
                                                                ]]: isDel,
                                                                [styles[
                                                                    'column-item-add'
                                                                ]]: isAdd,
                                                            },
                                                        )}
                                                    >
                                                        {name}
                                                    </Col>
                                                </Tooltip>
                                            )
                                        })}
                                    </Row>
                                }
                            >
                                <div className={styles['column-more']}>
                                    +{columnNames.length - 3}
                                </div>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
    ]
    return (
        <Drawer
            width={930}
            open={open}
            onClose={onClose}
            title={__('资源分析前后差异')}
        >
            <div className={styles['compare-res-wrapper']}>
                {isShow && (
                    <div className={styles['compare-header']}>
                        <div className={styles['header-left']}>
                            <ExclamationCircleOutlined
                                className={styles['header-icon']}
                            />
                            <div className={styles['header-tips']}>
                                {__(
                                    '列表展示申请的数据目录中信息项，分析前后的差异',
                                )}
                            </div>
                        </div>
                        <Button type="link" onClick={() => setIsShow(false)}>
                            {__('不再提醒')}
                        </Button>
                    </div>
                )}

                <Table
                    dataSource={showItems}
                    columns={columns}
                    className={styles['res-table']}
                    pagination={{
                        size: 'small',
                        hideOnSinglePage: true,
                    }}
                />
            </div>
        </Drawer>
    )
}

export default CompareRes
