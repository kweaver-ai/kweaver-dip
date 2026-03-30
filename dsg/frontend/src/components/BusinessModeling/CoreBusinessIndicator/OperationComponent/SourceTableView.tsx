import { FC } from 'react'
import { Table } from 'antd'

import __ from '../../locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getTableTypeTag } from '../../helper'
import { operatingKeyList } from '../../const'
import styles from './styles.module.less'

interface ISourceTableView {
    tableData: any
    key: string
}
const SourceTableView: FC<ISourceTableView> = ({ tableData, key }) => {
    const columns = [
        {
            title: __('字段名称'),
            dataIndex: 'source_field_name',
            key: 'source_field_name',
            width: 100,
            ellipsis: true,
        },
        {
            title: __('运算逻辑'),
            dataIndex: 'operation_logic',
            key: 'operation_logic',
            width: 100,
            ellipsis: true,
            render: (text: string) => {
                return (
                    <span>
                        {
                            operatingKeyList.find((item) => item.value === text)
                                ?.label
                        }
                    </span>
                )
            },
        },
        {
            title: __('取值规则'),
            dataIndex: 'source_rule',
            key: 'source_rule',
            width: 100,
            ellipsis: true,
        },
        {
            title: __('取值说明'),
            dataIndex: 'source_rule_desc',
            key: 'source_rule_desc',
            width: 100,
        },
        {
            title: __('检验规则'),
            dataIndex: 'check_rule',
            key: 'check_rule',
            width: 100,
        },
    ]
    return (
        <div className={styles.tableDetailViewContent} key={key}>
            <div className={styles.titleNameWrapper}>
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-shujubiaoicon"
                    style={{
                        fontSize: 20,
                        flexShrink: 0,
                    }}
                />
                <span className={styles.nameWrapper}>
                    {tableData.source_table_name}
                </span>
                {getTableTypeTag(tableData.rel_type)}
            </div>
            <Table
                columns={columns}
                dataSource={tableData.source_field}
                pagination={false}
            />
        </div>
    )
}

export default SourceTableView
