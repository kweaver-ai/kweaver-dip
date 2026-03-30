import { useEffect, useState } from 'react'
import { Table, Space, Button, message } from 'antd'
import { v4 as uuidv4 } from 'uuid'
import __ from './locale'
import { BusinessDomainLevelDepth, LevelMap, LevelTypeNameMap } from './const'
import styles from './styles.module.less'
import SettingInstructions from './SettingInstructions'
import Confirm from '../Confirm'
import {
    BusinessDomainLevelTypes,
    formatError,
    getBusinessDomainLevel,
    LoginPlatform,
    updateBusinessDomainLevel,
} from '@/core'
import BusinessDomainLevelIcon from './BusinessDomainLevelIcon'
import { getPlatformNumber } from '@/utils'

const BusinessDomainLevel = () => {
    const [domainLevels, setDomainLevels] = useState<any[]>([])
    const [deleteItemIndex, setDeleteItemIndex] = useState<number>(0)
    const platformNumber = getPlatformNumber()

    const getDomainLevel = async () => {
        try {
            const res = await getBusinessDomainLevel()
            setDomainLevels(res.map((item) => ({ type: item, key: uuidv4() })))
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDomainLevel()
    }, [])

    // 获取某类型的第一条数据的index
    const getFirstIndexOfType = (type: BusinessDomainLevelTypes) => {
        return domainLevels.findIndex((item) => item.type === type)
    }

    // 获取某类型的最后一条数据的index
    const getLastTypeIndex = (type: BusinessDomainLevelTypes) => {
        const newData = [...domainLevels]
        return (
            newData.length -
            1 -
            newData.reverse().findIndex((item) => item.type === type)
        )
    }

    // 在某层级下插入一类型层级
    const handleInsertLevel = async (record, index: number) => {
        const newData = [...domainLevels]
        newData.splice(index, 0, {
            key: uuidv4(),
            type: record.type,
        })
        try {
            const res = await updateBusinessDomainLevel({
                level: newData.map((item) => item.type),
            })
            if (res) {
                message.success(__('插入成功'))
                // 更新UI
                setDomainLevels(newData)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 删除某一层级
    const handleDeleteLevel = async (index: number) => {
        const newData = [...domainLevels]
        newData.splice(index, 1)
        try {
            const res = await updateBusinessDomainLevel({
                level: newData.map((item) => item.type),
            })
            if (res) {
                message.success(__('删除成功'))
                // 更新UI
                setDomainLevels(newData)
                setDeleteItemIndex(0)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const columns = [
        {
            title: __('层级图标和类型'),
            dataIndex: 'type',
            key: 'type',
            render: (type: BusinessDomainLevelTypes, record, index: number) => (
                <div
                    style={{ paddingLeft: index * 28 }}
                    className={styles['icon-type-container']}
                >
                    <span className={styles.level}>{LevelMap[index]}</span>
                    <BusinessDomainLevelIcon
                        type={type}
                        isColored
                        className={styles['business-domain-level-icon']}
                    />
                    {type === BusinessDomainLevelTypes.Process &&
                    platformNumber !== LoginPlatform.default
                        ? __('主干业务')
                        : LevelTypeNameMap[type]}
                </div>
            ),
        },
        {
            title: __('操作'),
            dataIndex: 'operate',
            key: 'operate',
            width: 200,
            render: (_, record, index) => {
                return record.type ===
                    BusinessDomainLevelTypes.DomainGrouping ? null : (
                    <Space size={12}>
                        {getLastTypeIndex(record.type) !== index ? null : (
                            <Button
                                type="link"
                                disabled={
                                    domainLevels.length ===
                                    BusinessDomainLevelDepth
                                }
                                onClick={() => handleInsertLevel(record, index)}
                                style={{ height: 22 }}
                            >
                                {record.type === BusinessDomainLevelTypes.Domain
                                    ? __('插入业务领域层级')
                                    : record.type ===
                                      BusinessDomainLevelTypes.Process
                                    ? platformNumber === LoginPlatform.default
                                        ? __('插入业务流程层级')
                                        : __('插入主干业务层级')
                                    : ''}
                            </Button>
                        )}
                        {getFirstIndexOfType(record.type) !== index && (
                            <Button
                                type="link"
                                onClick={() => setDeleteItemIndex(index)}
                                style={{ height: 22 }}
                            >
                                {__('删除')}
                            </Button>
                        )}
                    </Space>
                )
            },
        },
    ]

    return (
        <div className={styles['business-domain-level-wrapper']}>
            <div className={styles.title}>{__('业务领域层级')}</div>
            <div className={styles.content}>
                <div className={styles.left}>
                    <Table
                        dataSource={domainLevels}
                        columns={columns}
                        pagination={false}
                    />
                </div>
                <div className={styles.right}>
                    <SettingInstructions />
                </div>
            </div>
            <Confirm
                onOk={() => handleDeleteLevel(deleteItemIndex)}
                onCancel={() => setDeleteItemIndex(0)}
                open={!!deleteItemIndex}
                title={
                    domainLevels[deleteItemIndex]?.type ===
                    BusinessDomainLevelTypes.Domain
                        ? __('确认要删除业务领域吗？')
                        : platformNumber === LoginPlatform.default
                        ? __('确认要删除业务流程吗？')
                        : __('确认要删除主干业务吗？')
                }
                content={__('删除后，原内容将保持不变，新增项遵循新设置规则。')}
                width={432}
                okText={__('确定')}
                cancelText={__('取消')}
                // okButtonProps={{ loading }}
            />
        </div>
    )
}

export default BusinessDomainLevel
