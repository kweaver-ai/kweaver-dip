import * as React from 'react'
import { FC, useState } from 'react'
import { trim } from 'lodash'
import classnames from 'classnames'
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import {
    FormType,
    VIRTUALENGINTYPE,
    tabsKey,
} from '../DataSynchronization/const'
import __ from './locale'
import {
    IConnectorMapSourceType,
    checkPasteNameByDataSource,
    checkProcessModelRepeatName,
    checkSyncModelRepeatName,
    formatError,
} from '@/core'
import { DataBaseType } from '../DataSource/const'
import styles from './styles.module.less'
import { TabViewType } from './const'
import { CodeViewOutlined, FormDetailOutlined } from '@/icons'

// 顶栏切换tab
export const dataProcessModelTabs = [
    {
        label: __('模型'),
        key: tabsKey.MODEL,
        children: '',
    },
    {
        label: __('加工逻辑'),
        key: tabsKey.PROCESSLOGIC,
        children: '',
    },
    {
        label: __('加工日志'),
        key: tabsKey.LOGS,
        children: '',
    },
]

/**
 * 获取搜索字段
 */
export const searchFieldData = (
    sourceData: Array<any>,
    targetData: Array<any>,
    searchKey: string,
    type: FormType,
) => {
    if (searchKey) {
        if (type === FormType.BUSSINESSFORM) {
            const searchData = sourceData.filter((item, index) => {
                return (
                    item.name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()) ||
                    item.name_en
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()) ||
                    targetData?.[index]?.name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase())
                )
            })
            return searchData
        }
        const searchData = targetData.filter((item, index) => {
            return (
                item.name
                    .toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase()) ||
                sourceData?.[index]?.name
                    ?.toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase()) ||
                sourceData?.[index]?.name_en
                    ?.toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase())
            )
        })
        return searchData
    }
    return type === FormType.BUSSINESSFORM ? sourceData : targetData
}

/**
 * 计算生成桩的位置
 */
export const getPortByNode = (
    group: string,
    index,
    site: string = '',
    length: number = 10,
) => {
    return {
        group,
        label: {},
        args: {
            position:
                group === 'leftPorts'
                    ? {
                          x: 0,
                          y: getYPosition(site, index, length),
                      }
                    : {
                          x: 282,
                          y: getYPosition(site, index, length),
                      },
        },
        zIndex: 10,
    }
}

/**
 *  数据表数据格式化
 * @param field
 * @returns
 */
export const formatFieldData = (field) => {
    const { type, rowType, origType, ...rest } = field
    const { newType, length, field_precision } = splitDataType(origType)
    return {
        type: newType,
        length,
        field_precision,
        ...rest,
    }
}

/**
 * 数据类型解构
 * @param dataType
 * @returns
 */
export const splitDataType = (dataType) => {
    const [type, lengthData] = trim(dataType.replace(/[()]/g, ' ')).split(' ')
    let length: number | null = null
    let field_precision: number | null = null
    if (lengthData) {
        const typeInfo = lengthData.split(',')
        if (typeInfo.length > 1) {
            field_precision = Number(typeInfo[1])
        }
        length = Number(typeInfo[0])
    }
    return {
        newType: type,
        length,
        field_precision,
    }
}

/**
 * 类型切换
 */
export const changeTypeMySQLToHive = (type) => {
    switch (type) {
        case 'real':
        case 'float':
            return 'float'
        case 'datetime':
            return 'timestamp'
        case 'tinytext':
        case 'text':
        case 'mediumtext':
        case 'longtext':
            return 'varchar'
        case 'varbinary':
            return 'binary'
        default:
            return type
    }
}

/**
 * 计算桩的位置
 * @param site
 * @param index
 * @param length
 * @returns
 */
const getYPosition = (site, index, length) => {
    if (site === 'top') {
        return 21
    }
    if (site === 'bottom') {
        return 42 + length * 30 + 10
    }
    return 42 + index * 30 + 15
}

/**
 *  检查服务名重复
 * @param ruler
 * @param name
 * @returns
 */
export const checkProcessModelNameRepeat = async (ruler, params) => {
    try {
        const { repeat } = await checkProcessModelRepeatName(params)
        if (repeat) {
            return Promise.reject(new Error('该名称已存在，请重新输入'))
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

/**
 * 检查数据表重名
 * @param params
 * @returns
 */
export const checkoutDataFormNameRepeat = async (params) => {
    try {
        const { repeat } = await checkPasteNameByDataSource(params)
        if (repeat) {
            return Promise.reject(new Error('该名称已存在，请重新输入'))
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

/**
 * 根据业务表获取虚拟化数据表类型
 */
export const getDataFormFieldType = (
    type: string,
    length = null,
    field_precision = null,
) => {
    switch (type) {
        case 'decimal':
            return 'decimal'
        case 'float':
            return 'real' // toDO
        case 'int':
        case 'number':
            if (length) {
                // if (field_precision || field_precision === 0) {
                //     return 'decimal'
                // }
                // if (Number(length) !== Math.round(length)) {
                //     return 'float'
                // }

                if (Number(length) < 3) {
                    return 'tinyint'
                }
                if (Number(length) < 5) {
                    return 'smallint'
                }
                if (Number(length) < 10) {
                    return 'int'
                }
                return 'bigint'
            }
            return 'bigint'
        case 'char':
            return 'varchar'
        case 'time':
            return 'time'
        case 'date':
            return 'date'
        case 'datetime':
        case 'timestamp':
            return 'timestamp'
        case 'bool':
            return 'boolean'
        // case 'binary':
        //     return 'binary'
        default:
            return ''
    }
}

/**
 * 虚拟化引擎到hive
 * @param type
 * @returns
 */
const changeVirtualizationToHive = (type) => {
    switch (type) {
        case 'varbinary':
            return 'binary'
        default:
            return type
    }
}

/**
 * 虚拟化引擎到mysql/mariadb
 */
const changeVirtualizationToMysql = (type) => {
    switch (type) {
        case 'string':
            return 'varchar'
        case 'timestamp':
            return 'datetime'
        case 'varbinary':
            return 'mediumblob'
        default:
            return type
    }
}

export const changeDataFieldType = (type, dataBasetype: DataBaseType) => {
    switch (dataBasetype) {
        case DataBaseType.MariaDB:
        case DataBaseType.MYSQL:
            return changeVirtualizationToMysql(type)
        case DataBaseType.Hive:
            return changeVirtualizationToHive(type)
        case DataBaseType.PostgreSQL:
        default:
            return type
    }
}

export const changeFieldTypeToPostgreSql = (
    type: string,
    length = null,
    field_precision = null,
) => {
    switch (type) {
        case 'number':
            if (length && (field_precision || field_precision === 0)) {
                return 'numeric'
            }

            if (length && length < 10 && length > 0) {
                return 'int4'
            }
            return 'int8'
        case 'char':
            if (length) {
                return 'varchar'
            }
            return 'text'
        case 'date':
            return 'date'
        case 'datetime':
        case 'timestamp':
            return 'timestamp'
        case 'bool':
            return 'bool'
        case 'binary':
            return 'varbinary'
        default:
            return ''
    }
}

interface IHeaderItem extends React.HTMLAttributes<HTMLDivElement> {
    item: any
    selected: boolean
    showLine: boolean
    errorStatus?: boolean
    onClose: () => void
}

/**
 * 头Item组件
 * @param item 数据
 * @param selected 是否选中
 * @param showLine 分割线
 * @param onClose 关闭
 */
export const HeaderItem: FC<IHeaderItem> = ({
    item,
    selected,
    showLine,
    onClose,
    errorStatus = false,
    ...props
}) => {
    // 更多的显示/隐藏
    const [hidden, setHidden] = useState(true)

    return (
        <div
            key={item.model_id}
            className={classnames(styles.headerTabItemWrap)}
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
            }}
            {...props}
        >
            <div
                hidden={!selected}
                className={styles.hti_leftBlankWrap}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_leftBlank} />
            </div>
            <div
                className={styles.hti_content}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_nameWrap} title={item.name}>
                    {modelTypeIcon(item.type, 16)}
                    <div className={styles.hti_name}>{item.name}</div>
                </div>

                {errorStatus ? (
                    <InfoCircleOutlined style={{ color: '#F5222D' }} />
                ) : (
                    item.type !== TabViewType.CODE && (
                        <CloseOutlined
                            hidden={hidden}
                            className={classnames(styles.hti_close)}
                            onClick={(ev) => {
                                ev.stopPropagation()
                                onClose()
                            }}
                        />
                    )
                )}
            </div>
            <div
                hidden={!selected}
                className={styles.hti_rightBlankWrap}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_rightBlank} />
            </div>
            <div
                className={styles.hti_split}
                style={{
                    visibility: showLine ? 'visible' : 'hidden',
                }}
            />
        </div>
    )
}

/**
 * 模型图标
 * @param type 类型
 * @param size 大小
 */
const modelTypeIcon = (type: string, size: number = 18) => {
    switch (type) {
        case TabViewType.CODE:
            return (
                <CodeViewOutlined
                    style={{
                        color: 'rgba(0,0,0,0.65);',
                        fontSize: size,
                    }}
                />
            )
        case TabViewType.FORM:
            return (
                <FormDetailOutlined
                    style={{
                        color: 'rgba(0,0,0,0.65);',
                        fontSize: size,
                    }}
                />
            )
        default:
            return <div />
    }
}

interface IXScroll extends React.HTMLAttributes<HTMLDivElement> {
    contentWi: number
    contentHi: number
}
/**
 * 横向滚动容器
 */
export const XScroll: FC<IXScroll> = ({
    contentWi,
    contentHi,
    children,
    ...props
}) => {
    return (
        <div
            className={styles.xScrollWrap}
            style={{
                width: contentHi + 8,
                height: contentWi,
            }}
            {...props}
        >
            <div
                className={styles.xScrollContentWrap}
                style={{ left: contentHi }}
            >
                {children}
            </div>
        </div>
    )
}

/**
 * 业务表转换为数据表字段长度变换
 */
export const getFieldLengthByBussiness = (length, field_precision, type) => {
    switch (type) {
        case 'float':
            return length
        case 'int':
        case 'decimal':
        case 'number':
            if (length && (field_precision || field_precision === 0)) {
                return length > 38 ? 38 : length < 1 ? 1 : length
            }
            return null
        case 'char':
            if (length) {
                return length > 65535 ? 65535 : length < 1 ? 1 : length
            }
            return null
        case 'date':
            return null
        case 'datetime':
        case 'timestamp':
            return null
        case 'bool':
            return null
        case 'binary':
            return null
        default:
            return null
    }
}

/**
 * 业务表转换为Postgre数据表字段长度
 */
export const getPostgreFieldLengthByBussiness = (
    length,
    field_precision,
    type,
) => {
    switch (type) {
        case 'number':
            if (length && (field_precision || field_precision === 0)) {
                return length > 38 ? 38 : length < 1 ? 1 : length
            }
            return length
        case 'char':
            if (length) {
                return length > 65535 ? 65535 : length < 1 ? 1 : length
            }
            return null
        case 'date':
            return null
        case 'datetime':
        case 'timestamp':
            return null
        case 'bool':
            return null
        case 'binary':
            return null
        default:
            return null
    }
}
