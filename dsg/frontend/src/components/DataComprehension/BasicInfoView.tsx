import React, { HTMLAttributes } from 'react'
import { Col, Row } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import { formatCount, formatTime } from '@/utils'
import __ from './locale'
import Icons from '../BusinessArchitecture/Icons'
import { dataKindList } from '../ResourcesDir/const'
import { IFormEnumConfigModel } from '@/core'
import { UndsLabel } from './helper'

interface IBasicInfoView extends HTMLAttributes<HTMLDivElement> {
    columns: any[]
    data?: any
    ellipsis?: boolean
    enumConfigs?: IFormEnumConfigModel
    status?: number
}

/**
 * 基本信息组件
 * @param columns 显示字段信息集
 * @param data 基本信息数据
 * @param ellipsis true-省略 false-全部
 * @param enumConfigs 配置信息枚举
 */
const BasicInfoView: React.FC<IBasicInfoView> = ({
    columns,
    data,
    ellipsis = false,
    enumConfigs,
    status,
    ...props
}) => {
    const getValue = (config) => {
        if (config.type === 'custom') {
            if (config.name === 'status') {
                return (
                    <div className={styles.biv_nameWrap}>
                        <UndsLabel type={status || 1} />
                    </div>
                )
            }
            if (config.name === 'updater_name') {
                return (
                    <div className={styles.biv_nameWrap}>
                        <span
                            className={styles.biv_name}
                            title={data?.[config.name] || '--'}
                        >
                            {data?.[config.name] || '--'}
                        </span>
                        <span
                            className={styles.biv_name}
                            title={
                                data?.[config.sub_name]
                                    ? formatTime(data?.[config.sub_name])
                                    : '--'
                            }
                        >
                            {/* {data?.[config.sub_name] || '--'} */}
                            {data?.[config.sub_name]
                                ? formatTime(data?.[config.sub_name])
                                : '--'}
                        </span>
                    </div>
                )
            }
            if (config.name === 'department_path') {
                if (data?.[config.name]?.length > 0) {
                    return (
                        <div
                            className={classnames(
                                styles.biv_pathWrap,
                                ellipsis && styles.biv_ellipsis,
                            )}
                            title={data?.[config.name]
                                .map((info) => info.name)
                                .join('/')}
                        >
                            {data?.[config.name].map((info, idx) => (
                                <span
                                    className={styles.biv_path}
                                    title={info.name || '--'}
                                    key={idx}
                                >
                                    <Icons type={info.type} />
                                    <span className={styles.biv_pathName}>
                                        {info.name}
                                    </span>
                                    <span
                                        hidden={
                                            idx ===
                                            (data?.[config.name].length || 0) -
                                                1
                                        }
                                        className={styles.biv_pathRight}
                                    >
                                        /
                                    </span>
                                </span>
                            ))}
                        </div>
                    )
                }
                return '--'
            }
            if (config.name === 'data_kind') {
                const showList = dataKindList.filter(
                    // eslint-disable-next-line no-bitwise
                    (item) => item.key !== 0 && item.key & data?.[config.name],
                )
                if (showList.length > 0) {
                    return (
                        <div
                            className={classnames(
                                ellipsis && styles.biv_ellipsis,
                            )}
                            title={showList
                                .map((item) => item.label)
                                .join('；')}
                        >
                            {showList.map((info, idx) => (
                                <span
                                    className={styles.biv_tag}
                                    style={{
                                        background: ellipsis
                                            ? '#EBF2FC'
                                            : 'rgba(214,221,237,0.25)',
                                    }}
                                    key={idx}
                                >
                                    {info.label}
                                </span>
                            ))}
                        </div>
                    )
                }
                return '--'
            }
            if (config.name === 'update_cycle') {
                if (enumConfigs && data?.[config.name] !== 0) {
                    return (
                        <span>
                            {enumConfigs.update_cycle.find(
                                (info) => info.id === data?.[config.name],
                            )?.value || '--'}
                        </span>
                    )
                }
                return '--'
            }
        }
        if (config.type === 'array') {
            if (data?.[config.name]?.length > 0) {
                return (
                    <div
                        className={classnames(ellipsis && styles.biv_ellipsis)}
                        title={data?.[config.name].join('；')}
                    >
                        {data?.[config.name].map((info, idx) => (
                            <span
                                className={styles.biv_tag}
                                style={{
                                    background: ellipsis
                                        ? '#EBF2FC'
                                        : 'rgba(214,221,237,0.25)',
                                }}
                                title={info}
                                key={idx}
                            >
                                {info}
                            </span>
                        ))}
                    </div>
                )
            }
            return '--'
        }
        if (config.type === 'time') {
            return data?.[config.name] ? formatTime(data?.[config.name]) : '--'
        }
        if (config.type === 'number') {
            return data?.[config.name] ? formatCount(data?.[config.name]) : '0'
        }
        return (
            <div
                className={classnames(ellipsis && styles.biv_ellipsis)}
                title={data?.[config.name] || '--'}
            >
                {data?.[config.name] || '--'}
            </div>
        )
    }

    const loadRowInfo = (config) => (
        <Row
            className={styles.biv_rowWrapper}
            style={{ padding: ellipsis ? '10px 0 0' : '0 8px 16px 8px' }}
            key={config.name}
        >
            <Col
                className={styles.biv_label}
                style={{
                    minWidth: ellipsis ? 0 : 98,
                    color: ellipsis ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
                }}
            >
                <div className={styles.biv_labelDot} hidden={!ellipsis} />
                {config.label}：
            </Col>
            <Col className={styles.biv_value}>{getValue(config)}</Col>
        </Row>
    )

    return (
        <div
            className={styles.basicInfoViewWrap}
            style={{ margin: ellipsis ? '-8px 0 0' : '0 -8px' }}
            {...props}
        >
            <Row>
                {columns.map((info) => (
                    <Col span={info.col} key={info.label}>
                        {loadRowInfo(info)}
                    </Col>
                ))}
            </Row>
        </div>
    )
}

export default BasicInfoView
