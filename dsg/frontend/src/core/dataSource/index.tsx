import { HTMLProps } from 'react'
import { FontIcon } from '@/icons'
import { IDataBaseType, getConnectors } from '../apis'
import { formatError } from '../errors'
import { StaticDataType, dataBaseIconsList, defaultDataBaseType } from './base'
import { IconType } from '@/icons/const'

interface IDataBaseIcon extends HTMLProps<HTMLSpanElement> {
    iconType: 'Outlined' | 'Colored'
    type: string
}

/**
 *  获取图标组件
 * @param param0 {type: 数据库的类型， 图标的类型}
 * @returns
 */
const getDataBaseIcons = ({
    type,
    iconType = IconType.COLOREDICON,
}: {
    type: string
    iconType: IconType
}) => {
    return ({ style = {}, ...props }: HTMLProps<HTMLSpanElement>) => {
        if (dataBaseIconsList[type]) {
            return (
                <FontIcon
                    {...props}
                    name={
                        iconType === IconType.COLOREDICON
                            ? dataBaseIconsList[type].coloredName
                            : dataBaseIconsList[type].outlinedName
                    }
                    type={iconType as IconType}
                    style={style}
                />
            )
        }
        return (
            <FontIcon
                {...props}
                name="icon-weizhishujuyuan"
                type={iconType}
                style={
                    iconType === IconType.COLOREDICON
                        ? {
                              ...style,
                              color: '3A8FF0',
                          }
                        : style
                }
            />
        )
    }
}

/**
 * 数据库类型和图标等更多属性信息集合类
 */
class DataBaseTypeNodes extends StaticDataType {
    dataBaseIcons = {}

    // 0 未向后端获取过， 1代表获取中， -1代表获取成功当前为服务端的数据
    private IsDefault = 0

    private iconsData = {}

    constructor() {
        super()
        // 默认数据
        let currentValues = defaultDataBaseType
        // 设置默认图标
        this.updateIconData(defaultDataBaseType)
        Object.defineProperty(this, 'dataTypes', {
            get: () => {
                return currentValues
            },
            set: (value: Array<IDataBaseType>) => {
                this.updateIconData(value)

                currentValues = value
            },
        })
        Object.defineProperty(this, 'dataBaseIcons', {
            get: () => {
                if (!this.IsDefault) {
                    this.IsDefault = 1
                    this.updateDataBaseTypes()
                }
                return this.iconsData
            },
        })
    }

    /**
     * 更新数据源
     */
    private async updateDataBaseTypes() {
        try {
            const { connectors } = await getConnectors()
            const connectorNames = connectors
                ?.filter((o) => !o?.olk_connector_name?.includes('anyshare'))
                ?.map((o) => ({
                    ...o,
                    olkConnectorName: o.olk_connector_name,
                    showConnectorName: o.show_connector_name,
                }))
            if (connectorNames) {
                this.IsDefault = -1
            }
            this.dataTypes =
                connectorNames?.map((item: any) => {
                    switch (item.olkConnectorName) {
                        case 'postgresql':
                            return {
                                ...item,
                                showConnectorName: 'PostgreSQL（TBase）',
                            }
                        case 'oracle':
                            return {
                                ...item,
                                showConnectorName: 'Oracle (TDSQL)',
                            }
                        default:
                            return item
                    }
                }) || defaultDataBaseType
        } catch (ex) {
            if (this.IsDefault !== -1) {
                this.IsDefault = 0
            }
            formatError(ex)
        }
    }

    /**
     * 执行从后端获取
     * 需要实时拿到的话优先执行这个，结束后再去获取类的图标属性
     */
    async handleUpdateDataBaseTypes() {
        await this.updateDataBaseTypes()
    }

    /**
     * 设置图标数据
     * @param databaseTypes 服务端数据类型
     */
    private updateIconData(databaseTypes: Array<IDataBaseType>) {
        this.iconsData = databaseTypes.reduce(
            (preData, currentData) => ({
                ...preData,
                [currentData.olkConnectorName]: {
                    Colored: getDataBaseIcons({
                        type: currentData.olkConnectorName,
                        iconType: IconType.COLOREDICON,
                    }),
                    Outlined: getDataBaseIcons({
                        type: currentData.olkConnectorName,
                        iconType: IconType.FONTICON,
                    }),
                    labelName: currentData.showConnectorName,
                },
            }),
            {},
        )
    }
}

// 创建实例
export const databaseTypesEleData = new DataBaseTypeNodes()

export const DataColoredBaseIcon = ({
    type,
    iconType,
    ...props
}: IDataBaseIcon) => {
    if (type && databaseTypesEleData.dataBaseIcons?.[type]) {
        const { Outlined, Colored } = databaseTypesEleData.dataBaseIcons[type]
        return iconType === 'Colored' ? (
            <Colored {...props} />
        ) : (
            <Outlined {...props} />
        )
    }
    return (
        <FontIcon
            name="icon-weizhishujuyuan"
            type={IconType.FONTICON}
            {...props}
        />
    )
}
