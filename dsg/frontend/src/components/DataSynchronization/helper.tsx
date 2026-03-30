import { trim } from 'lodash'
import { Form } from 'react-router-dom'

import { FC } from 'react'
import { FormType, VIRTUALENGINTYPE, tabsKey } from './const'
import __ from './locale'
import {
    IConnectorMapSourceType,
    checkPasteNameByDataSource,
    checkProcessModelRepeatName,
    checkSyncModelRepeatName,
    formatError,
    getConnectorTypeMap,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'

// 顶栏切换tab
export const dataSyncModelTabs = [
    {
        label: __('模型'),
        key: tabsKey.MODEL,
        children: '',
    },
    {
        label: __('同步日志'),
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
        if (type === FormType.SOURCESFORM) {
            const searchData = sourceData.filter((item, index) => {
                return (
                    item.name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()) ||
                    targetData[index].name
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
                sourceData[index].name
                    .toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase())
            )
        })
        return searchData
    }
    return type === FormType.SOURCESFORM ? sourceData : targetData
}

/**
 * 计算生成桩的位置
 */
export const getPortByNode = (
    group: string,
    index,
    site: string = '',
    length: number = 10,
    others: any = {},
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
        ...others,
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
    if (newType === '') {
        return {
            type: newType,
            length: null,
            field_precision: null,
            ...rest,
        }
    }
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
        case 'char':
        case 'varchar':
        case 'tinytext':
        case 'text':
        case 'mediumtext':
        case 'longtext':
            return 'string'
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
        return 42
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
export const checkSyncModelNameRepeat = async (ruler, params) => {
    try {
        const { repeat } = await checkSyncModelRepeatName(params)
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
 * 检查重复
 */
export const checkRepeat = (fieldsData: Array<any>, indexId, value) => {
    const repeatData = fieldsData.find(
        (currentField) =>
            currentField.indexId !== indexId && currentField.name === value,
    )
    return !!repeatData
}

/**
 * 组合字符长度和精度
 */
export const comboDataLength = (length, field_precision) => {
    if (field_precision || field_precision === 0) {
        return `(${length.toString()},${field_precision.toString()})`
    }
    if (length || length === 0) {
        return `(${length.toString()})`
    }
    return ''
}
/**
 * 更改数据类型
 * @param sourceFields 原始数据
 * @param sourceDataBaseType 原始数据库类型
 * @param targetDataBaseType 目标数据库类型
 * @returns Promise(targetFields)目标数据
 */
export const changeFieldDataBaseType = async (
    sourceFields: Array<any>,
    sourceDataBaseType,
    targetDataBaseType,
): Promise<Array<any>> => {
    // 组织数据转换的参数
    const sourceData: Array<IConnectorMapSourceType> = sourceFields.map(
        (currentField, index) => ({
            index,
            sourceTypeName: currentField.type,
            precision:
                currentField.length || currentField.length === 0
                    ? currentField.length
                    : undefined,
            decimalDigits:
                currentField.field_precision ||
                currentField.field_precision === 0
                    ? currentField.field_precision
                    : undefined,
        }),
    )

    // 执行数据转换
    const [targetTypeData, olkTypeData] = await Promise.all([
        getConnectorTypeMap({
            sourceConnectorName: sourceDataBaseType,
            targetConnectorName: targetDataBaseType,
            type: sourceData,
        }),
        getConnectorTypeMap({
            sourceConnectorName: sourceDataBaseType,
            targetConnectorName: VIRTUALENGINTYPE,
            type: sourceData,
        }),
    ])

    // 变换转换后的数据格式
    const newMapData = targetTypeData.type.reduce((preData, currentData) => {
        const { index, ...rest } = currentData
        return {
            ...preData,
            [index]: rest,
        }
    }, {})

    // 变换转换后的虚拟化引擎数据格式
    const virtualMapData = olkTypeData.type.reduce((preData, currentData) => {
        const { index, ...rest } = currentData
        return {
            ...preData,
            [index]: rest,
        }
    }, {})
    // 回填转换后的数据组织成目标数据
    const targetData = sourceFields.map((currentField, index) => ({
        ...currentField,
        length:
            newMapData[index]?.precision || newMapData[index]?.precision === 0
                ? newMapData[index]?.precision
                : null,
        field_precision:
            newMapData[index]?.decimalDigits ||
            newMapData[index]?.decimalDigits === 0
                ? newMapData[index]?.decimalDigits
                : null,
        type: newMapData[index].targetTypeName
            ? newMapData[index].targetTypeName
            : 'undefined',
        searchType: virtualMapData[index].targetTypeName || '',
        unmapped: !newMapData[index].targetTypeName,
    }))
    return targetData
}

interface IDataSourceIcon {
    dataType: string
    fontSize: number
}
export const DataSourceIcon: FC<IDataSourceIcon> = ({ dataType, fontSize }) => {
    if (dataType) {
        const { Outlined } =
            databaseTypesEleData?.dataBaseIcons?.[dataType] || {}

        return Outlined ? <Outlined style={{ fontSize }} /> : null
    }
    return null
}
