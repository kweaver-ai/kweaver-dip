import {
    CaretDownOutlined,
    CaretRightOutlined,
    InfoCircleFilled,
} from '@ant-design/icons'
import { useSize } from 'ahooks'
import {
    Button,
    Dropdown,
    MenuProps,
    message,
    Select,
    Space,
    Tooltip,
} from 'antd'
import classNames from 'classnames'
import { trim } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import emptyData from '@/assets/dataEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    formatError,
    formsQueryStandardItem,
    getBusinessRecList,
    getDataGradeLabel,
    IGradeLabel,
    LoginEntity,
    LoginEntityAttribute,
    PermissionScope,
    StandardInfo,
} from '@/core'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import {
    AddOutlined,
    AttributeOutlined,
    EllipsisOutlined,
    LimitFieldlined,
    LogicEntityColored,
} from '@/icons'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Confirm from '../Confirm'
import { getFieldTypeEelment } from '../DatasheetView/helper'
import AttributeItem from './AttributeItem'
import __ from './locale'
import styles from './styles.module.less'

interface IRelateLogicEntityList {
    objId: string
    entityList: LoginEntity[]
    getBusinessFormFields: () => any[]
    updateLogicEntity: () => void
    addLogicEntity: (entity?: LoginEntity) => void
    addAttribute: (entityId: string) => void
    deleteLogicEntity: (entityId: string) => void
    newCreateEntityIds: string[]
    isDetail?: boolean
    relatedFieldIds: string[]
    formId: string
    formName: string
}
const RelateLogicEntityList: React.FC<IRelateLogicEntityList> = ({
    objId,
    entityList,
    getBusinessFormFields,
    updateLogicEntity,
    addLogicEntity,
    addAttribute,
    deleteLogicEntity,
    newCreateEntityIds,
    isDetail = false,
    relatedFieldIds = [],
    formId,
    formName,
}) => {
    const [searchValue, setSearchValue] = useState('')
    const [searchAttrValue, setSearchAttrValue] = useState('')
    const [searchAttrId, setSearchAttrId] = useState('')
    const [foldEntityIds, setFoldEntityIds] = useState<string[]>([])
    const [editingAttrs, setEditingAttrs] = useState<string[]>([])
    const [businessFields, setBusinessFields] = useState<any[]>([])
    const [deleteEntity, setDeleteEntity] = useState<LoginEntity>()
    const [deleteEntityOpen, setDeleteEntityOpen] = useState<boolean>()
    const entityRef = useRef<any>()
    const size = useSize(entityRef)
    const [isStart] = useGradeLabelState()
    const [tags, setTags] = useState<IGradeLabel[]>([])
    const { checkPermission } = useUserPermCtx()

    const hasOprAccess = useMemo(
        () =>
            checkPermission([
                {
                    key: 'manageDataClassification',
                    scope: PermissionScope.All,
                },
            ]),
        [checkPermission],
    )

    const getClassificationTag = async () => {
        try {
            const res = await getDataGradeLabel({ keyword: '' })
            setTags(res.entries)
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        getClassificationTag()
    }, [isStart])

    useEffect(() => {
        setBusinessFields(getBusinessFormFields() || [])
    }, [])

    // 获取全部对象下全部逻辑实体下已选的字段及禁用状态
    const getBusinessFields = (attrId: string, entityId: string) => {
        const entity = entityList.find((en) => en.id === entityId)!
        const targetAttr = entity.attributes.find((attr) => attr.id === attrId)!
        return businessFields.map((f) => {
            if (
                relatedFieldIds.includes(f.id) &&
                f.id !== targetAttr.field_id
            ) {
                return { disabled: true, ...f }
            }
            return f
        })
    }

    const filterSearchValue = (inputValue: string, option, fields) => {
        const res = fields!
            .filter((info) => info.name?.includes(trim(inputValue)))
            .filter((info) => info.id === option?.value)
        return res.length > 0
    }

    const onEditAttr = (
        value: string | LoginEntityAttribute,
        attrId: string,
        pId: string,
    ) => {
        // 改原数据
        const targetLogicEntity: LoginEntity = entityList.find(
            (l) => l.id === pId,
        )!

        if (typeof value === 'string') {
            const targetAttr = targetLogicEntity.attributes.find(
                (a) => a.id === attrId,
            )
            if (targetAttr) {
                targetAttr.name = value
                // 重新渲染
            }
        } else {
            targetLogicEntity.attributes = targetLogicEntity.attributes.map(
                (attr) => {
                    if (attr.id === attrId) {
                        return { ...value }
                    }
                    return attr
                },
            )
        }
        updateLogicEntity()
    }

    const handleFold = (id: string) => {
        setFoldEntityIds([...foldEntityIds, id])
    }

    const handleUnfold = (id: string) => {
        setFoldEntityIds(foldEntityIds.filter((eid) => eid !== id))
    }

    const deleteAttribute = (entityId: string, attrId: string) => {
        const targetLogicEntity: LoginEntity = entityList.find(
            (l) => l.id === entityId,
        )!
        targetLogicEntity.attributes = targetLogicEntity.attributes.filter(
            (a) => a.id !== attrId,
        )
        updateLogicEntity()
        message.success(__('删除成功'))
    }

    const handleDeleteEntity = () => {
        if (deleteEntity?.id) {
            deleteLogicEntity(deleteEntity?.id)
        }
        setDeleteEntityOpen(false)
        message.success(__('删除成功'))
    }

    const handleCancelDeleteEntity = () => {
        setDeleteEntity(undefined)
        setDeleteEntityOpen(false)
    }

    const handleSetEditStatus = (isEdit: boolean, attrId: string) => {
        if (isEdit) {
            setEditingAttrs([...editingAttrs, attrId])
        } else {
            setEditingAttrs(editingAttrs.filter((item) => item !== attrId))
        }
    }

    const items: MenuProps['items'] = useMemo(() => {
        return [
            {
                key: OperateType.EDIT,
                label: __('编辑'),
            },
            {
                key: OperateType.DELETE,
                label: (
                    <Tooltip
                        title={
                            trim(searchValue) ? __('搜索结果状态不能删除') : ''
                        }
                    >
                        {__('删除')}
                    </Tooltip>
                ),
                disabled: !!trim(searchValue),
            },
        ]
    }, [searchValue])

    const handleClickMenu = ({ key }, entity: LoginEntity) => {
        if (key === OperateType.EDIT) {
            addLogicEntity(entity)
            setSearchValue('')
        }
        if (key === OperateType.DELETE) {
            setDeleteEntity(entity)
            setDeleteEntityOpen(true)
        }
    }

    const handleSetUniqueFlag = (
        curAttr: LoginEntityAttribute,
        attrs: LoginEntityAttribute[],
        logicEntityId: string,
    ) => {
        const existUniqueAttr = attrs.find((attr) => attr.unique)
        const targetLogicEntity: LoginEntity = entityList.find(
            (l) => l.id === logicEntityId,
        )!
        const targetCurAttr = targetLogicEntity.attributes.find(
            (a) => a.id === curAttr.id,
        )!
        if (existUniqueAttr) {
            confirm({
                title: __('确认要替换吗？'),
                icon: (
                    <InfoCircleFilled
                        style={{ color: 'rgba(250, 173, 20, 1)' }}
                    />
                ),
                content: __(
                    '属性「${name1}」已被设置为唯一标识属性，是否替换为「${name2}」？',
                    {
                        name1: existUniqueAttr.name,
                        name2: curAttr.name,
                    },
                ),
                onOk: () => {
                    const targetAttr = targetLogicEntity.attributes.find(
                        (a) => a.id === existUniqueAttr.id,
                    )!
                    targetCurAttr.unique = true
                    targetAttr.unique = false
                    updateLogicEntity()
                },
                // onCancel() {},
                okText: __('确定'),
                cancelText: __('取消'),
            })
        } else {
            targetCurAttr.unique = true
            updateLogicEntity()
        }
    }

    // 选择字段变化回调
    const handleFieldChange = async (
        e: string,
        entity: LoginEntity,
        fields,
        index: number,
    ) => {
        // 根据选择的字段是否有标准id 查询标准详情 确定标准类型 再根据类型确定是否可设为唯一标识
        const res = entityList.find((en) => en.id === entity.id)
        const field = fields.find((f) => f.id === e)!
        let fieldStandardInfo: StandardInfo = {
            data_type: '',
            id: '',
            name: '',
            name_en: '',
        }
        if (field && field.standard_id) {
            const fieldStandRes = await formsQueryStandardItem({
                id: field.standard_id,
            })
            fieldStandardInfo = { ...fieldStandRes, is_field_standard: true }
        }

        if (res && res.attributes[index]) {
            const currentAttr = res.attributes[index]
            if (e) {
                if (
                    field &&
                    field.standard_id &&
                    !(
                        currentAttr.unique &&
                        !['number', 'char'].includes(
                            fieldStandardInfo.data_type,
                        )
                    )
                ) {
                    // 当前正在使用的标准信息  standard_id记录正在使用标准的id standard_info和field_standard_info 为可选的两个标准
                    const usingStandardInfo: Partial<StandardInfo> | undefined =
                        !currentAttr.standard_id
                            ? undefined
                            : currentAttr.standard_id ===
                              currentAttr?.standard_info?.id
                            ? currentAttr.standard_info
                            : currentAttr.field_standard_info!
                    const standardInfo: any = usingStandardInfo
                        ? {
                              standard_id: usingStandardInfo.id,
                              standard_info: usingStandardInfo,
                              field_standard_info: fieldStandardInfo,
                          }
                        : // 没有正在使用的标准 但是有standard_info 将字段标准设为新查询的字段标准
                        currentAttr?.standard_info?.id
                        ? {
                              standard_id: fieldStandardInfo.id,
                              standard_info: currentAttr?.standard_info,
                              field_standard_info: fieldStandardInfo,
                          }
                        : // 没有正在使用的标准 但是有field_standard_info 将standard_info设为新查询的字段标准
                        currentAttr?.field_standard_info?.id
                        ? {
                              standard_id: fieldStandardInfo.id,
                              standard_info: fieldStandardInfo,
                              field_standard_info:
                                  currentAttr?.field_standard_info,
                          }
                        : // 完全没有标准信息时，将新查出来的字段标准应用(若属性为唯一标识，标准的属性需要为数字或字符型)
                          {
                              standard_id:
                                  currentAttr.unique &&
                                  !['char', 'number'].includes(
                                      fieldStandardInfo.data_type,
                                  )
                                      ? ''
                                      : fieldStandardInfo.id,
                              standard_info: fieldStandardInfo,
                              field_standard_info: undefined,
                          }
                    res.attributes[index] = {
                        ...currentAttr,
                        field_id: e,
                        field_name: field.name,
                        ...standardInfo,
                    }
                } else {
                    res.attributes[index] = {
                        ...currentAttr,
                        field_id: e,
                        field_name: field.name,
                    }
                }
            } else {
                res.attributes[index] = {
                    ...currentAttr,
                    field_id: '',
                    field_name: undefined,
                }
            }

            updateLogicEntity()
        }
    }

    const getEntityItem = (entity: LoginEntity) => {
        const isExistSearchAttr = entity.attributes.find((attr) =>
            attr.name
                .toLocaleLowerCase()
                .includes(trim(searchValue).toLocaleLowerCase()),
        )
        return !isExistSearchAttr && trim(searchValue) ? null : (
            <div key={entity.id} className={classNames(styles.entityWrapper)}>
                <div className={styles.entityTitle}>
                    <div className={styles['entity-title-left']}>
                        {foldEntityIds.includes(entity.id) ? (
                            <CaretRightOutlined
                                className={styles['arrow-icon']}
                                onClick={() => handleUnfold(entity.id)}
                            />
                        ) : (
                            <CaretDownOutlined
                                className={styles['arrow-icon']}
                                onClick={() => handleFold(entity.id)}
                            />
                        )}
                        <LogicEntityColored className={styles.entityIcon} />
                        <div
                            title={`${__('逻辑实体')}${__('：')} ${
                                entity.name
                            }`}
                            className={styles.entityName}
                        >
                            {entity.name}
                        </div>
                        <div className={styles['relate-info']}>
                            {__('（已关联：${rate}）', {
                                rate: `${
                                    entity.attributes.filter(
                                        (attr) => attr.field_id,
                                    ).length
                                }/${entity.attributes.length}`,
                            })}
                        </div>
                    </div>
                    {!isDetail && hasOprAccess && (
                        <div className={styles['operate-container']}>
                            <Tooltip
                                title={__('从业务表中添加属性')}
                                placement="bottomLeft"
                                getPopupContainer={(node) =>
                                    node.parentElement as HTMLElement
                                }
                            >
                                <div
                                    className={styles.btnContainer}
                                    onClick={() => {
                                        addAttribute(entity.id)
                                        setSearchValue('')
                                    }}
                                >
                                    <AddOutlined />
                                </div>
                            </Tooltip>
                            {newCreateEntityIds.includes(entity.id) && (
                                <Dropdown
                                    menu={{
                                        items,
                                        onClick: (e) =>
                                            handleClickMenu(e, entity),
                                    }}
                                    overlayStyle={{ width: 158 }}
                                >
                                    <div className={styles.btnContainer}>
                                        <EllipsisOutlined />
                                    </div>
                                </Dropdown>
                            )}
                        </div>
                    )}
                </div>
                {entity.attributes?.length > 0 ? (
                    <div
                        className={classNames(
                            styles.attributeWrapper,
                            foldEntityIds.includes(entity.id) &&
                                styles.attributeWrapperFold,
                        )}
                    >
                        <div className={styles.titleWrapper}>
                            <div className={styles.attributeTitle}>
                                <AttributeOutlined
                                    className={styles.attributeIcon}
                                />
                                {__('属性名称')}
                            </div>
                            <div
                                className={classNames(
                                    styles.attributeTitle,
                                    (isDetail || !hasOprAccess) &&
                                        styles.attributeTitleDetails,
                                )}
                            >
                                <LimitFieldlined className={styles.fieldIcon} />
                                {__('关联字段')}
                            </div>
                        </div>
                        {entity.attributes.map((attribute, index) => {
                            const fields = getBusinessFields(
                                attribute.id,
                                entity.id,
                            )
                            const isEdit = !!editingAttrs.find(
                                (attrId) => attrId === attribute.id,
                            )

                            return attribute.name
                                .toLocaleLowerCase()
                                .includes(
                                    trim(searchValue).toLocaleLowerCase(),
                                ) ? (
                                <div
                                    className={styles.attributeItem}
                                    key={attribute.id}
                                >
                                    <AttributeItem
                                        attributes={entity.attributes}
                                        attribute={attribute}
                                        isEdit={isEdit}
                                        setEditStatus={(val) =>
                                            handleSetEditStatus(
                                                val,
                                                attribute.id,
                                            )
                                        }
                                        updateAttribute={(
                                            val: string | LoginEntityAttribute,
                                        ) =>
                                            onEditAttr(
                                                val,
                                                attribute.id,
                                                entity.id,
                                            )
                                        }
                                        deleteAttribute={() =>
                                            deleteAttribute(
                                                entity.id,
                                                attribute.id,
                                            )
                                        }
                                        setUniqueFlag={() =>
                                            handleSetUniqueFlag(
                                                attribute,
                                                entity.attributes,
                                                entity.id,
                                            )
                                        }
                                        isDetails={isDetail || !hasOprAccess}
                                        gradeLabels={tags}
                                    />
                                    <div
                                        className={classNames(
                                            styles['connect-line'],
                                            (isDetail || !hasOprAccess) &&
                                                styles['connect-line-details'],
                                        )}
                                    />
                                    <Select
                                        disabled={isDetail}
                                        placeholder={__('请选择')}
                                        className={styles.fieldsInput}
                                        value={attribute.field_id || undefined}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                e,
                                                entity,
                                                fields,
                                                index,
                                            )
                                        }
                                        notFoundContent={
                                            fields?.length > 0
                                                ? __('未找到匹配的结果')
                                                : __('暂无数据')
                                        }
                                        showSearch
                                        filterOption={(input, option) =>
                                            filterSearchValue(
                                                input,
                                                option,
                                                fields,
                                            )
                                        }
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        allowClear
                                        searchValue={
                                            searchAttrId === attribute.id
                                                ? searchAttrValue
                                                : ''
                                        }
                                        onSearch={(val) => {
                                            if (trim(val).length < 129) {
                                                setSearchAttrValue(val)
                                                setSearchAttrId(attribute.id)
                                            }
                                        }}
                                    >
                                        {fields?.map((field) => (
                                            <Select.Option
                                                key={field.id}
                                                value={field.id}
                                                disabled={field.disabled}
                                            >
                                                <div
                                                    className={
                                                        styles.optionItemWrapper
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.optionItem
                                                        }
                                                    >
                                                        {/* <Icons
                                                            type={
                                                                field.data_type
                                                            }
                                                        /> */}
                                                        <span
                                                            style={{
                                                                marginRight: 4,
                                                            }}
                                                        >
                                                            {getFieldTypeEelment(
                                                                {
                                                                    ...field,
                                                                    type: field.data_type,
                                                                },
                                                                16,
                                                            )}
                                                        </span>

                                                        <div
                                                            className={
                                                                styles.optionName
                                                            }
                                                            title={field.name}
                                                        >
                                                            {field.name}
                                                        </div>
                                                    </div>
                                                    {field.disabled && (
                                                        <div
                                                            className={
                                                                styles[
                                                                    'related-tag'
                                                                ]
                                                            }
                                                        >
                                                            {__('已关联')}
                                                        </div>
                                                    )}
                                                </div>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>
                            ) : null
                        })}
                    </div>
                ) : foldEntityIds.includes(entity.id) &&
                  styles.attributeWrapperFold ? null : (
                    <Empty
                        iconSrc={emptyData}
                        desc={
                            <div className={styles.emptyDesc}>
                                <div>{__('暂无数据')}</div>
                                <div>{__('请先添加逻辑实体属性')}</div>
                            </div>
                        }
                    />
                )}
            </div>
        )
    }

    const handleRecommend = async () => {
        const subjects: {
            subject_id: string
            subject_name: string
            path?: string
        }[] = []
        entityList.forEach((entity) =>
            entity.attributes.forEach((attr) => {
                subjects.push({
                    subject_id: attr.id,
                    subject_name: attr.name,
                    path: attr.path,
                })
            }),
        )
        const res = await getBusinessRecList({
            query: [
                {
                    fields: businessFields.map((f) => ({
                        field_desc: f.description,
                        field_id: f.id,
                        field_name: f.name,
                        standard_id: f.standard_id,
                    })),
                    subjects,
                    table_id: formId,
                    table_name: formName,
                },
            ],
        })

        const resItem = res.items.find((item) => item.table_name === formName)
        if (resItem && Array.isArray(resItem.rec) && resItem.rec.length > 0) {
            for (let i = 0; i < entityList.length; i += 1) {
                const entity = entityList[i]
                entity.attributes = entity.attributes.map((attr) => {
                    const rec = resItem.rec.find(
                        (r) => r.subject_id === attr.id,
                    )
                    return {
                        ...attr,
                        field_id: rec?.field_id || attr.field_id,
                        field_name: rec?.field_name || attr.field_name,
                    }
                })
            }

            updateLogicEntity()
            message.success(
                __('成功匹配到${count}个字段', {
                    count: resItem.rec.length,
                }),
            )
        } else {
            message.error(__('未匹配到关联字段'))
        }
    }

    return (
        <div className={styles['logic-entity-wrapper']}>
            <div className={styles['entity-title']}>
                {__('关联逻辑实体属性')}
            </div>
            <div className={styles['entity-operate']}>
                {isDetail ? (
                    <div />
                ) : (
                    <Space size={8}>
                        {hasOprAccess && (
                            <Button
                                onClick={() => {
                                    addLogicEntity()
                                    setSearchValue('')
                                }}
                            >
                                + {__('添加逻辑实体')}
                            </Button>
                        )}
                        <Tooltip title={__('自动匹配属性关联字段')}>
                            <Button onClick={handleRecommend}>
                                + {__('智能匹配')}
                            </Button>
                        </Tooltip>
                    </Space>
                )}
                <div className={styles['search-input']}>
                    <SearchInput
                        placeholder={__('搜索逻辑实体属性')}
                        value={searchValue}
                        onKeyChange={(value: string) => setSearchValue(value)}
                        maxLength={128}
                    />
                </div>
            </div>
            {entityList?.length > 0 ? (
                <>
                    <div className={styles.entitiesWrapper} ref={entityRef}>
                        {entityList.map((entity) => getEntityItem(entity))}
                    </div>
                    {size?.height === 0 && (
                        <div className={styles['empty-wrapper']}>
                            <Empty />
                        </div>
                    )}
                </>
            ) : (
                <div className={styles['empty-wrapper']}>
                    <Empty
                        iconSrc={emptyData}
                        desc={
                            <div className={styles['empty-desc']}>
                                <div>{__('暂无数据')}</div>
                                <div>{__('请先添加逻辑实体')}</div>
                            </div>
                        }
                    />
                </div>
            )}
            <Confirm
                title={__('确认要删除逻辑实体吗？')}
                content={
                    deleteEntity?.attributes?.length
                        ? __(
                              '删除后，「${name}」逻辑实体中的${count}个属性将一并删除。',
                              {
                                  name: deleteEntity?.name,
                                  count: deleteEntity?.attributes?.length,
                              },
                          )
                        : __('删除后无法恢复，请谨慎操作。')
                }
                open={deleteEntityOpen}
                onOk={handleDeleteEntity}
                onCancel={handleCancelDeleteEntity}
            />
        </div>
    )
}
export default RelateLogicEntityList
