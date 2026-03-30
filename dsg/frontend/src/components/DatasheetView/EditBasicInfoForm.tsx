import { Col, Form, Input, Button, Select, Row } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import calssnames from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    clone,
    keysIn,
    trim,
    isArray,
    isEmpty,
    head,
    isObject,
    has,
    map,
} from 'lodash'
import { useSize } from 'ahooks'
import { IEditFormData, sourceSignOpions } from './const'
import __ from './locale'
import { AvatarOutlined } from '@/icons'
import styles from './styles.module.less'
import DataOwnerCompositeComponent from '../DataOwnerCompositeComponent'
import { CombinedComponentType } from '../DataOwnerCompositeComponent/const'
import {
    LogicViewType,
    formatError,
    getDataViewRepeat,
    getDataBaseDetails,
    getMainDepartInfo,
    searchUserDepart,
} from '@/core'
import { cancelRequest, lowercaseEnNumNameReg } from '@/utils'
import { useDataViewContext } from './DataViewProvider'
import ChooseOwnerModal from '../ChooseOwnerModal'
import {
    openTypeList,
    shareTypeList,
    updateCycleOptions,
} from '../ResourcesDir/const'

const { TextArea } = Input

interface IEditFormDatas extends IEditFormData {
    subject_type?: string
}

interface IEditBasicInfoForm {
    form: FormInstance<any>
    onFinish?: (values) => void
    onDataChange?: () => void
    type?: 'modal' | 'view'
    logic: LogicViewType
}

const EditBasicInfoForm: React.FC<IEditBasicInfoForm> = ({
    form,
    onFinish,
    type = 'modal',
    onDataChange,
    logic,
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const size = useSize(ref)
    const nameRef = useRef<HTMLDivElement | null>(null)
    const nameSize = useSize(nameRef)
    const { datasheetInfo, setDatasheetInfo, isValueEvaluation } =
        useDataViewContext()
    const [subjectId, setSubjectId] = useState<any>()
    const [departmentId, setDepartmentId] = useState<any>()
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [chooseOwnerModalOpen, setChooseOwnerModalOpen] = useState(false)
    const [members, setMembers] = useState<any[]>([])

    const datasourceView = useMemo(
        () =>
            ![LogicViewType.Custom, LogicViewType.LogicEntity].includes(logic),
        [logic],
    )

    useEffect(() => {
        if (datasheetInfo) {
            const obj = clone(datasheetInfo)
            const newObj: any[] = []
            keysIn(obj).forEach((k) => {
                let fieldValue = obj[k] || undefined

                // 处理 owners 字段的两种格式，确保使用是owner_id组成的字符串数组
                if (k === 'owners' && isArray(obj[k]) && !isEmpty(obj[k])) {
                    const firstOwner = head(obj[k])
                    if (isObject(firstOwner) && has(firstOwner, 'owner_id')) {
                        fieldValue = map(obj[k], 'owner_id')
                        const list = obj[k].map((o) => ({
                            ...o,
                            id: o?.owner_id || o?.id,
                            name: o?.owner_name || o?.name,
                        }))
                        validateOwner(list)
                    }
                }

                if (['department_id', 'owner_id', 'subject_id'].includes(k)) {
                    newObj.push({
                        name: k,
                        value: fieldValue,
                        errors: datasheetInfo[`${k}_tips`]
                            ? [datasheetInfo[`${k}_tips`]]
                            : [],
                    })
                } else {
                    newObj.push({
                        name: k,
                        value: fieldValue,
                    })
                }
            })
            form.setFields(newObj)
        }
    }, [datasheetInfo])

    useEffect(() => {
        if (datasheetInfo) {
            if (!isChanged) {
                setSubjectId(datasheetInfo.subject_id)
                if (datasheetInfo.department_id) {
                    setDepartmentId(datasheetInfo.department_id)
                } else if (datasheetInfo.datasource_department_id) {
                    // setDepartmentId(datasheetInfo.datasource_department_id)
                    queryMainDepartInfo()
                }
            }
        }
    }, [datasheetInfo, isChanged])

    // 校验重名
    const validateNameRepeat = async (
        name: string,
        flag: 'business_name' | 'technical_name',
    ): Promise<void> => {
        try {
            cancelRequest(`/api/data-view/v1/form-view/repeat`, 'get')
            const res = await getDataViewRepeat({
                name,
                form_id: datasheetInfo?.id,
                datasource_id: datasheetInfo?.datasource_id,
                name_type: flag,
                type: logic,
            })
            const values = form.getFieldsValue()
            setDatasheetInfo((prev) => ({
                ...prev,
                ...values,
                business_name_tips:
                    JSON.stringify(values) === '{}'
                        ? ''
                        : flag === 'business_name' && res
                        ? __('业务名称和其他库表重复，请修改')
                        : '',
                technical_name_tips:
                    JSON.stringify(values) === '{}'
                        ? ''
                        : flag === 'technical_name' && res
                        ? __('技术名称和其他库表重复，请修改')
                        : '',
            }))
            return !res
                ? Promise.resolve()
                : Promise.reject(
                      new Error(
                          flag === 'business_name'
                              ? __('业务名称和其他库表重复，请修改')
                              : __('技术名称和其他库表重复，请修改'),
                      ),
                  )
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    const checkWidth = (
        refValue: React.RefObject<HTMLDivElement>,
        flag: 'input' | 'div',
    ) => {
        let res = false
        if (refValue.current) {
            const inputElement: any =
                flag === 'input'
                    ? refValue.current.getElementsByTagName('input')[0]
                    : refValue.current.children[0]
            const inputWidth = inputElement.clientWidth
            const text =
                flag === 'input' ? inputElement.value : inputElement.textContent
            const newLi = document.createElement('span')
            newLi.innerText = text || ''
            document.querySelector('body')?.appendChild(newLi)
            const textWidth = newLi.getBoundingClientRect().width
            if (textWidth > inputWidth) {
                res = true
            } else {
                res = false
            }
            newLi?.remove()
        }
        return res
    }

    // const showNameTip = useMemo(() => checkWidth(nameRef, 'input'), [nameSize])

    const queryMainDepartInfo = async () => {
        try {
            let department_id: string = ''
            if (datasheetInfo.datasource_department_id) {
                department_id = datasheetInfo.datasource_department_id
            } else {
                const res = await getMainDepartInfo()
                department_id = res?.id || ''
            }

            setDatasheetInfo?.((prev) => ({
                ...prev,
                department_id,
            }))
            setDepartmentId(department_id)
        } catch (e) {
            formatError(e)
        }
    }
    const validateOwner = async (list: any[]) => {
        if (!datasheetInfo?.owners?.length) {
            return
        }
        try {
            const allOwners = (
                await Promise.all(
                    list?.map((item) =>
                        searchUserDepart({ keyword: item.name }),
                    ),
                )
            )?.flat()
            const owners = list.filter((item) =>
                allOwners?.map((o) => o.id).includes(item.owner_id),
            )
            setDatasheetInfo((prev) => ({
                ...prev,
                owners: owners.map((o) => o.id),
            }))
            setMembers(owners)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.editBasicInBox} ref={ref}>
            <Form
                autoComplete="off"
                onFinish={onFinish}
                form={form}
                layout={type === 'modal' ? 'vertical' : 'horizontal'}
                onValuesChange={(_, values) => {
                    onDataChange?.()
                    const errorObj: any = {}
                    if (values.department_id) {
                        errorObj.department_id_tips = ''
                    }
                    if (values.owners) {
                        errorObj.owner_id_tips = ''
                    }
                    if (values.subject_id) {
                        errorObj.subject_id_tips = ''
                    }
                    setDatasheetInfo?.((prev) => ({
                        ...prev,
                        ...values,
                        ...errorObj,
                        business_name_tips: values.business_name
                            ? prev?.business_name_tips
                            : __('库表业务名称不能为空'),
                        technical_name_tips: values.technical_name
                            ? prev?.technical_name_tips
                            : __('库表技术名称不能为空'),
                    }))
                    setIsChanged(true)
                }}
            >
                <Row
                    className={calssnames(
                        styles.baseInfoRow,
                        type === 'view' && styles.baseInfoRowView,
                        datasourceView && styles.datasourceBaseInfoRowView,
                    )}
                >
                    <Col span={type === 'modal' ? 12 : 24}>
                        <Form.Item
                            label={__('库表业务名称')}
                            name="business_name"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: true,
                                    message: __('库表业务名称不能为空'),
                                },
                                {
                                    validateTrigger: ['onBlur'],
                                    validator: (e, value) =>
                                        validateNameRepeat(
                                            value,
                                            'business_name',
                                        ),
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入库表业务名称')}
                                maxLength={255}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={type === 'modal' ? 12 : 24}>
                        <Form.Item label={__('编码')} name="code">
                            {datasheetInfo?.uniform_catalog_code}
                        </Form.Item>
                    </Col>
                    <Col span={type === 'modal' ? 12 : 24} ref={nameRef}>
                        <Form.Item
                            label={__('库表技术名称')}
                            name="technical_name"
                            // validateFirst
                            // validateTrigger={['onChange', 'onBlur']}
                            // rules={[
                            //     {
                            //         required: !datasourceView,
                            //         message: __('库表技术名称不能为空'),
                            //     },
                            //     {
                            //         validateTrigger: ['onChange', 'onBlur'],
                            //         pattern: datasourceView
                            //             ? undefined
                            //             : lowercaseEnNumNameReg,
                            //         message: __(
                            //             '仅支持小写字母、数字及下划线，且不能以数字开头',
                            //         ),
                            //         transform: (value) => trim(value),
                            //     },
                            //     {
                            //         validateTrigger: ['onBlur'],
                            //         validator: datasourceView
                            //             ? undefined
                            //             : (e, value) =>
                            //                   validateNameRepeat(
                            //                       value,
                            //                       'technical_name',
                            //                   ),
                            //     },
                            // ]}
                            style={{ marginBottom: type === 'modal' ? 0 : 24 }}
                        >
                            {datasheetInfo?.technical_name}
                            {/* <Input
                                placeholder={
                                    datasourceView
                                        ? ''
                                        : __('请输入库表技术名称')
                                }
                                disabled={datasourceView}
                                maxLength={100}
                                title={
                                    datasourceView
                                        ? showNameTip
                                            ? datasheetInfo?.technical_name
                                            : __('元数据库表不能调整技术名称')
                                        : undefined
                                }
                            /> */}
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={__('描述')}
                            name="description"
                            style={{
                                marginBottom: type === 'modal' ? 24 : 48,
                            }}
                        >
                            <TextArea
                                placeholder={__('请输入库表描述')}
                                maxLength={1000}
                                showCount
                                autoSize={
                                    type === 'modal'
                                        ? true
                                        : { minRows: 5, maxRows: 5 }
                                }
                                className={styles.textArea}
                            />
                        </Form.Item>
                    </Col>
                    {/* {!isValueEvaluation && (
                        <Col span={24}>
                            <Form.Item
                                label={__('来源标识')}
                                name="source_sign"
                                style={{
                                    marginBottom: type === 'modal' ? 24 : 48,
                                }}
                            >
                                <Checkbox
                                    checked={datasheetInfo?.source_sign === 1}
                                    onChange={(e) => {
                                        setDatasheetInfo((pre) => ({
                                            ...pre,
                                            source_sign: e.target.checked
                                                ? 1
                                                : 0,
                                        }))
                                    }}
                                >
                                    {__('手工表')}
                                </Checkbox>
                            </Form.Item>
                        </Col>
                    )} */}
                    <div className={styles.formComponet}>
                        <DataOwnerCompositeComponent
                            componentsConfig={[
                                {
                                    name: 'subject_id',
                                    label: __('所属业务对象'),
                                    type: CombinedComponentType.THEME_DOMAIN_TREE,
                                    defaultDisplay: subjectId,
                                    disabled:
                                        logic === LogicViewType.LogicEntity,
                                    disableDisplay: true,
                                    disableText:
                                        __('逻辑实体库表不能调整所属业务对象'),
                                },
                                {
                                    name: 'department_id',
                                    label: __('所属部门'),
                                    type: CombinedComponentType.DEPARTMENT,
                                    defaultDisplay: departmentId,
                                    required: true,
                                    allowClear: false,
                                },
                                // {
                                //     name: 'owners',
                                //     label: __('数据Owner'),
                                //     type: CombinedComponentType.DATAOWNER,
                                //     mode: 'multiple',
                                //     perm: 'manageDataResourceAuthorization',
                                // },
                            ]}
                            defaultDomainId={subjectId}
                            // defaultOwnerId={datasheetInfo?.owner_id}
                            gutter={20}
                            numberPerLine={type === 'modal' ? [12, 12, 24] : 1}
                            form={form}
                            onClearData={(key, error) => {
                                setIsChanged(true)
                                setDatasheetInfo((prev) => ({
                                    ...prev,
                                    [key]: undefined,
                                    [`${key}_tips`]: error,
                                }))
                            }}
                        />
                    </div>
                    <Form.Item
                        label={__('数据Owner')}
                        validateFirst
                        name="owners"
                        style={{
                            marginLeft: '20px',
                            paddingRight: '8px',
                            width: 'calc(100% - 20px)',
                        }}
                        rules={[
                            {
                                required: true,
                                message: __('请选择数据Owner'),
                            },
                        ]}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                            }}
                        >
                            <Select
                                value={members.map((o) => o.id)}
                                mode="multiple"
                                open={false}
                                showSearch={false}
                                style={{ width: 'calc(100% - 38px)' }}
                                placeholder={__('请选择数据Owner')}
                                onDeselect={(val) => {
                                    const list = members.filter(
                                        (o) => o.id !== val,
                                    )
                                    if (!list.length) {
                                        form.setFields([
                                            {
                                                name: 'owners',
                                                value: undefined,
                                                errors: ['请选择数据Owner'],
                                            },
                                        ])
                                    }
                                    setMembers(list)
                                    setDatasheetInfo((prev) => ({
                                        ...prev,
                                        owners: list.map((o) => o.id),
                                    }))
                                }}
                                getPopupContainer={(node) => node.parentNode}
                            >
                                {members?.map((member) => (
                                    <Select.Option
                                        key={member.id}
                                        value={member.id}
                                    >
                                        <div className={styles.ownerItem}>
                                            <div
                                                className={styles.avatarWrapper}
                                            >
                                                <AvatarOutlined />
                                            </div>
                                            <div
                                                className={styles.ownerName}
                                                title={member.name}
                                            >
                                                {member.name}
                                            </div>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                            <Button
                                type="link"
                                onClick={() => {
                                    setChooseOwnerModalOpen(true)
                                }}
                            >
                                {__('选择')}
                            </Button>
                        </div>
                    </Form.Item>
                    <Col span={24}>
                        <Form.Item
                            label={__('更新周期')}
                            name="update_cycle"
                            style={{
                                marginLeft: '12px',
                            }}
                        >
                            <Select
                                allowClear
                                options={updateCycleOptions}
                                placeholder={`${__('请选择')}${__('更新周期')}`}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={__('共享属性')}
                            name="shared_type"
                            style={{
                                marginLeft: '12px',
                            }}
                        >
                            <Select
                                allowClear
                                options={shareTypeList}
                                placeholder={`${__('请选择')}${__('共享属性')}`}
                                getPopupContainer={(node) => node.parentNode}
                                onChange={(val) => {
                                    if (val === 3) {
                                        setDatasheetInfo?.((prev) => ({
                                            ...prev,
                                            open_type: 3,
                                        }))
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={__('开放属性')}
                            name="open_type"
                            style={{
                                marginLeft: '12px',
                            }}
                        >
                            <Select
                                allowClear
                                options={openTypeList}
                                disabled={datasheetInfo?.shared_type === 3}
                                placeholder={`${__('请选择')}${__('开放属性')}`}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
            {/* <div className={styles.modalDesc}>
                {editBasicModalDesc.map((item) => (
                    <div
                        className={calssnames(
                            styles.title,
                            type === 'view' &&
                                (size?.width || 830) > 826 &&
                                styles.titleView,
                        )}
                        key={item.title}
                    >
                        <div>{item.title}</div>
                        {item.subTitle && (
                            <div
                                className={calssnames(
                                    type === 'view' && styles.subTextBox,
                                )}
                            >
                                {item.subTitle.map((it) => (
                                    <div className={styles.subText} key={it}>
                                        <span className={styles.subDot} />
                                        {it}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div> */}
            <ChooseOwnerModal
                multiple
                open={chooseOwnerModalOpen}
                value={members}
                onOk={(selectedUser) => {
                    if (!selectedUser.length) {
                        form.setFields([
                            {
                                name: 'owners',
                                value: undefined,
                                errors: ['请选择数据Owner'],
                            },
                        ])
                    }
                    setMembers(selectedUser)
                    setDatasheetInfo((prev) => ({
                        ...prev,
                        owners: selectedUser.map((o) => o.id),
                    }))
                }}
                onCancel={() => setChooseOwnerModalOpen(false)}
            />
        </div>
    )
}

export default EditBasicInfoForm
