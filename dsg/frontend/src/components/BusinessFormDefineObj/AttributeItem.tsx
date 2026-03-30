import { Dropdown, MenuProps, Popconfirm, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { CheckOutlined, InfoCircleFilled } from '@ant-design/icons'
import classNames from 'classnames'
import { EllipsisOutlined, FontIcon, UniqueFlagColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { OperateType } from '../BusinessDomain/const'
import InputWithValidator from './InputWithValidator'
import StandardDetails from './StandardDetails'
import {
    DataGradeLabelType,
    IGradeLabel,
    LoginEntityAttribute,
    formatError,
} from '@/core'
import TagDetails from './TagDetails'
import { getTargetTag } from './const'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'

interface IAttributeItem {
    attribute: LoginEntityAttribute
    attributes: LoginEntityAttribute[]
    isEdit: boolean
    setEditStatus: (val: boolean) => void
    updateAttribute: (val: string | LoginEntityAttribute) => void
    deleteAttribute: () => void
    setUniqueFlag: () => void
    isDetails?: boolean
    gradeLabels?: IGradeLabel[]
}
const AttributeItem: React.FC<IAttributeItem> = ({
    attribute,
    attributes,
    isEdit,
    setEditStatus,
    updateAttribute,
    deleteAttribute,
    setUniqueFlag,
    isDetails = false,
    gradeLabels = [],
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [tags, setTags] = useState<any[]>([])
    const [isStart] = useGradeLabelState()
    const [selectedTagId, setSelectedTagId] = useState<string>()
    const [selectedTagPath, setSelectedTagPath] = useState<string[]>()
    const [originData, setOriginData] = useState<IGradeLabel[]>([])

    const generateTagItem = (data: IGradeLabel[], id: string) => {
        return data.map((item) => {
            if (item.node_type === DataGradeLabelType.Node) {
                return {
                    className: 'tag-sub-menu-item',
                    label: (
                        <div
                            className={classNames(
                                styles['dropdown-item'],
                                id === item.id &&
                                    styles['dropdown-item-selected'],
                            )}
                        >
                            <div className={styles.left}>
                                {item.id && (
                                    <FontIcon
                                        name="icon-biaoqianicon"
                                        className={styles['tag-icon']}
                                        style={{ color: item.icon }}
                                    />
                                )}
                                <div
                                    className={styles['tag-name']}
                                    title={item.name}
                                >
                                    {item.name}
                                </div>
                            </div>
                            {id === item.id ? (
                                <CheckOutlined
                                    className={styles['checked-icon']}
                                />
                            ) : (
                                <div />
                            )}
                        </div>
                    ),
                    key: item.id,
                }
            }
            // item.node_type === DataGradeLabelType.Group
            return {
                className: item.children?.length > 0 ? 'tag-sub-menu-item' : '',
                label: item.name,
                key: item.id,
                children:
                    item.children?.length > 0
                        ? generateTagItem(item.children, id)
                        : undefined,
            }
        })
    }

    const getClassificationTag = async () => {
        try {
            // const res = await getDataGradeLabel({ keyword: '' })
            const tagData: IGradeLabel[] =
                gradeLabels.length > 0
                    ? [
                          ...gradeLabels,
                          {
                              id: '',
                              name: __('无'),
                              node_type: DataGradeLabelType.Node,
                              description: '',
                              parent_id: '',
                              icon: '',
                          } as IGradeLabel,
                      ]
                    : []
            setTags(generateTagItem(tagData, attribute.label_id || ''))
            setOriginData(tagData)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (isStart) {
            getClassificationTag()
        }
    }, [isStart, gradeLabels])

    const items: MenuProps['items'] = useMemo(() => {
        const usingStandardInfo = !attribute.standard_id
            ? {}
            : attribute.standard_id === attribute.standard_info?.id
            ? attribute.standard_info
            : attribute.field_standard_info
        const allItems = [
            {
                key: OperateType.SetUniqueFlag,
                label: (
                    <Tooltip
                        title={
                            attribute.unique
                                ? __('已设置为唯一标识')
                                : usingStandardInfo?.data_type &&
                                  !['char', 'number'].includes(
                                      usingStandardInfo?.data_type || '',
                                  )
                                ? __(
                                      '关联标准不属于字符型或数字型，无法设为唯一标识',
                                  )
                                : ''
                        }
                    >
                        <div className={styles['dropdown-item']}>
                            {__('设为唯一标识')}
                        </div>
                    </Tooltip>
                ),
                disabled: attribute.unique
                    ? true
                    : usingStandardInfo?.data_type
                    ? !['char', 'number'].includes(
                          usingStandardInfo?.data_type || '',
                      )
                    : false,
            },
            {
                key: OperateType.SetClassification,
                label: (
                    <div className={classNames(styles['dropdown-item'])}>
                        {__('设置数据分级')}
                    </div>
                ),
                children: tags,
            },
            {
                key: OperateType.Rename,
                label: (
                    <div className={styles['dropdown-item']}>{__('编辑')}</div>
                ),
            },
            {
                key: OperateType.Delete,
                label: (
                    <div className={styles['dropdown-item']}>{__('删除')}</div>
                ),
            },
        ]

        return isStart
            ? allItems
            : allItems.filter(
                  (item) => item.key !== OperateType.SetClassification,
              )
    }, [attribute.unique, attribute.standard_id, isStart, tags])

    const handleClickMenu = (params) => {
        const { key, keyPath } = params
        if (key === OperateType.Rename) {
            setEditStatus(true)
        }
        if (key === OperateType.Delete) {
            setConfirmOpen(true)
        }
        if (key === OperateType.SetUniqueFlag) {
            setUniqueFlag()
        }
        if (keyPath?.includes(OperateType.SetClassification)) {
            // setSelectedTagId(key)
            // setSelectedTagPath(keyPath)
            const targetTag: IGradeLabel = getTargetTag(originData, key)!
            let standardInfo
            if (attribute.standard_id) {
                standardInfo =
                    attribute.standard_info?.id === attribute.standard_id
                        ? attribute.standard_info
                        : attribute.field_standard_info
            }
            updateAttribute({
                ...attribute,
                label_id: key,
                label_name: targetTag.name,
                label_icon: targetTag.icon,
                standard_id: standardInfo?.label_id
                    ? ''
                    : attribute.standard_id,
            })
            setTags(generateTagItem(originData, key))
        }
    }

    const validate = (val: string) => {
        if (!val) return __('属性名称不能为空')
        // if (!nameReg.test(val)) return ErrorInfo.ONLYSUP
        if (
            attributes.find(
                (attr) => attr.name === val && attr.id !== attribute.id,
            )
        ) {
            return __('属性名称在逻辑实体中重复，请重新输入')
        }
        return ''
    }

    const update = (val: string) => {
        updateAttribute(val)
    }

    return (
        <div className={styles['attribute-item-wrapper']}>
            <Popconfirm
                placement="topLeft"
                title={__('确定要删除吗？')}
                onConfirm={deleteAttribute}
                onCancel={() => setConfirmOpen(false)}
                okText={__('确定')}
                cancelText={__('取消')}
                open={confirmOpen}
                icon={<InfoCircleFilled style={{ color: '#1890FF' }} />}
            >
                {isEdit ? (
                    <div className={styles['input-item']}>
                        <InputWithValidator
                            value={attribute.name}
                            onFinish={update}
                            maxLength={255}
                            validate={validate}
                            onBlur={() => setEditStatus(false)}
                        />
                    </div>
                ) : (
                    <div className={styles['attribute-item']}>
                        <div
                            className={styles['attribute-name']}
                            title={attribute.name}
                        >
                            {attribute.name}
                        </div>
                        <div className={styles.icons}>
                            <StandardDetails
                                attribute={attribute}
                                updateAttribute={updateAttribute}
                                isDetails={isDetails}
                            />
                            {attribute.label_id && attribute.label_name && (
                                <TagDetails attribute={attribute} />
                            )}
                            {attribute.unique && (
                                <UniqueFlagColored
                                    className={styles['unique-flag']}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Popconfirm>
            {!isDetails && (
                <Dropdown
                    menu={{ items, onClick: handleClickMenu }}
                    overlayClassName={styles['attribute-dropdown']}
                >
                    <div className={styles['operate-container']}>
                        <EllipsisOutlined />
                    </div>
                </Dropdown>
            )}
        </div>
    )
}
export default AttributeItem
