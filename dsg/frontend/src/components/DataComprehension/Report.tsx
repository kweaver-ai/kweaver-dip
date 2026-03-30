import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Table } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import lodash from 'lodash'
import Icon from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { IFormEnumConfigModel, IdimensionConfig, IdimensionModel } from '@/core'
import {
    basicInfoList,
    basicInfoListWithStatus,
    getComprehensionDataArr,
    reportClassify,
} from './const'
import BasicInfoView from './BasicInfoView'
import BlockContainer from '../ApplicationAuth/BlockContainer'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { checkHasContent } from './helper'

interface IReportData extends IdimensionConfig {
    // true-折叠 false-展开
    fold?: boolean
}

/**
 * 理解报告
 * @param details 详情
 * @param enumConfigs 枚举配置信息
 */
const Report: React.FC<{
    details?: IdimensionModel
    enumConfigs?: IFormEnumConfigModel
    isAudit?: boolean
}> = ({ details, enumConfigs, isAudit }) => {
    const ref: any = useRef()
    // 显示分类
    const [classify, setClassify] = useState(reportClassify(details))
    // 理解信息
    const [comprehensionData, setComprehensionData] = useState<
        IReportData[] | undefined
    >(getComprehensionDataArr(details?.comprehension_dimensions))

    useEffect(() => {
        setClassify(reportClassify(details))
        setComprehensionData(
            getComprehensionDataArr(details?.comprehension_dimensions),
        )
    }, [details])

    const getTreeNode = (tree: IReportData[], func): IReportData | null => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (func(node)) return node
            if (node.children) {
                const res = getTreeNode(node.children, func)
                if (res) return res
            }
        }
        return null
    }

    // 表格显示/隐藏
    const handleFoldTable = (id: string) => {
        const temp = lodash.cloneDeep(comprehensionData!)
        const curNode = getTreeNode(temp, (node: IReportData) => node.id === id)
        if (!curNode) return
        curNode.fold = curNode?.fold ? !curNode.fold : true
        setComprehensionData(temp)
    }

    // 字段理解表格项
    const fieldUndsColumns = [
        {
            title: __('目录字段名称'),
            dataIndex: 'name_cn',
            key: 'name_cn',
            width: '30%',
            render: (_, record) => (
                <span title={record.column_info.name_cn}>
                    {record.column_info.name_cn || '--'}
                </span>
            ),
        },
        {
            title: __('理解内容'),
            dataIndex: 'comprehension',
            key: 'comprehension',
            render: (value) => <span title={value}>{value || '--'}</span>,
        },
    ]

    // 联合其他编目的复合表单表格项
    const catalogColumns = [
        {
            title: __('目录名称'),
            dataIndex: 'title',
            key: 'title',
            width: '30%',
            render: (_, record) =>
                record.catalog_infos?.length > 0 ? (
                    <div>
                        {record.catalog_infos.map((info) => (
                            <span
                                key={info.id}
                                title={info.title}
                                className={styles.cp_tag}
                            >
                                {info.title}
                            </span>
                        ))}
                    </div>
                ) : (
                    '--'
                ),
        },
        {
            title: __('理解内容'),
            dataIndex: 'comprehension',
            key: 'comprehension',
            render: (value) => <span title={value}>{value || '--'}</span>,
        },
    ]

    // 折叠文本
    const panelTitle = (text) => <div className={styles.panelTitle}>{text}</div>

    const contentType1 = (detail) =>
        detail.map((info, idx) => (
            <div className={styles.cp_childWrap} key={idx}>
                <div className={classnames(styles.cp_dot)} />
                <span>{info}</span>
            </div>
        ))

    const contentType2 = (detail) => (
        <>
            {moment(detail.start * 1000).format('YYYY-MM')}
            {' - '}
            {moment(detail.start * 1000).format('YYYY-MM')}
        </>
    )

    const contentType3 = (detail) =>
        detail.map((info) => (
            <div className={styles.cp_childWrap}>
                <div className={classnames(styles.cp_dot)} />
                <div>
                    {info.map((i) => (
                        <span
                            key={i.id}
                            title={i.name}
                            className={styles.cp_tag}
                        >
                            {i.name}
                        </span>
                    ))}
                </div>
            </div>
        ))

    const contentType4 = (detail) => (
        <Table
            style={{ marginBottom: 16 }}
            dataSource={detail}
            columns={fieldUndsColumns}
            pagination={false}
            bordered
        />
    )

    const contentType5 = (detail) => (
        <Table
            style={{ marginBottom: 16 }}
            dataSource={detail}
            columns={catalogColumns}
            pagination={false}
            bordered
        />
    )

    const renderConfigType = (
        comprehension: IReportData,
        child: boolean = false,
    ) => {
        const { detail } = comprehension
        if (detail?.content_type === 1) {
            return (
                <>
                    <div className={styles.cp_childWrap} hidden={!child}>
                        <div className={styles.cp_dot} />
                        <span>{comprehension.name}：</span>
                        <span>
                            {!detail.content ||
                                (detail.content.length === 0 && '--')}
                        </span>
                    </div>
                    <div
                        style={{ marginLeft: child ? 20 : 0, marginBottom: 16 }}
                    >
                        {detail.content ? contentType1(detail.content) : '--'}
                    </div>
                </>
            )
        }
        if (detail?.content_type === 2) {
            return (
                <div className={styles.cp_childWrap}>
                    <div className={styles.cp_dot} />
                    <span hidden={!child}>{comprehension.name}：</span>
                    {detail.content ? contentType2(detail.content[0]) : '--'}
                </div>
            )
        }
        if (detail?.content_type === 3) {
            return (
                <div className={styles.cp_childWrap}>
                    {detail.content ? contentType3(detail.content) : '--'}
                </div>
            )
        }
        if (detail?.content_type === 4) {
            return (
                <>
                    <div className={styles.cp_childWrap}>
                        <div className={styles.cp_dot} />
                        <span hidden={!child}>{comprehension.name}：</span>
                        {detail?.content ? (
                            <a
                                onClick={() =>
                                    handleFoldTable(comprehension.id)
                                }
                            >
                                {comprehension?.fold
                                    ? __('展开表格')
                                    : __('收起表格')}
                            </a>
                        ) : (
                            '--'
                        )}
                    </div>
                    {detail?.content &&
                        !comprehension?.fold &&
                        contentType4(detail.content)}
                </>
            )
        }
        if (detail?.content_type === 5) {
            return (
                <>
                    <div className={styles.cp_childWrap}>
                        <div className={styles.cp_dot} />
                        <span hidden={!child}>{comprehension.name}：</span>
                        {detail?.content ? (
                            <a
                                onClick={() =>
                                    handleFoldTable(comprehension.id)
                                }
                            >
                                {comprehension?.fold
                                    ? __('展开表格')
                                    : __('收起表格')}
                            </a>
                        ) : (
                            '--'
                        )}
                    </div>
                    {detail?.content &&
                        !comprehension?.fold &&
                        contentType5(detail.content)}
                </>
            )
        }
        return undefined
    }

    const renderConfig = (comprehension: IdimensionConfig) =>
        comprehension.category === 'businessObj' ? (
            // 业务对象单独处理
            <div className={styles.comprehensionWrap} id={comprehension.id}>
                <div>{renderConfigType(comprehension, true)}</div>
            </div>
        ) : (
            <div className={styles.comprehensionWrap} id={comprehension.id}>
                <div className={styles.cp_title}>
                    <Image
                        src={details?.icons?.[comprehension?.id]}
                        preview={false}
                        style={{
                            width: 14,
                            height: 14,
                            marginRight: 8,
                            marginBottom: 2,
                        }}
                    />
                    {comprehension.name}
                </div>
                <div style={{ marginLeft: 26 }}>
                    {comprehension.children
                        ? comprehension.children.map((child) =>
                              renderConfigType(child, true),
                          )
                        : renderConfigType(comprehension)}
                </div>
            </div>
        )

    const renderEmpty = () => {
        return (
            <div
                style={{
                    display: 'gird',
                    placeContent: 'center',
                    padding: '10px 0',
                }}
            >
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            </div>
        )
    }

    const getDataPanel = (list?: any[]) => {
        const arr = (list || []).map((child) => {
            const comprehension = comprehensionData?.find(
                (c) => c.id === child.key,
            )
            if (checkHasContent(comprehension)) {
                return renderConfig(comprehension!)
            }
            return undefined
        })

        if (arr.every((o) => !o)) {
            return renderEmpty()
        }
        return arr
    }

    return (
        <div className={styles.reportWrap} id="reportWrap" ref={ref}>
            <div key={classify[0].key} id={classify[0].key}>
                {/* {panelTitle(classify[0].title)} */}
                <BlockContainer title={classify[0].title}>
                    <BasicInfoView
                        columns={
                            isAudit ? basicInfoListWithStatus : basicInfoList
                        }
                        data={details?.catalog_info}
                        status={isAudit ? details?.status : undefined}
                        enumConfigs={enumConfigs}
                    />
                </BlockContainer>
            </div>
            <div key={classify[1].key} id={classify[1].key}>
                {/* {panelTitle(classify[1].title)} */}
                <BlockContainer title={classify[1].title}>
                    {getDataPanel(classify[1].children)}
                </BlockContainer>
            </div>
            <div key={classify[2].key} id={classify[2].key}>
                {/* {panelTitle(classify[2].title)} */}
                <BlockContainer title={classify[2].title}>
                    {getDataPanel(classify[2].children)}
                </BlockContainer>
            </div>
            <div key={classify[3].key} id={classify[3].key}>
                {/* {panelTitle(classify[3].title)} */}
                <BlockContainer title={classify[3].title}>
                    {getDataPanel(classify[3].children)}
                </BlockContainer>
            </div>
        </div>
    )
}
export default Report
