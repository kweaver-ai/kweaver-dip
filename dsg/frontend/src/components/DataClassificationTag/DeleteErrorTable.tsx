import React, { useEffect, useState } from 'react'
import { Row, Col, Popconfirm, Checkbox, message } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'

interface IDeleteErrorTable {
    data: any[]
    onDelete: (item: any[]) => void
    showCheckbox?: boolean
}
const DeleteErrorTable: React.FC<IDeleteErrorTable> = ({
    data,
    onDelete,
    showCheckbox,
}) => {
    const [checkIds, setCheckIds] = useState<string[]>([])
    return (
        <div className={styles.delTable}>
            <Row className={styles.tableHeader}>
                <Col span={7} className={styles.col}>
                    {showCheckbox ? (
                        <Checkbox
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setCheckIds(data.map((item) => item.id))
                                } else {
                                    setCheckIds([])
                                }
                            }}
                            checked={checkIds.length === data.length}
                            indeterminate={checkIds.length > 0}
                        >
                            {__('级别名称')}
                            <span
                                style={{
                                    color: 'rgb(0 0 0 / 45%)',
                                }}
                            >
                                {__('(描述)')}
                            </span>
                        </Checkbox>
                    ) : (
                        <span>
                            {__('级别名称')}
                            <span
                                style={{
                                    color: 'rgb(0 0 0 / 45%)',
                                }}
                            >
                                {__('(描述)')}
                            </span>
                        </span>
                    )}
                </Col>
                <Col
                    span={10}
                    className={classNames(styles.col, styles.middle)}
                >
                    {__('作用对象')}
                </Col>
                <Col span={7} className={styles.col}>
                    {__('操作')}
                </Col>
            </Row>
            {data.map((item) => {
                return (
                    <Row className={styles.tableBody} key={item.id}>
                        <Col span={7} className={styles.columns}>
                            {showCheckbox ? (
                                <Checkbox
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setCheckIds((pre) => [
                                                ...pre,
                                                item.id,
                                            ])
                                        } else {
                                            setCheckIds((pre) =>
                                                pre.filter(
                                                    (id) => id !== item.id,
                                                ),
                                            )
                                        }
                                    }}
                                    checked={checkIds.includes(item.id)}
                                >
                                    <div>{item.name}</div>
                                    <div>
                                        <span
                                            style={{
                                                color: 'rgb(0 0 0 / 45%)',
                                            }}
                                        >
                                            {item.description || __('暂无描述')}
                                        </span>
                                    </div>
                                </Checkbox>
                            ) : (
                                <span>
                                    <div>{item.name}</div>
                                    <div>
                                        <span
                                            style={{
                                                color: 'rgb(0 0 0 / 45%)',
                                            }}
                                        >
                                            {item.description || __('暂无描述')}
                                        </span>
                                    </div>
                                </span>
                            )}
                        </Col>
                        <Col span={10} className={styles.middle}>
                            {item?.objects?.map((o) => {
                                return (
                                    <div className={styles.td} key={o.id}>
                                        <div
                                            className={styles.tdLeft}
                                            title={o.name}
                                        >
                                            {o.type}：{o.name}
                                        </div>
                                        {/* <div className={styles.tdRight}>
                                            {o.type}
                                            {o.dataViewCount}
                                        </div> */}
                                    </div>
                                )
                            })}
                        </Col>
                        <Col span={7} className={styles.options}>
                            <Popconfirm
                                title={
                                    <div className={styles.popBox}>
                                        <div className={styles.popTitle}>
                                            {__('确定要解除关系并删除分级吗？')}
                                        </div>
                                        <div className={styles.popText}>
                                            {__(
                                                '解除关系后，原来已分级的数据将没有分级，若启用了数据保护也不再做数据保护，请确认操作。',
                                            )}
                                        </div>
                                    </div>
                                }
                                onConfirm={() => onDelete([item])}
                                icon={
                                    <ExclamationCircleFilled
                                        style={{ color: '#FF4D4F' }}
                                    />
                                }
                            >
                                <span className={styles.optionsBtn}>
                                    {__('解除关系，并解除分级')}
                                </span>
                            </Popconfirm>
                        </Col>
                    </Row>
                )
            })}
        </div>
    )
}

export default DeleteErrorTable
