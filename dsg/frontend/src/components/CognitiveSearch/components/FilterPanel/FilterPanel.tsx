import classnames from 'classnames'
import { Button, Space, Collapse, DatePicker, Select, TreeSelect } from 'antd'
import type { CheckboxValueType } from 'antd/es/checkbox/Group'
import { memo, useEffect, useMemo, useState } from 'react'
import { isEqual } from 'lodash'
import { DownOutlined } from '@ant-design/icons'
import {
    ZuZhiJiaGouColored,
    ThemeColored,
    OwnerColored,
    BasicInfoColored,
    OnlineColored,
    FrequencyColored,
    ShareConditionColored,
    InfoSystemColored,
    AssetTypeColored,
    FontIcon,
} from '@/icons'
import styles from '../styles.module.less'
import __ from '../../locale'
import {
    IRole,
    formatError,
    reqInfoSystemList,
    getCategory,
    CategoryType,
    SystemCategory,
} from '@/core'
import { ParamsType, useCongSearchContext } from '../../CogSearchProvider'
import { Loader } from '@/ui'
import {
    Multi,
    PanellHeader,
    getNode,
    resourceOptions,
    defaultActiveKey,
    PanelType,
    getDateObj,
    stateOptionList,
    tagRender,
    MultiSelect,
    onlineOptions,
    transformState,
} from './helper'
import { dataKindOptions } from '../../../ResourcesDir/helper'
import { updateCycleOptions } from '../../../ResourcesDir/const'
import { shareCondition } from '../../../DataAssetsCatlg/helper'
import DepartmentAndOrgSelect from '../../../DepartmentAndOrgSelect'
import SelectThemeDomain from '../../../SelectThemeDomain'
import { disabledDate } from '../../../MyAssets/helper'
import { ownerRoleId } from '../../../BusinessDomain/const'
import SelectDataOwner from '../../../SelectDataOwner'
import { AssetType } from '../../const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { IconType } from '@/icons/const'

const { RangePicker } = DatePicker

const { Panel } = Collapse

function FilterPanel() {
    const {
        // loading,
        assetType,
        filters,
        stopInfo,
        stopKeys,
        updateParams,
        commomWord,
        setCommonWord,
        hasDataOperRole,
    } = useCongSearchContext()

    const [loading, setLoading] = useState(false)

    const [{ using }, updateUsing] = useGeneralConfig()

    // 全部信息系统
    const [infoSystemOptions, setInfoSystemOptions] = useState<any>([])

    // 信息系统是否启用
    const [infoSystemUsing, setInfoSystemUsing] = useState(false)

    /**
     * 共有的检索条件
     */
    // 所属组织架构 - 该版本仅支持单选
    const [department, setDepartment] = useState<string>()
    // 数据owner
    const [owner, setOwner] = useState<string | string[]>()

    /**
     * 数据资产独有的检索条件
     */
    // 资源类型
    const [resources, setResource] = useState<CheckboxValueType[]>([])
    // 所属主题 - 该版本仅支持单选
    const [subjectDomain, setSubjectDomain] = useState<string>()
    // 发布时间
    const [publishAt, setPublishAt] = useState<any>(null)

    const [roleList, setRoleList] = useState<Array<IRole>>()
    // 发布状态
    const [pubState, setPubState] = useState<CheckboxValueType[]>([])
    // 上线状态
    const [onLineState, setOnLineState] = useState<CheckboxValueType[]>([])

    /**
     * 数据目录独有的检索条件
     */
    // 基础信息分类
    const [dataKind, setDataKind] = useState<CheckboxValueType[]>([])
    // 更新周期
    const [updateCycles, setUpdateCycles] = useState<CheckboxValueType[]>([])
    // 共享属性
    const [shareConditions, setShareConditions] = useState<CheckboxValueType[]>(
        [],
    )
    // 自定义类目
    const [customCategorys, setCustomCategorys] = useState<any>([])
    // 所属信息系统
    const [infoSystem, setInfoSystem] = useState<any[]>([])
    // 上线时间
    const [onlineAt, setOnlineAt] = useState<any>(null)

    // 自定义分类的选中值
    const [categorySelections, setCategorySelections] = useState<
        Record<string, string[]>
    >({})

    // 当前展开的Panel
    const [activeKey, setActiveKey] = useState<string[]>(defaultActiveKey)

    useEffect(() => {
        // 数据数据目录模式获取自定义类目
        if (using === 1) {
            getCustomCategory()
        }
    }, [])

    useEffect(() => {
        if (!filters || isEqual(filters, {})) {
            handleReset()
        }
    }, [filters])

    // 获取自定义类目
    const getCustomCategory = async () => {
        try {
            setLoading(true)
            const { entries } = await getCategory({})
            const list = entries?.filter(
                (item) => item.using && item.type === CategoryType.CUSTOM,
            )
            // 检查信息系统是否启用
            const informationSystemUsing = entries?.some(
                (item) =>
                    item.type === CategoryType.SYSTEM &&
                    item.id === SystemCategory.InformationSystem &&
                    item.using === true,
            )
            // 如果启用则获取信息系统
            if (informationSystemUsing) {
                const res = await reqInfoSystemList({
                    limit: 2000,
                    offset: 1,
                })
                setInfoSystemUsing(true)
                setInfoSystemOptions(
                    res?.entries?.map((item) => {
                        return {
                            ...item,
                            value: item?.id,
                            label: item?.name,
                        }
                    }),
                )
            }
            setCustomCategorys(list || [])
            setActiveKey([...defaultActiveKey, ...list.map((item) => item.id)])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 将树形数据转换为TreeSelect需要的格式
    const convertToTreeData = (nodes: any[]): any[] => {
        return nodes.map((node) => ({
            title: node.name,
            key: node.id,
            value: node.id,
            children: node.children
                ? convertToTreeData(node.children)
                : undefined,
        }))
    }

    // 处理选择变化
    const handleCategoryChange = (categoryId: string, values: string[]) => {
        setCategorySelections((prev) => ({
            ...prev,
            [categoryId]: values,
        }))
    }

    // 重置搜索条件
    const handleReset = () => {
        setDepartment(undefined)
        setOwner(undefined)

        setResource([])
        setSubjectDomain(undefined)
        setPublishAt(null)
        setPubState([])

        setDataKind([])
        setUpdateCycles([])
        setShareConditions([])
        setInfoSystem([])
        setOnlineAt(null)
        setOnLineState([])
        setCategorySelections({})
    }

    // 触发搜索
    const handleSearch = () => {
        const commonObj = {
            department_id: department ? [department] : [],
            data_owner_id: owner ? [owner] : [],
            subject_domain_id: subjectDomain ? [subjectDomain[1]] : [],
        }
        let params: any = commonObj
        if (using === 1) {
            // 数据目录
            params = {
                ...commonObj,
                data_kind: dataKind,
                update_cycle: updateCycles,
                shared_type: shareConditions,
                info_system_id: infoSystem || [],
                // 数据目录的上线时间和数据资产的发布时间接口均使用published_at
                published_at: getDateObj(onlineAt),
                cate_node_id: Object.entries(categorySelections).map(
                    ([categoryId, values]) => ({
                        category_id: categoryId,
                        selected_ids: values,
                    }),
                ),
                resource_type: resources,
                [PanelType.PublishState]: transformState(pubState, 'publish'),
                [PanelType.OnlineState]: transformState(onLineState, 'online'),
            }
        } else {
            // 数据资源
            params = {
                ...commonObj,
                asset_type:
                    resources?.length > 0 ? resources.join(',') : assetType,
                [PanelType.PublishState]: pubState,
                online_at: getDateObj(onlineAt),
            }
        }

        updateParams(ParamsType.Filter, { ...params })
    }

    // 切换面板
    const handleActiveKeyChange = (key: string | string[]) => {
        setActiveKey(Array.isArray(key) ? key : [key])
    }

    // 获取资源类型选项
    const getResourceOptions = () => {
        // 数据目录模式不显示指标
        if (using === 1) {
            return resourceOptions.filter(
                (option) => option.value !== 'indicator',
            )
        }
        return resourceOptions
    }

    return (
        <div className={styles['filter-wrapper']}>
            <div className={styles['filter-wrapper-title']}>
                <span>{__('过滤条件')}</span>
                <span hidden={loading}>
                    <Space direction="horizontal" size={8}>
                        <Button
                            type="default"
                            size="middle"
                            onClick={handleReset}
                        >
                            重置
                        </Button>
                        <Button
                            type="default"
                            size="middle"
                            onClick={handleSearch}
                        >
                            查询
                        </Button>
                    </Space>
                </span>
            </div>
            <div className={styles['filter-wrapper-list']}>
                {loading ? (
                    <Loader />
                ) : (
                    <div>
                        <Collapse
                            collapsible="icon"
                            expandIcon={({ isActive }) => getNode(isActive)}
                            defaultActiveKey={defaultActiveKey}
                            activeKey={activeKey}
                            onChange={handleActiveKeyChange}
                        >
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={AssetTypeColored}
                                        title={__('资源类型')}
                                    />
                                }
                                key={PanelType.AssetType}
                                className={classnames(
                                    styles.hidden,
                                    (using === 1 ||
                                        (using === 2 &&
                                            assetType === AssetType.ALL)) &&
                                        styles.visible,
                                )}
                            >
                                <Multi
                                    options={getResourceOptions()}
                                    checkedList={resources}
                                    onCheckedChange={(info) => {
                                        setResource(info)
                                    }}
                                    isShowAll={using === 1}
                                    spans={using === 1 ? [12] : [9, 6, 9]}
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={BasicInfoColored}
                                        title={__('基础信息分类')}
                                    />
                                }
                                key={PanelType.DataKind}
                                className={classnames(
                                    styles.hidden,
                                    // using === 1 && styles.visible,
                                )}
                            >
                                <Multi
                                    options={dataKindOptions}
                                    checkedList={dataKind}
                                    onCheckedChange={(info) =>
                                        setDataKind(info)
                                    }
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={ZuZhiJiaGouColored}
                                        title={__('所属组织架构')}
                                    />
                                }
                                key={PanelType.Department}
                            >
                                <DepartmentAndOrgSelect
                                    allowClear
                                    value={department}
                                    // unCategorizedObj={{
                                    //     id: '00000000-0000-0000-0000-000000000000',
                                    //     name: __('未分配'),
                                    // }}
                                    onSelect={(value) => setDepartment(value)}
                                    onChange={(value) => setDepartment(value)}
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={ThemeColored}
                                        title={__('所属主题')}
                                    />
                                }
                                key={PanelType.SubjectDomain}
                            >
                                <SelectThemeDomain
                                    value={subjectDomain}
                                    onChange={(id) => {
                                        setSubjectDomain(id)
                                    }}
                                    allowClear
                                    // unCategorizedObj={{
                                    //     id: '00000000-0000-0000-0000-000000000000',
                                    //     name: __('未分配'),
                                    // }}
                                    width="100%"
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={OwnerColored}
                                        title={__('数据Owner')}
                                    />
                                }
                                key={PanelType.DataOwner}
                                className={classnames(
                                    styles.hidden,
                                    using === 2 && styles.visible,
                                )}
                            >
                                {using === 2 && (
                                    <SelectDataOwner
                                        value={owner}
                                        allowClear
                                        associateOwnerId={ownerRoleId}
                                        onChange={(val) => setOwner(val)}
                                        width="100%"
                                    />
                                )}
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={InfoSystemColored}
                                        title={__('所属信息系统')}
                                    />
                                }
                                key={PanelType.InfoSystem}
                                className={classnames(
                                    styles.hidden,
                                    using === 1 &&
                                        infoSystemUsing &&
                                        styles.visible,
                                )}
                            >
                                <MultiSelect
                                    value={infoSystem}
                                    options={infoSystemOptions}
                                    onChange={(value) => setInfoSystem(value)}
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={FrequencyColored}
                                        title={__('更新周期')}
                                    />
                                }
                                key={PanelType.UpdateCycle}
                                className={classnames(
                                    styles.hidden,
                                    using === 1 && styles.visible,
                                )}
                            >
                                <MultiSelect
                                    value={updateCycles}
                                    options={updateCycleOptions}
                                    onChange={(value) => setUpdateCycles(value)}
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={ShareConditionColored}
                                        title={__('共享属性')}
                                    />
                                }
                                key={PanelType.SharedType}
                                className={classnames(
                                    styles.hidden,
                                    using === 1 && styles.visible,
                                )}
                            >
                                <Multi
                                    options={shareCondition}
                                    checkedList={shareConditions}
                                    onCheckedChange={(info) =>
                                        setShareConditions(info)
                                    }
                                />
                            </Panel>
                            {customCategorys.map((category: any) => (
                                <Panel
                                    key={category.id}
                                    header={
                                        <PanellHeader
                                            Icon={FontIcon}
                                            title={category.name}
                                            iconProps={{
                                                name: 'icon-zidingyileibie',
                                                type: IconType.COLOREDICON,
                                            }}
                                        />
                                    }
                                    className={classnames(
                                        styles.hidden,
                                        using === 1 && styles.visible,
                                    )}
                                >
                                    <TreeSelect
                                        treeData={convertToTreeData(
                                            category.tree_node || [],
                                        )}
                                        value={
                                            categorySelections[category.id] ||
                                            []
                                        }
                                        onChange={(values) =>
                                            handleCategoryChange(
                                                category.id,
                                                values,
                                            )
                                        }
                                        maxTagCount={2}
                                        maxTagPlaceholder={(omittedValues) =>
                                            `+${omittedValues.length}`
                                        }
                                        tagRender={tagRender}
                                        treeCheckable
                                        showCheckedStrategy={
                                            TreeSelect.SHOW_PARENT
                                        }
                                        placeholder={__('请选择')}
                                        style={{ width: '100%' }}
                                        allowClear
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        dropdownStyle={{
                                            maxHeight: 400,
                                            overflow: 'auto',
                                        }}
                                        suffixIcon={<DownOutlined />}
                                        showArrow
                                        treeDefaultExpandAll
                                    />
                                </Panel>
                            ))}
                            {/* 目录或资源都显示上线日期，但请求传不同值 */}
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={OnlineColored}
                                        title={__('上线日期')}
                                    />
                                }
                                key={PanelType.OnlineAt}
                                className={classnames(
                                    styles.hidden,
                                    // using === 1 && styles.visible,
                                    styles.visible,
                                )}
                            >
                                <RangePicker
                                    value={onlineAt}
                                    placeholder={[
                                        __('开始日期'),
                                        __('结束日期'),
                                    ]}
                                    format="YYYY-MM-DD"
                                    disabledDate={(current: any) =>
                                        disabledDate(current, {})
                                    }
                                    allowEmpty={[true, true]}
                                    onChange={(val) => setOnlineAt(val)}
                                />
                            </Panel>
                            {/* <Panel
                                header={
                                    <PanellHeader
                                        Icon={OnlineColored}
                                        title={__('发布日期')}
                                    />
                                }
                                key={PanelType.PublishedAt}
                                className={classnames(
                                    styles.hidden,
                                    using === 2 && styles.visible,
                                )}
                            >
                                <RangePicker
                                    value={publishAt}
                                    placeholder={[
                                        __('开始时间'),
                                        __('结束时间'),
                                    ]}
                                    format="YYYY-MM-DD"
                                    disabledDate={(current: any) =>
                                        disabledDate(current, {})
                                    }
                                    allowEmpty={[true, true]}
                                    onChange={(val) => setPublishAt(val)}
                                />
                            </Panel> */}
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={FontIcon}
                                        title={__('发布状态')}
                                        iconProps={{
                                            name: 'icon-gengxinpinshuai1',
                                            type: IconType.COLOREDICON,
                                        }}
                                    />
                                }
                                key={PanelType.PublishState}
                                className={classnames(
                                    styles.hidden,
                                    (using === 1 ||
                                        (assetType !== AssetType.INDICATOR &&
                                            using === 2)) &&
                                        hasDataOperRole &&
                                        styles.visible,
                                )}
                            >
                                <Multi
                                    options={stateOptionList}
                                    checkedList={pubState}
                                    onCheckedChange={(info) =>
                                        setPubState(info)
                                    }
                                />
                            </Panel>
                            <Panel
                                header={
                                    <PanellHeader
                                        Icon={FontIcon}
                                        title={__('上线状态')}
                                        iconProps={{
                                            name: 'icon-gengxinpinshuai1',
                                            type: IconType.COLOREDICON,
                                        }}
                                    />
                                }
                                key={PanelType.OnlineState}
                                className={classnames(
                                    styles.hidden,
                                    using === 1 &&
                                        hasDataOperRole &&
                                        styles.visible,
                                )}
                            >
                                <Multi
                                    options={onlineOptions}
                                    checkedList={onLineState}
                                    onCheckedChange={(info) =>
                                        setOnLineState(info)
                                    }
                                />
                            </Panel>
                        </Collapse>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(FilterPanel)
