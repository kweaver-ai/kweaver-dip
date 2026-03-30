import { InfoCircleFilled } from '@ant-design/icons'
import { Button, Drawer, Dropdown, MenuProps, message, Space } from 'antd'
import classNames from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    formatError,
    getBusinessObjDefine,
    getFormRelatedAttribute,
    ISubjectDomainItem,
    IUpdateFormRelatedAttribute,
    LoginEntity,
    LoginEntityAttribute,
    LoginPlatform,
    PermissionScope,
    RefInfo,
    updateFormRelatedAttribute,
    updateObjsDefine,
} from '@/core'
import { AddOutlined } from '@/icons'
import { Loader, ReturnConfirmModal } from '@/ui'
import Empty from '@/ui/Empty'
import { getPlatformNumber, OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import AddAttributeFromForm from './AddAttributeFromForm'
import AddLogicEntity from './AddLogicEntity'
import AddObjOrActivity from './AddObjOrActivity'
import ChooseBusinessObjs from './ChooseBusinessObjs'
import { ViewModel } from './const'
import __ from './locale'
import ObjList from './ObjList'
import RelateLogicEntityList from './RelateLogicEntityList'
import styles from './styles.module.less'

export interface IObjInfo {
    id: string
    logicalEntities: LoginEntity[]
}
interface IBusinessFormDefineObj {
    open: boolean
    onClose: () => void
    getBusinessFormFields: () => any[]
    formId: string
    formName: string
    mode: ViewModel
}
const BusinessFormDefineObj: React.FC<IBusinessFormDefineObj> = ({
    open,
    onClose,
    getBusinessFormFields,
    formId,
    formName,
    mode,
}) => {
    const [chooseBusinessObjOpen, setChooseBusinessObjOpen] = useState(false)
    // 选中的业务对象
    const [selectedObjId, setSelectedObjId] = useState<string>('')
    // 选择的多个业务对象
    const [selectedObjs, setSelectedObjs] = useState<
        Partial<ISubjectDomainItem>[]
    >([])
    // 保存多个业务对象及对应逻辑实体和属性的信息
    const [objsInfo, setObjsInfo] = useState<IObjInfo[]>([])
    const [isExpand, setIsExpand] = useState(false)
    const [businessFields, setBusinessFields] = useState<any[]>([])
    const [logicalEntities, setLogicalEntities] = useState<any[]>([])
    const [addAttributeOpen, setAddAttributeOpen] = useState(false)
    const [addLogicEntityOpen, setAddLogicEntityOpen] = useState(false)
    const [addObjOrActivityOpen, setAddObjOrActivityOpen] = useState(false)
    const [logicEntityId, setLogicEntityId] = useState('')
    const [refIds, setRefIds] = useState<RefInfo[]>([])
    const [operateType, setOperateType] = useState<OperateType>()
    const [operateEntity, setOperateEntity] = useState<LoginEntity>()
    // 定义业务对象中新建的实体Id集合
    const [newCreateEntityIds, setNewCreateEntityIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const platformNumber = getPlatformNumber()
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

    const currentLogicEntity = useMemo(() => {
        if (!selectedObjId) return []
        return objsInfo.find((obj) => obj.id === selectedObjId)?.logicalEntities
    }, [selectedObjId, objsInfo])

    // 已导入的属性id 与 关联的字段id
    const relatedAndImportFieldIds = useMemo(() => {
        const attrIds: string[] = []
        const fieldIds: string[] = []
        objsInfo.forEach((obj) => {
            obj.logicalEntities.forEach((le) => {
                le.attributes.forEach((attr) => {
                    attrIds.push(attr.id)
                    if (attr.field_id) {
                        fieldIds.push(attr.field_id)
                    }
                })
            })
        })
        return {
            attrIds,
            fieldIds,
        }
    }, [objsInfo])

    // 已关联的字段id
    const relatedFieldIds = useMemo(() => {
        const ids: string[] = []
        objsInfo.forEach((obj) => {
            obj.logicalEntities.forEach((le) => {
                le.attributes.forEach((attr) => {
                    if (attr.field_id) {
                        ids.push(attr.field_id)
                    }
                })
            })
        })
        return ids
    }, [objsInfo])

    // 从业务表中导入属性时 选择的逻辑实体下所有属性名字的数组
    const currentLogicEntityAttrNames = useMemo(() => {
        const logicEntity = objsInfo.find(
            (obj) => obj.id === selectedObjId,
        )?.logicalEntities
        const targetLogicEntity = logicEntity?.find(
            (le) => le.id === logicEntityId,
        )
        return targetLogicEntity?.attributes.map((attr) => attr.name) || []
    }, [logicEntityId, objsInfo, selectedObjId])

    const attributeIds = useMemo(() => {
        const attrIds: string[] = []
        logicalEntities.forEach((le) => {
            le.attributes?.forEach((attr) => attrIds.push(attr.id))
        })
        return attrIds
    }, [logicalEntities])

    const getObjEntity = async (oid: string) => {
        try {
            setLoading(true)
            const res = await getBusinessObjDefine(oid)
            res.logic_entities.forEach((entity) => {
                // eslint-disable-next-line no-param-reassign
                entity.attributes = entity.attributes.map((attr) => {
                    // 选择已有的逻辑实体后，若属性名称与字段名称一致且没有被关联过，则自动关联
                    const targetField = businessFields.find(
                        (f) =>
                            f.name === attr.name &&
                            !relatedFieldIds.includes(f.id),
                    )
                    if (targetField) {
                        return {
                            ...attr,
                            standard_id: attr.standard_info?.id,
                            // field_id: targetField.id,
                            // field_name: targetField.name,
                            field_id: '',
                            field_name: '',
                            field_standard_info: {
                                id: targetField.standard_id,
                            },
                        }
                    }
                    return {
                        ...attr,
                        standard_id: attr.standard_info?.id,
                    }
                })
            })
            setObjsInfo([
                ...objsInfo,
                {
                    id: oid,
                    logicalEntities: res.logic_entities,
                },
            ])
        } catch (error) {
            if (
                error.data.code === 'DataSubject.SubjectDomain.ObjectNotExist'
            ) {
                message.error(
                    platformNumber === LoginPlatform.default
                        ? __('业务对象/活动不存在')
                        : __('业务对象不存在'),
                )
                return
            }
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 获取初始数据
    const getRelateAttrs = async (oid?: string) => {
        try {
            setLoading(true)
            const res = await getFormRelatedAttribute({ fid: formId })
            // 1.生成渲染数据
            setObjsInfo(
                res.subject_infos.map((item) => ({
                    id: item.id,
                    logicalEntities: item.logical_entity.map((entity) => ({
                        ...entity,
                        attributes: entity.attributes.map((attr) => ({
                            ...attr,
                            standard_id: attr.standard_info?.id,
                        })),
                    })),
                })),
            )
            // 2.生成对象列表
            setSelectedObjs(
                res.subject_infos.map((item) => ({
                    ...item,
                    logical_entity: undefined,
                })),
            )
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            setBusinessFields(getBusinessFormFields() || [])
            getRelateAttrs()
        }
    }, [open])

    const getSelectedObj = (obj: ISubjectDomainItem | ISubjectDomainItem[]) => {
        if (Array.isArray(obj)) {
            setSelectedObjs([...obj, ...selectedObjs])
        } else {
            setSelectedObjs([obj, ...selectedObjs])
        }
    }

    const handleSaveValadite = () => {
        const entityNameArr: string[] = []
        let unreleatedFieldAttrNums = 0
        let isExistEmptyLogicEntity = false
        let isExistEmptyAttrs = false
        // 校验属性名称是否都正确
        let isValidateAttrPass = true
        objsInfo.forEach((obj) => {
            if (!obj.logicalEntities || obj.logicalEntities.length === 0) {
                isExistEmptyLogicEntity = true
            }
            obj.logicalEntities.forEach((entity) => {
                if (entity.attributes.length === 0) {
                    isExistEmptyAttrs = true
                }
                const uniqueAttr = entity.attributes.find((attr) => attr.unique)
                if (!uniqueAttr) {
                    entityNameArr.push(entity.name)
                }
                const attrNames: string[] = []
                entity.attributes.forEach((attr) => {
                    if (!attr.name) {
                        isValidateAttrPass = false
                    }
                    attrNames.push(attr.name)
                    if (!attr.field_id) {
                        unreleatedFieldAttrNums += 1
                    }
                })

                if (
                    attrNames.filter(
                        (item, index) => attrNames.indexOf(item) === index,
                    ).length !== attrNames.length
                ) {
                    isValidateAttrPass = false
                }
            })
        })

        if (!isValidateAttrPass) return

        if (isExistEmptyLogicEntity) {
            message.error(__('保存失败，请创建逻辑实体和属性并关联业务表字段'))
            return
        }
        if (isExistEmptyAttrs) {
            message.error(__('保存失败，请先添加逻辑实体属性'))
            return
        }
        // if (entityNameArr.length > 0) {
        //     message.error(
        //         __('请设置逻辑实体${name}中属性的唯一标识', {
        //             name: `【${entityNameArr.join('、')}】`,
        //         }),
        //     )
        //     return
        // }
        if (unreleatedFieldAttrNums > 0) {
            confirm({
                title: __('确认保存吗？'),
                icon: (
                    <InfoCircleFilled
                        style={{ color: 'rgba(24, 144, 255, 1)' }}
                    />
                ),
                content: __('${count}个属性还未关联字段信息', {
                    count: unreleatedFieldAttrNums,
                }),
                onOk: handleSave,
                okText: __('确定'),
                cancelText: __('取消'),
            })
            return
        }
        handleSave()
    }

    const handleSave = async () => {
        const contents = objsInfo.map((obj) => ({
            id: obj.id,
            logic_entities: obj.logicalEntities.map((entity) => {
                return {
                    ...entity,
                    attributes: entity.attributes.map((attr) => {
                        return {
                            id: attr.id,
                            name: attr.name,
                            unique: attr.unique,
                            standard_id: attr.standard_id,
                            label_id: attr.label_id,
                        }
                    }),
                }
            }),
        }))

        const params: IUpdateFormRelatedAttribute = {
            form_id: formId,
            form_relevance_objects: objsInfo.map((obj) => ({
                object_id: obj.id,
                logical_entity: obj.logicalEntities.map((entity) => ({
                    id: entity.id,
                    attributes: entity.attributes.map((attr) => ({
                        id: attr.id,
                        field_id: attr.field_id || '',
                    })),
                })),
            })),
        }

        try {
            await updateObjsDefine({ contents, form_id: formId })
            await updateFormRelatedAttribute(params)
            message.success(__('保存成功'))
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    const handleAddLogicEntityCb = (logicEntity: LoginEntity) => {
        if (operateType === OperateType.CREATE) {
            currentLogicEntity?.unshift({ ...logicEntity, attributes: [] })
            setNewCreateEntityIds([...newCreateEntityIds, logicEntity.id])
        } else {
            const res = currentLogicEntity?.find(
                (entity) => entity.id === logicEntity.id,
            )
            if (res) {
                res.name = logicEntity.name
            }
        }

        setObjsInfo([...objsInfo])
    }

    const handleAddAttrbutes = (attrs: LoginEntityAttribute[]) => {
        const targetLogicEntity = currentLogicEntity?.find(
            (le) => le.id === logicEntityId,
        )
        if (targetLogicEntity) {
            targetLogicEntity.attributes = [
                ...targetLogicEntity.attributes,
                ...attrs.map((attr) => {
                    const isExistRelatedField =
                        targetLogicEntity.attributes.find(
                            (item) =>
                                item.field_id === attr.field_id &&
                                item.id !== attr.id,
                        )
                    return {
                        ...attr,
                        // 当前已有唯一标识，则字段的唯一标识失效，否则使用字段的唯一标识
                        unique: targetLogicEntity.attributes.find(
                            (item) => item.unique && item.id !== attr.id,
                        )
                            ? false
                            : attr.unique,
                        // 属性关联的字段已被其他属性关联，则不会关联，否则关联相同名字的字段
                        field_id: isExistRelatedField ? '' : attr.field_id,
                        field_name: isExistRelatedField ? '' : attr.field_name,
                        field_standard_info: isExistRelatedField
                            ? {}
                            : attr.field_standard_info,
                        standard_id: isExistRelatedField
                            ? ''
                            : attr.standard_id,
                    }
                }),
            ].reduce((acc: LoginEntityAttribute[], cur) => {
                const hasDuplicate = acc.some((item) => item.id === cur.id)
                if (!hasDuplicate) {
                    acc.push(cur)
                }
                return acc
            }, [])

            setObjsInfo([...objsInfo])
        }
    }

    const items: MenuProps['items'] = useMemo(
        () =>
            hasOprAccess
                ? [
                      {
                          key: OperateType.CREATE,
                          label:
                              platformNumber === LoginPlatform.default
                                  ? __('新建业务对象/活动')
                                  : __('新建业务对象'),
                      },
                      {
                          key: OperateType.SELECT,
                          label:
                              platformNumber === LoginPlatform.default
                                  ? __('选择业务对象/活动')
                                  : __('选择业务对象'),
                      },
                  ]
                : [
                      {
                          key: OperateType.SELECT,
                          label:
                              platformNumber === LoginPlatform.default
                                  ? __('选择业务对象/活动')
                                  : __('选择业务对象'),
                      },
                  ],
        [hasOprAccess, platformNumber],
    )

    const handleClickAddObj = ({ key }) => {
        if (key === OperateType.CREATE) {
            setAddObjOrActivityOpen(true)
        } else {
            setChooseBusinessObjOpen(true)
        }
    }

    const getSelectedObjId = (id: string) => {
        setSelectedObjId(id)
        if (!objsInfo.find((o) => o.id === id)) {
            getObjEntity(id)
        }
    }

    const handleDeleteObj = (id: string) => {
        setSelectedObjs(selectedObjs.filter((obj) => obj.id !== id))
        setObjsInfo(objsInfo.filter((obj) => obj.id !== id))
    }

    const handleDeleteLogicEntity = (entityId: string) => {
        const selectedObj = objsInfo.find((obj) => obj.id === selectedObjId)
        if (selectedObj) {
            selectedObj.logicalEntities = selectedObj.logicalEntities.filter(
                (entity) => entity.id !== entityId,
            )
            setObjsInfo([...objsInfo])
        }
    }

    const handleAddLogicEntity = (entity?: LoginEntity) => {
        setAddLogicEntityOpen(true)
        if (entity) {
            setOperateType(OperateType.EDIT)
            setOperateEntity(entity)
        } else {
            setOperateType(OperateType.CREATE)
            setOperateEntity(undefined)
        }
    }

    const handleClose = () => {
        if (objsInfo.length === 0) {
            onClose()
            return
        }
        ReturnConfirmModal({
            onCancel: onClose,
        })
    }

    return (
        <Drawer
            title={
                platformNumber === LoginPlatform.default
                    ? __('定义业务对象/活动')
                    : __('定义业务对象')
            }
            open={open}
            width={800}
            onClose={handleClose}
            maskClosable={mode === ViewModel.ModelView}
            getContainer={false}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            footer={
                mode === ViewModel.ModelView || !selectedObjs.length ? null : (
                    <Space size={12} className={styles.relateObjFooter}>
                        <Button onClick={handleClose}>取消</Button>
                        <Button
                            type="primary"
                            onClick={() => handleSaveValadite()}
                        >
                            保存
                        </Button>
                    </Space>
                )
            }
        >
            <div
                className={classNames(
                    styles['define-obj-wrapper'],
                    !selectedObjs.length && styles['define-obj-empty-wrapper'],
                )}
            >
                {!selectedObjs.length && (
                    <div className={styles.title}>
                        {platformNumber === LoginPlatform.default
                            ? __('业务对象/活动')
                            : __('业务对象')}
                    </div>
                )}
                {loading ? (
                    <Loader />
                ) : selectedObjs.length ? (
                    <>
                        <div className={styles.left}>
                            <div className={styles.top}>
                                <span className={styles['title-name']}>
                                    {platformNumber === LoginPlatform.default
                                        ? __('业务对象/活动')
                                        : __('业务对象')}
                                </span>
                                {mode !== ViewModel.ModelView && (
                                    <Dropdown
                                        menu={{
                                            items,
                                            onClick: handleClickAddObj,
                                        }}
                                    >
                                        <div
                                            className={
                                                styles['add-icon-container']
                                            }
                                        >
                                            <AddOutlined
                                                className={styles['add-icon']}
                                            />
                                        </div>
                                    </Dropdown>
                                )}
                            </div>
                            <ObjList
                                objList={selectedObjs as ISubjectDomainItem[]}
                                getSelectedId={getSelectedObjId}
                                deleteItemCb={handleDeleteObj}
                                isDetails={mode === ViewModel.ModelView}
                                formId={formId}
                            />
                        </div>
                        <div className={styles.right}>
                            <RelateLogicEntityList
                                objId={selectedObjId}
                                entityList={currentLogicEntity!}
                                getBusinessFormFields={getBusinessFormFields}
                                updateLogicEntity={() =>
                                    setObjsInfo([...objsInfo])
                                }
                                addLogicEntity={handleAddLogicEntity}
                                addAttribute={(entityId) => {
                                    setAddAttributeOpen(true)
                                    setLogicEntityId(entityId)
                                }}
                                deleteLogicEntity={handleDeleteLogicEntity}
                                newCreateEntityIds={newCreateEntityIds}
                                isDetail={mode === ViewModel.ModelView}
                                relatedFieldIds={relatedFieldIds}
                                formId={formId}
                                formName={formName}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles['empty-wrapper']}>
                        <Empty
                            iconSrc={dataEmpty}
                            desc={
                                mode === ViewModel.ModelView
                                    ? __('暂无数据')
                                    : platformNumber === LoginPlatform.default
                                    ? hasOprAccess
                                        ? __(
                                              '点击下方按钮新建或选择业务对象/活动',
                                          )
                                        : __('点击下方按钮选择业务对象/活动')
                                    : hasOprAccess
                                    ? __('点击下方按钮新建或选择业务对象')
                                    : __('点击下方按钮选择业务对象')
                            }
                        />
                        {mode !== ViewModel.ModelView && (
                            <Space size={8} className={styles['empty-operate']}>
                                {hasOprAccess && (
                                    <Button
                                        type="primary"
                                        icon={<AddOutlined />}
                                        onClick={() =>
                                            setAddObjOrActivityOpen(true)
                                        }
                                    >
                                        {__('新建')}
                                    </Button>
                                )}
                                <Button
                                    onClick={() =>
                                        setChooseBusinessObjOpen(true)
                                    }
                                    // disabled={mode === ViewModel.ModelView}
                                >
                                    {__('选择')}
                                </Button>
                            </Space>
                        )}
                    </div>
                )}

                <ChooseBusinessObjs
                    open={chooseBusinessObjOpen}
                    onClose={() => setChooseBusinessObjOpen(false)}
                    getSelectedObj={getSelectedObj}
                    selectedIds={selectedObjs.map((obj) => obj.id || '')}
                    addObj={() => setAddObjOrActivityOpen(true)}
                />
                <AddAttributeFromForm
                    open={addAttributeOpen}
                    onClose={() => setAddAttributeOpen(false)}
                    getBusinessFormFields={getBusinessFormFields}
                    onSuccess={handleAddAttrbutes}
                    attributeIds={relatedAndImportFieldIds.attrIds}
                    fieldIds={relatedAndImportFieldIds.fieldIds}
                    existAttrNames={currentLogicEntityAttrNames}
                />
                <AddLogicEntity
                    open={addLogicEntityOpen}
                    onClose={() => setAddLogicEntityOpen(false)}
                    onSuccess={handleAddLogicEntityCb}
                    formName={formName}
                    operateType={operateType}
                    editEntity={operateEntity}
                    allLogicEntity={currentLogicEntity}
                />
                <AddObjOrActivity
                    open={addObjOrActivityOpen}
                    onClose={() => setAddObjOrActivityOpen(false)}
                    onSuccess={getSelectedObj}
                />
            </div>
        </Drawer>
    )
}
export default BusinessFormDefineObj
