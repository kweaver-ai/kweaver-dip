import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'
import { Button, Divider, Form, message, Space } from 'antd'
import moment from 'moment'
import { useScroll, useSize } from 'ahooks'
import CreateRequirementInfo from './CreateRequirementInfo'
import CreateNav from './CreateNav'
import CreateUnitInfo from './CreateUnitInfo'
import CreateResourceConfig from './CreateResourceConfig'
import CreateApplicationAgreement from './CreateApplicationAgreement'
import styles from './styles.module.less'
import {
    agreementFields,
    defaultPhoneNumber,
    demandRequiredFields,
    NavType,
    ResourceSource,
    ResourceType,
    SaveOrSubmit,
    unitRequiredFields,
} from './const'
import {
    createDemand,
    editDemand,
    formatError,
    getDemandDetails,
    getDemandItems,
    getObjects,
    getSelectedRepositorys,
    IDemandItemConfig,
} from '@/core'
import { useQuery } from '@/utils'
import CreateRequirementScene from './CreateRequirementScene'
import { Architecture } from '../BusinessArchitecture/const'
import __ from './locale'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const Create = () => {
    const project = localStorage.getItem('project')
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const requirementInfoRef = useRef<any>()
    const requirementInfoRefSize = useSize(requirementInfoRef)
    const unitInfoRef = useRef<any>()
    const unitInfoRefSize = useSize(unitInfoRef)
    const resourceConfigRef = useRef<any>()
    const resourceConfigSize = useSize(resourceConfigRef)
    const sceneRef = useRef<any>()
    const sceneRefSize = useSize(sceneRef)
    const applicationAgreementRef = useRef<any>()
    const [isDemandInfoFilledOver, setIsDemandInfoFilledOver] = useState(false)
    const [isUnitInfoFilledOver, setIsUnitInfoFilledOver] = useState(true)
    const [isResourceInfoFilledOver, setIsResourceInfoFilledOver] =
        useState(false)

    const [scrollToTargetNav, setScrollToTargetNav] = useState<NavType>(
        NavType.DEMAND,
    )
    const scrollRef = useRef<any>(null)
    const scroll = useScroll(scrollRef)
    const [saveOrSubmit, setSaveOrSubmit] = useState<SaveOrSubmit>(
        SaveOrSubmit.SAVE,
    )

    // 承诺书信息
    const [applicationInfo, setApplicationInfo] = useState({})
    // 承诺书是否勾选
    const [applicationCheckedStatus, setApplicationCheckedStatus] = useState(
        project === 'tc',
    )

    const [details, setDetails] = useState<any>()
    const [items, setItems] = useState<IDemandItemConfig[]>([])
    // 记录内容是否发生变更
    const [isContentChanged, setIsContentChanged] = useState(false)

    const [isHiddenRequireInfo, setIsHiddenRequireInfo] = useState(false)
    const [isHiddenResourceInfo, setIsHiddenResourceInfo] = useState(false)
    const [userInfo] = useCurrentUser()

    const query = useQuery()
    // 编辑时获取的需求id
    const id = useMemo(() => query.get('id'), [])
    // 资源目录立即申请的资源id
    const resId = useMemo(() => query.get('resId'), [])
    // 回跳地址 需decode
    const backUrl = useMemo(() => query.get('backUrl'), [])
    // 资源目录携带资源申请
    const carryRes = useMemo(() => query.get('carryRes'), [])

    useEffect(() => {
        if (scroll && scroll.top) {
            const resourceHeight = resourceConfigSize?.height || 872
            if (scroll.top < 310 * 0.8) {
                setScrollToTargetNav(NavType.DEMAND)
            }
            if (
                scroll.top >= 310 * 0.8 &&
                scroll.top <= 310 + resourceHeight * 0.8
            ) {
                setScrollToTargetNav(NavType.CONFIG)
            }
            if (
                scroll.top > 310 + resourceHeight * 0.8 &&
                scroll.top <= 310 + resourceHeight + 718 * 0.8
            ) {
                setScrollToTargetNav(NavType.UNIT)
            }
            if (scroll.top > 310 + resourceHeight + 718 * 0.8) {
                setScrollToTargetNav(NavType.SCENE)
            }
        }
    }, [scroll, resourceConfigSize])

    // 编辑时查详情
    const getDetails = async () => {
        try {
            if (id) {
                const res = await getDemandDetails(id)
                const deps = await getObjects({
                    limit: 0,
                    id: '',
                    is_all: true,
                    type: Architecture.DEPARTMENT,
                })
                // 编辑时判断所选部门是否被删除
                const isDelDep =
                    res.dept_id &&
                    !deps.entries?.find((dep) => dep.id === res.dept_id)
                setDetails(res)
                const applicationFile =
                    res.reference_files?.find((file) => file.type === 1) ||
                    undefined

                form.setFieldsValue({
                    ...res,
                    finish_date: res.finish_date
                        ? moment(res.finish_date)
                        : undefined,
                    application_letter: applicationFile,
                    dept_id: isDelDep ? undefined : res.dept_id,
                })
                if (isDelDep) {
                    form.setFields([
                        {
                            name: 'dept_id',
                            errors: [__('选择的部门已被删除，请重新选择')],
                        },
                    ])
                }

                // 校验需求信息字段是否填写完成
                const isRequiredDemandInfoFilledOver = checkRequiredFilledOver(
                    demandRequiredFields,
                    res,
                    false,
                )

                // 校验单位信息字段是否填写完成 （除申请函件外）
                const isRequiredUnitInfoFilledOver = checkRequiredFilledOver(
                    unitRequiredFields.filter(
                        (field) => field.key !== 'application_letter',
                    ),
                    res,
                    false,
                )

                // 设置导航栏是否完成的状态
                setIsDemandInfoFilledOver(isRequiredDemandInfoFilledOver)
                setIsUnitInfoFilledOver(isRequiredUnitInfoFilledOver)

                // 设置承诺书信息
                const applicationInfos = {}
                agreementFields.forEach((field) => {
                    applicationInfos[field] = res[field] || undefined
                })
                setApplicationInfo(applicationInfos)
                setApplicationCheckedStatus(res.promise_state === 2)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 编辑时查资源信息
    const getItems = async () => {
        try {
            if (id) {
                const res = await getDemandItems(id)
                setItems(res.entries)
                // form.setFieldsValue({
                //     items: res.entries.map((item) => ({
                //         ...item,
                //         data_space_range: item.data_space_range || undefined,
                //         data_time_range: item.data_time_range || undefined,
                //         update_cycle: item.update_cycle || undefined,
                //         service_life: item.service_life || undefined,
                //         call_frequency_unit: item.call_frequency_unit || undefined,
                //     })),
                // })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const getRepositorys = async (repId?: string) => {
        try {
            const res = await getSelectedRepositorys(repId)
            setItems(
                res.entries.map((item) => {
                    return {
                        id: '',
                        res_id: item.id,
                        res_name: item.title,
                        res_code: item.id,
                        res_type: ResourceType.DBTABLE,
                        res_source: ResourceSource.SERVICESHOP,
                        filter_items: [],
                        info_items: [],
                        res_desc: item.description,
                    }
                }),
            )
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        if (id) {
            getDetails()
            getItems()
        } else {
            form.setFieldsValue({
                tech_user_name: userInfo?.Account,
                tech_user_phone:
                    project === 'tc' ? undefined : defaultPhoneNumber,
                dept_leader_name: userInfo?.Account,
                dept_leader_phone:
                    project === 'tc' ? undefined : defaultPhoneNumber,
            })
            setApplicationInfo({
                dept_leader_name: userInfo?.Account,
                dept_leader_phone: defaultPhoneNumber,
                data_mgt_user_name: userInfo?.Account,
                data_mgt_user_phone: defaultPhoneNumber,
                op_user_name: userInfo?.Account,
                op_user_phone: defaultPhoneNumber,
            })
        }
        // resId 从资源目录点击立即申请携带的资源id
        if (resId) {
            getRepositorys(resId)
        }

        if (carryRes === '1') {
            getRepositorys()
        }
    }, [])

    const handleReturn = () => {
        if (resId || carryRes === '1') {
            // 两套菜单框架之间的跳转
            navigate(`/data-assets`)
            return
        }
        navigate(`/dataService/requirement/list`)
    }

    const getClickNav = (navType: NavType) => {
        switch (navType) {
            case NavType.DEMAND:
                scrollTo(requirementInfoRef, 0)
                break
            case NavType.CONFIG:
                scrollTo(resourceConfigRef, requirementInfoRefSize?.height || 0)
                break
            case NavType.UNIT:
                scrollTo(
                    unitInfoRef,
                    (requirementInfoRefSize?.height || 0) +
                        (resourceConfigSize?.height || 0),
                )
                break
            case NavType.SCENE:
                scrollTo(
                    sceneRef,
                    (requirementInfoRefSize?.height || 0) +
                        (resourceConfigSize?.height || 0) +
                        (unitInfoRefSize?.height || 0),
                )
                break
            default:
                break
        }
    }
    const scrollTo = (ref, h) => {
        // ref.current?.scrollIntoView(250)
        scrollRef.current.scrollTop = h
    }

    // 获取承诺书中的信息
    const getApplicationInfo = (infos) => {
        setApplicationInfo(infos)
        form.setFieldsValue({
            ...infos,
        })
    }

    const onValuesChange = (changedValues, allValues) => {
        // 记录需求信息和单位信息是否发生变化
        if (!isContentChanged) {
            setIsContentChanged(true)
        }

        const changedKey = Object.keys(changedValues)[0]
        if (demandRequiredFields.find((field) => field.key === changedKey)) {
            // 填写后将报错信息清除
            if (changedValues[changedKey]) {
                form.setFields([
                    {
                        name: changedKey,
                        errors: [],
                    },
                ])
            }
            // 判断需求信息必填字段是否全部完成
            let isDemandRequiredFieldsFilled = true
            demandRequiredFields.forEach((field) => {
                if (
                    (Array.isArray(allValues[field.key]) &&
                        allValues[field.key].length === 0) ||
                    !allValues[field.key]
                ) {
                    isDemandRequiredFieldsFilled = false
                }
            })
            setIsDemandInfoFilledOver(isDemandRequiredFieldsFilled)
        }
        // 单位信息必填项
        const unitFields = [...unitRequiredFields]
        if (unitFields.find((field) => field.key === changedKey)) {
            if (changedValues[changedKey]) {
                form.setFields([
                    {
                        name: changedKey,
                        errors: [],
                    },
                ])
            }
            let isUnitRequiredFieldsFilled = true
            unitFields.forEach((field) => {
                if (
                    (Array.isArray(allValues[field.key]) &&
                        allValues[field.key].length === 0) ||
                    !allValues[field.key]
                ) {
                    isUnitRequiredFieldsFilled = false
                }
            })
            setIsUnitInfoFilledOver(isUnitRequiredFieldsFilled)
        }

        if (
            [
                'dept_leader_name',
                'dept_leader_phone',
                'dept_leader_pos',
                'dept_leader_email',
            ].includes(changedKey)
        ) {
            setApplicationInfo({ ...applicationInfo, ...changedValues })
        }
    }

    const handleSave = () => {
        setSaveOrSubmit(SaveOrSubmit.SAVE)
        form.submit()
    }

    const handleSubmit = () => {
        setSaveOrSubmit(SaveOrSubmit.SUBMIT)
        form.submit()
    }

    // 必填项未填写时报错
    const checkRequiredFilledOver = (fields, values, isNeedError = true) => {
        let isRequiredFilledOver = true
        fields.forEach((field) => {
            if (
                !values[field.key] ||
                (Array.isArray(values[field.key]) &&
                    values[field.key].length === 0)
            ) {
                isRequiredFilledOver = false
                if (isNeedError) {
                    form.setFields([
                        { name: [field.key], errors: [field.message] },
                    ])
                }
            }
        })
        return isRequiredFilledOver
    }

    const onFinish = async (values) => {
        // 提交时对必填数据进行校验
        if (saveOrSubmit === SaveOrSubmit.SUBMIT) {
            // 校验需求信息字段是否填写完成
            const isRequiredDemandInfoFilledOver = checkRequiredFilledOver(
                demandRequiredFields,
                values,
            )

            if (!isRequiredDemandInfoFilledOver) {
                getClickNav(NavType.DEMAND)
                if (isHiddenRequireInfo) {
                    setIsHiddenRequireInfo(false)
                }
                return
            }

            // 资源现可为空
            // if (
            //     [...(values.assetsRes || []), ...(values.blankRes || [])]
            //         .length === 0
            // ) {
            //     getClickNav(NavType.CONFIG)
            //     if (isHiddenResourceInfo) {
            //         setIsHiddenResourceInfo(false)
            //     }
            //     message.error(__('资源配置不能为空'))
            //     return
            // }

            // 校验单位信息字段是否填写完成 (除了申请函件的必填字段)
            const isRequiredUnitInfoFilledOver = checkRequiredFilledOver(
                unitRequiredFields,
                values,
            )

            if (!isRequiredUnitInfoFilledOver) {
                getClickNav(NavType.UNIT)
                return
            }

            if (!applicationCheckedStatus) {
                applicationAgreementRef.current?.scrollIntoView()
                message.error(__('请先填写承诺书内容并勾选确认后，再尝试提交'))
                return
            }
        }

        const reference_files: any[] = []
        if (values.application_letter) {
            reference_files.push(values.application_letter)
        }
        const params = {
            ...values,
            items: [...(values.assetsRes || []), ...(values.blankRes || [])],
            finish_date: values.finish_date
                ? moment(
                      values.finish_date.format('YYYY-MM-DD 00:00:00'),
                  ).valueOf()
                : undefined,
            ...applicationInfo,
            application_letter: undefined,
            reference_files,
            save_op_type: saveOrSubmit,
            promise_state: applicationCheckedStatus ? 2 : 1,
            assetsRes: undefined,
            blankRes: undefined,
            source: resId || carryRes === '1' ? 2 : 1, // 需求来源： 1：需求系统 2 资源目录
        }

        try {
            if (!id) {
                await createDemand(params)
            } else {
                await editDemand(id, { ...params })
            }

            message.success(
                saveOrSubmit === SaveOrSubmit.SAVE
                    ? __('保存成功')
                    : __('提交成功'),
            )
            navigate(`/dataService/requirement/list`)
        } catch (error) {
            formatError(error)
        }
    }

    const returnToDemandList = () => {
        if (!isContentChanged) {
            handleReturn()
            return
        }
        ReturnConfirmModal({
            onCancel: handleReturn,
        })
    }
    return (
        <div className={styles.createWrapper}>
            <div className={styles.header}>
                <GlobalMenu />
                <div onClick={returnToDemandList} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.createTitle}>
                    {id ? __('编辑需求') : __('新建需求')}
                </div>
            </div>
            <div className={styles.body}>
                <CreateNav
                    getClickNav={getClickNav}
                    demandInfoOver={isDemandInfoFilledOver}
                    unitInfoOver={isUnitInfoFilledOver}
                    resourceOver={isResourceInfoFilledOver}
                    scrollToTargetNav={scrollToTargetNav}
                />
                <div className={styles.right}>
                    <div className={styles.content} ref={scrollRef}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            onValuesChange={onValuesChange}
                            className={styles.formContent}
                            scrollToFirstError
                        >
                            <div ref={requirementInfoRef}>
                                <CreateRequirementInfo
                                    demandId={id || ''}
                                    isHidden={isHiddenRequireInfo}
                                    setIsHidden={setIsHiddenRequireInfo}
                                />
                            </div>
                            <div ref={resourceConfigRef}>
                                <CreateResourceConfig
                                    form={form}
                                    setIsRequiredInfoFilledOver={
                                        setIsResourceInfoFilledOver
                                    }
                                    itemsInfo={items}
                                    setIsContentChanged={setIsContentChanged}
                                    isHidden={isHiddenResourceInfo}
                                    setIsHidden={setIsHiddenResourceInfo}
                                />
                            </div>
                            <div ref={unitInfoRef}>
                                <CreateUnitInfo form={form} />
                            </div>
                            {project !== 'tc' && (
                                <div ref={sceneRef}>
                                    <CreateRequirementScene
                                        form={form}
                                        demandId={id || ''}
                                        selMatsIds={details?.rela_matter_ids}
                                    />
                                </div>
                            )}

                            <div
                                ref={applicationAgreementRef}
                                className={
                                    project === 'tc'
                                        ? styles.tcAgreementContainer
                                        : undefined
                                }
                            >
                                <CreateApplicationAgreement
                                    getApplicationInfo={getApplicationInfo}
                                    checkedStatus={applicationCheckedStatus}
                                    getCheckedStatus={
                                        setApplicationCheckedStatus
                                    }
                                    applicationInfo={applicationInfo}
                                    setIsContentChanged={setIsContentChanged}
                                />
                            </div>
                        </Form>
                    </div>
                    <div className={styles.footer}>
                        <Space>
                            <Button onClick={returnToDemandList}>
                                {__('取消')}
                            </Button>
                            <Button onClick={handleSave}>{__('保存')}</Button>
                            <Button type="primary" onClick={handleSubmit}>
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Create
