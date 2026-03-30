import React, { ReactNode } from 'react'
import { Graph, Node } from '@antv/x6'
import { Button, Popover, Tooltip } from 'antd'
import {
    CheckOutlined,
    InfoCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { IFormula, getPolicyFieldsByFormViewId } from '@/core'
import __ from '../locale'
import { FormulaError, formulaInfo, FormulaType, JoinType } from '../const'
import {
    AppDataContentColored,
    DatasheetViewColored,
    FullJoinLined,
    InnerJoinLined,
    LeftJoinLined,
    RightJoinLined,
} from '@/icons'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { FieldsData } from '../FieldsData'
import { getFormulaErrorText } from '../helper'
import { SearchInput } from '@/ui'
import Icons from '@/components/BussinessConfigure/Icons'
import { DATA_TYPE_MAP } from '@/utils'

export interface IFormulaConfigEl {
    // 显示/隐藏
    visible?: boolean
    // 操作类型
    optionType?: FormulaType
    // 画布
    graph?: Graph
    // 选中的节点
    node?: Node<Node.Properties>
    // 选中的算子
    formulaData?: IFormula
    // 字段数据
    fieldsData: FieldsData
    // 窗口高度比
    viewSize?: number
    // 展开/收起状态
    dragExpand?: boolean
    // 切换展开状态
    onChangeExpand?: (closed: boolean) => void
    // 关闭
    onClose: (bo?) => void
}

/**
 * 关联方式信息
 */
const joinTypeInfo = {
    [JoinType.LEFT]: {
        name: '左联接',
        icon: <LeftJoinLined />,
        tip: '保留左表输入的所有数据',
    },
    [JoinType.RIGHT]: {
        name: '右联接',
        icon: <RightJoinLined />,
        tip: '保留右表输入的所有数据',
    },
    [JoinType.INNER]: {
        name: '内联接',
        icon: <InnerJoinLined />,
        tip: '保留两个表交集的数据',
    },
    [JoinType.FULLOUT]: {
        name: '全外联接',
        icon: <FullJoinLined />,
        tip: '保留两个表所有的数据',
    },
}

/**
 * 提示组件
 * @param text 文本
 */
const tipLabel = (text: string) => (
    <div
        style={{
            color: 'rgba(0, 0, 0, 0.45)',
        }}
    >
        <div>{text}</div>
    </div>
)

/**
 * 字段组件
 * @param icon 图标
 * @param text 文本
 */
const fieldLabel = (
    type: any,
    text: string,
    isSelected?: boolean,
    title?: string,
) => {
    const timeType = DATA_TYPE_MAP.time.includes(type) || type === '时间型'
    return (
        <div className={styles.fieldLabelWrap}>
            <div className={styles.fl_contentWrap}>
                <Icons type={type} />
                <span
                    className={classnames(
                        styles.fl_name,
                        (timeType || title) && styles.disable,
                    )}
                    title={
                        title ||
                        (timeType ? __('当前不支持选择此类型的字段') : text)
                    }
                >
                    {text}
                </span>
            </div>
            {isSelected && <CheckOutlined style={{ color: '#126ee3' }} />}
        </div>
    )
}

/**
 * 库表组件
 * @param icon 图标
 * @param text 文本
 */
const catalogLabel = (data: any, showInfo = true) => (
    <div className={styles.catalogLabelWrap}>
        <DatasheetViewColored />
        <div className={styles.cl_name} title={data.business_name}>
            {data.business_name}
        </div>
        <Popover
            placement="right"
            getPopupContainer={(n) => n.parentElement!}
            content={__('温馨提示：该库表执行时可能存在加载过慢情况')}
        >
            <InfoCircleOutlined
                style={{ color: 'rgb(0 0 0 / 45%)' }}
                hidden={
                    !['hive-hadoop2', 'hive-jdbc'].includes(
                        data.datasource_type,
                    ) || !showInfo
                }
            />
        </Popover>
    </div>
)

/**
 * 数据为空组件
 * @param errorType 错误类型
 */
const dataEmptyView = (errorType?: string | FormulaError, type?: string) => {
    return (
        <div style={{ marginTop: 60, textAlign: 'center', width: '100%' }}>
            <Empty
                desc={
                    <>
                        <div>{__('暂时无法配置')}</div>
                        <div>
                            {getFormulaErrorText(errorType, type as any) ||
                                getFormulaErrorText(errorType)}
                        </div>
                    </>
                }
                iconSrc={dataEmpty}
            />
        </div>
    )
}

/**
 * 配置折叠label
 * @param onUnfold 展开操作
 */
const configLeftFoldLabel = (onUnfold: () => void) => {
    return (
        <div className={styles.configLeftFoldWrap}>
            <Tooltip title={__('展开')} placement="right">
                <MenuUnfoldOutlined
                    className={styles.clf_icon}
                    onClick={onUnfold}
                />
            </Tooltip>
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontWeight: 550,
                }}
            >
                {__('配置')}
            </div>
        </div>
    )
}

/**
 * 配置展开label
 * @param onFold 折叠操作
 */
const configLeftUnfoldLabel = (onFold: () => void) => {
    return (
        <div className={styles.configLeftUnfoldWrap}>
            <div
                style={{
                    fontWeight: 550,
                }}
            >
                {__('配置')}
            </div>
            <Tooltip title={__('收起')} placement="right">
                <MenuFoldOutlined
                    className={styles.clf_icon}
                    onClick={onFold}
                />
            </Tooltip>
        </div>
    )
}

const getPolicyFields = async (formViewId: string) => {
    let fields: any[] = []
    let res: any = {}
    if (!formViewId) {
        return { fields, fromViewInfo: res }
    }
    try {
        res = await getPolicyFieldsByFormViewId(formViewId)
        fields =
            res?.field_list?.map((item) => ({
                ...item,
                technical_name: item.form_view_field_technical_name,
                business_name: item.form_view_field_business_name,
                id: item.form_view_field_id,
            })) || []
    } catch (e) {
        // console.log(e)
    }
    return { fields, fromViewInfo: res }
}

/**
 * 配置右侧子标题
 * @param title 标题
 * @param showSearch 搜索框显示/隐藏
 * @param onSearch 搜索操作
 */
const ConfigSubTitle: React.FC<{
    title: string
    formulaItem?: IFormula
    showSearch: boolean
    searchValue?: string
    showDataView: boolean
    onSearch: (kw) => void
    onDataView: () => void
}> = ({
    title,
    formulaItem,
    showSearch = false,
    searchValue,
    showDataView,
    onSearch,
    onDataView,
}) => {
    return (
        <div className={styles.configRightSubTitleWrap}>
            <span className={styles.crt_tit}>
                {title}
                <span className={styles.crt_desc}>
                    {formulaItem && formulaInfo[formulaItem?.type].fieldsTip}
                </span>
                <span
                    className={classnames(
                        styles.crt_link,
                        !showDataView && styles.crt_linkDisabled,
                    )}
                    onClick={() => {
                        if (showDataView) {
                            onDataView()
                        }
                    }}
                >
                    {__('预览输出字段')}
                </span>
            </span>
            <SearchInput
                hidden={!showSearch}
                style={{ width: 272 }}
                placeholder={__('搜索字段名称')}
                value={searchValue}
                onKeyChange={onSearch}
                onPressEnter={(e: any) => onSearch(e.target.value.trim())}
            />
        </div>
    )
}

export {
    joinTypeInfo,
    tipLabel,
    fieldLabel,
    catalogLabel,
    dataEmptyView,
    configLeftUnfoldLabel,
    getPolicyFields,
    configLeftFoldLabel,
    // ConfigSubTitle,
}
