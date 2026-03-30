import React, { useEffect, useState } from 'react'
import { message, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { cloneDeep } from 'lodash'
import { EditOutlined } from '@/icons'
import {
    Architecture,
    propertyInfo,
    nodeInfo,
    IPropertyInfo,
    DataNode,
} from './const'
import styles from './styles.module.less'
import __ from './locale'
import UploadFile from './Upload'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { formatError, updateObjAttribute } from '@/core'
import EditProperty from './EditProperty'
import { TagTextView } from '../AutoFormView/baseViewComponents'

interface IDetails {
    selectedNode: DataNode
    data: any
}
const Details: React.FC<IDetails> = ({ selectedNode, data }) => {
    const [properties, setProperties] = useState<IPropertyInfo[]>(
        cloneDeep(propertyInfo),
    )
    // 记录鼠标移动到那个字段上
    // const [operateKey, setOperateKey] = useState<string>('')

    const [details, setDetails] = useState<any>()

    useEffect(() => {
        setDetails(data)
        // 切换节点后取消编辑状态
        setProperties(cloneDeep(propertyInfo))
    }, [data])

    // 点击编辑 切换到编辑状态 & 值回显
    const onEdit = (pIndex: number) => {
        properties[pIndex].isEdit = true
        setProperties([...properties])
    }

    const onFinish = async (values, pIndex: number) => {
        try {
            if (
                !(
                    values[Object.keys(values)[0]] ===
                    details[Object.keys(values)[0]]
                )
            ) {
                // 数据有改动调接口，数据没变则不调接口
                await updateObjAttribute({
                    id: selectedNode.id,
                    name: selectedNode.name,
                    attribute: { ...values },
                })
                message.success('编辑成功')
                setDetails({ ...details, ...values })
            }
            properties[pIndex].isEdit = false
            setProperties([...properties])
        } catch (error) {
            formatError(error)
        }
    }

    const renderRow = () => {
        // 获取某节点下需要展示的属性
        const { fields } = nodeInfo[selectedNode.type]

        return properties.map((property: IPropertyInfo, pIndex: number) => {
            const contentComp = [
                'business_matters',
                'business_system',
            ].includes(property.key) ? (
                <div>
                    {Array.isArray(details?.[property.key]) &&
                    details?.[property.key].length > 0 ? (
                        <TagTextView
                            initValue={details?.[property.key] || ''}
                            valueKey="name"
                            maxTextLength={12}
                            minRow={5}
                        />
                    ) : (
                        '--'
                    )}
                </div>
            ) : ['file_specification', 'document_basis'].includes(
                  property.key,
              ) ? (
                <div className={styles.content}>
                    <UploadFile
                        nodeId={selectedNode.id}
                        nodeName={selectedNode.name}
                        nodeFileName={
                            details?.file_specification_name ||
                            details?.document_basis_name
                        }
                    />
                </div>
            ) : (
                <div className={styles.content}>
                    {property.isEdit ? (
                        <EditProperty
                            value={details[properties[pIndex].key]}
                            property={property}
                            index={pIndex}
                            onFinish={onFinish}
                        />
                    ) : (
                        <>
                            <div
                                className={styles.value}
                                title={
                                    details
                                        ? details[property.key] || '--'
                                        : '--'
                                }
                            >
                                {details ? details[property.key] || '--' : '--'}
                            </div>
                            {/* 编辑禁用不显示 */}
                            {!property.forbitEdit && (
                                <Tooltip title={__('编辑')} placement="bottom">
                                    <div className={styles.editIcon}>
                                        <EditOutlined
                                            onClick={() => onEdit(pIndex)}
                                        />
                                    </div>
                                </Tooltip>
                            )}
                        </>
                    )}
                </div>
            )

            return fields?.includes(property.key) ? (
                <div
                    className={classnames(
                        styles.row,
                        ['business_matters', 'business_system'].includes(
                            property.key,
                        ) && styles.tagRow,
                    )}
                    key={property.key}
                    // onMouseEnter={() => setOperateKey(property.key)}
                    // onMouseLeave={() => setOperateKey('')}
                >
                    <div className={styles.label}>
                        {property.label}
                        {property.tips && (
                            <Tooltip
                                title={property.tips.map((tip) => (
                                    <div key={tip}>{tip}</div>
                                ))}
                                placement="bottom"
                            >
                                <QuestionCircleOutlined
                                    className={styles.questionIcon}
                                />
                            </Tooltip>
                        )}
                        {property.tips && ' ：'}
                    </div>
                    {contentComp}
                </div>
            ) : null
        })
    }
    return (
        <div className={styles.detailsWrapper}>
            <div className={styles.propertyTitle}>详情</div>
            {[
                Architecture.ALL,
                Architecture.BSYSTEMCONTAINER,
                Architecture.BMATTERSCONTAINER,
            ].includes(selectedNode.type as Architecture) ? (
                <Empty desc={__('选择任一类型后查看其属性')} iconSrc={empty} />
            ) : Architecture.BSYSTEM === selectedNode.type ? (
                <Empty desc={__('该类型暂无属性')} iconSrc={empty} />
            ) : (
                renderRow()
            )}
        </div>
    )
}
export default Details
