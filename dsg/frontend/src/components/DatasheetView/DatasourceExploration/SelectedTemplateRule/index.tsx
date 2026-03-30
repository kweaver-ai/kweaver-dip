import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
    Modal,
    Space,
    Button,
    Checkbox,
    Tree,
    Divider,
    Tooltip,
    Tag,
    Popover,
} from 'antd'
import { SearchOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Empty, SearchInput } from '@/ui'
import { ClockColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import __ from '../locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useQuery } from '@/utils'
import { DataColoredBaseIcon } from '@/core/dataSource'
import RulesDetailsCard from '../RulesModal/RulesDetailsCard'
import DragBox from '@/components/DragBox'
import TemplateRuleTree from './TemplateRuleTree'
import { ExplorationPeculiarity, isCustomRule } from '../const'

interface ISelectedTemplateRule {
    open: boolean
    isMultiple?: boolean
    isExistTimeliness?: boolean
    dimensionList: string[]
    createdRuleList?: any[]
    ruleLevel?: any
    onClose: () => void
    onOk: (datasourceData: any[]) => void
}

const SelectedTemplateRule: React.FC<ISelectedTemplateRule> = ({
    open,
    onClose,
    onOk,
    isMultiple = false,
    isExistTimeliness = false,
    createdRuleList,
    dimensionList,
    ruleLevel,
}) => {
    const [defaultSize, setDefaultSize] = useState<number[]>([25, 75])
    const [selectedKeys, setSelectedKeys] = useState<any[]>([])
    const [searchText, setSearchText] = useState<string>('')
    const [selectedRules, setSelectedRules] = useState<any[]>([])
    const [allRules, setAllRules] = useState<any[]>([])
    const [currentRule, setCurrentRule] = useState<any>()

    // 过滤规则列表
    const filteredRules = useMemo(() => {
        const list =
            allRules
                ?.filter((rule) => {
                    const matchesSearch = rule?.rule_name?.includes(searchText)
                    return matchesSearch
                })
                ?.map((o) => ({
                    ...o,
                    disabled:
                        o.dimension === ExplorationPeculiarity.Timeliness
                            ? isExistTimeliness
                            : createdRuleList
                                  ?.filter(
                                      (i) =>
                                          !isCustomRule(
                                              JSON.parse(
                                                  i?.rule_config || '{}',
                                              ),
                                          ),
                                  )
                                  ?.map((i) => i.rule_name)
                                  ?.includes(o.name) || o.disabled,
                })) || []
        return list
    }, [allRules, searchText, createdRuleList])

    // 处理规则选择
    const handleSelectRule = (ruleId, checked) => {
        if (checked) {
            const ruleToAdd = allRules.find((r) => r.id === ruleId)
            setSelectedRules([...selectedRules, ruleToAdd])
        } else {
            setSelectedRules(selectedRules.filter((r) => r.id !== ruleId))
        }
    }

    // 处理树形选择
    const onTreeSelect = (setedKeys: any[]) => {
        setSelectedKeys(setedKeys)
    }

    // 清空所有已选
    const clearAll = () => {
        setSelectedRules([])
        setCurrentRule(undefined)
    }

    // 悬停"+N"时显示的剩余规则内容
    const remainingRulesContent = (
        <div className={styles['remaining-rules-popover']}>
            {selectedRules.slice(3).map((rule) => (
                <div key={rule.id} className={styles['remaining-rule-item']}>
                    <Tag
                        key={rule.id}
                        closable
                        onClose={() =>
                            setSelectedRules(
                                selectedRules.filter((r) => r.id !== rule.id),
                            )
                        }
                        title={rule.name}
                        className={classnames(
                            styles['rule-tag'],
                            styles['rule-tag-pop'],
                        )}
                    >
                        {rule.name.length > 10
                            ? `${rule.name.substring(0, 10)}...`
                            : rule.name}
                    </Tag>
                </div>
            ))}
        </div>
    )

    const modalHandleOk = () => {
        onOk(selectedRules)
    }

    // 空状态
    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const onNodeClick = (rule: any) => {
        if (rule.disabeld) return
        if (!isMultiple) {
            if (selectedRules?.map((o) => o.id).includes(rule.id)) {
                setSelectedRules([])
                setCurrentRule(undefined)
            } else {
                setCurrentRule(rule)
                setSelectedRules([rule])
            }
        } else {
            setCurrentRule(rule)
        }
    }

    return (
        <Modal
            title={__('从模板中新建')}
            width={1000}
            open={open}
            onOk={modalHandleOk}
            onCancel={onClose}
            className={styles.modalWrapper}
            maskClosable={false}
            footer={
                <div className={styles['modal-footer-tags']}>
                    <span className={styles['selected-count']}>
                        {isMultiple
                            ? __('已选(${sum})', {
                                  sum: selectedRules?.length || '0',
                              })
                            : __('已选')}
                    </span>
                    <div className={styles['selected-tags-container']}>
                        {selectedRules.slice(0, 3).map((rule) => (
                            <Tag
                                key={rule.id}
                                closable
                                onClose={() => {
                                    setSelectedRules(
                                        selectedRules.filter(
                                            (r) => r.id !== rule.id,
                                        ),
                                    )
                                    if (!isMultiple) {
                                        setCurrentRule(undefined)
                                    }
                                }}
                                title={rule.name}
                                className={styles['rule-tag']}
                            >
                                {rule.name.length > 10
                                    ? `${rule.name.substring(0, 10)}...`
                                    : rule.name}
                            </Tag>
                        ))}
                        {selectedRules.length > 3 && (
                            <Popover
                                content={remainingRulesContent}
                                trigger="hover"
                                placement="top"
                                className={styles.moreTagPop}
                            >
                                <Tag className={styles['more-tag']}>
                                    +{selectedRules.length - 3}
                                </Tag>
                            </Popover>
                        )}
                    </div>
                    <div className={styles['footer-actions']}>
                        <Button type="text" onClick={clearAll}>
                            {__('清空')}
                        </Button>
                        <Button style={{ marginLeft: 8 }} onClick={onClose}>
                            {__('取消')}
                        </Button>
                        <Tooltip
                            title={
                                !selectedRules?.length
                                    ? __('请选择需要导入的规则模板')
                                    : ''
                            }
                        >
                            <Button
                                type="primary"
                                style={{ marginLeft: 8 }}
                                disabled={!selectedRules?.length}
                                onClick={() => {
                                    onOk(selectedRules)
                                    onClose()
                                }}
                            >
                                {__('确定')}
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            }
        >
            <div className={styles.ModalBox}>
                <div className={styles['rule-selector-container']}>
                    <DragBox
                        defaultSize={defaultSize}
                        minSize={[170, 220]}
                        maxSize={[500, Infinity]}
                        onDragEnd={(size) => {
                            setDefaultSize(size)
                        }}
                        existPadding={false}
                        showExpandBtn={false}
                        gutterStyles={{
                            width: '8px',
                        }}
                        gutterSize={8}
                    >
                        {/* 左侧 - 规则类型和树形结构 (25%) */}
                        <div className={styles['left-panel']}>
                            <div>{__('规则类型')}</div>
                            {/* <div className={styles['panel-header']}>
                                <SearchInput
                                    onKeyChange={(kw) => {
                                        setSearchText(kw)
                                    }}
                                    value={searchText}
                                    placeholder={__('搜索类型')}
                                />
                            </div> */}
                            <div className={styles['tree-container']}>
                                {/* <Tree
                                    treeData={ruleTypes}
                                    selectedKeys={selectedKeys}
                                    onSelect={onTreeSelect}
                                    defaultExpandAll
                                /> */}
                                <TemplateRuleTree
                                    dimensionList={dimensionList}
                                    onChange={setAllRules}
                                    ruleLevel={ruleLevel}
                                    isExistTimeliness={isExistTimeliness}
                                />
                            </div>
                        </div>
                        <div className={styles.rightNode}>
                            {/* 中间 - 规则列表 (50%) */}
                            <div
                                className={classnames(
                                    styles['center-panel'],
                                    !currentRule?.id && styles.noDetails,
                                )}
                            >
                                <div className={styles['panel-title']}>
                                    {__('规则')}
                                </div>
                                <div className={styles['panel-header']}>
                                    <SearchInput
                                        onKeyChange={(kw) => {
                                            setSearchText(kw)
                                        }}
                                        value={searchText}
                                        placeholder={__('搜索规则')}
                                        style={{
                                            width: 'calc(100% - 16px)',
                                            marginLeft: '16px',
                                        }}
                                    />
                                </div>
                                <div className={styles['rule-list-container']}>
                                    {filteredRules.length > 0 ? (
                                        <div className={styles['rule-list']}>
                                            {filteredRules.map((rule: any) => (
                                                <Tooltip
                                                    key={rule.id}
                                                    title={
                                                        rule?.disabled
                                                            ? __(
                                                                  '规则已存在，无法引用更多',
                                                              )
                                                            : ''
                                                    }
                                                >
                                                    <div
                                                        className={classnames(
                                                            styles['rule-item'],
                                                            currentRule?.id ===
                                                                rule.id
                                                                ? styles.active
                                                                : '',
                                                            rule.disabled
                                                                ? styles.disabled
                                                                : '',
                                                        )}
                                                        onClick={() =>
                                                            onNodeClick(rule)
                                                        }
                                                    >
                                                        {isMultiple && (
                                                            <Checkbox
                                                                checked={selectedRules.some(
                                                                    (r) =>
                                                                        r.id ===
                                                                        rule.id,
                                                                )}
                                                                onChange={(e) =>
                                                                    handleSelectRule(
                                                                        rule.id,
                                                                        e.target
                                                                            .checked,
                                                                    )
                                                                }
                                                                disabled={
                                                                    rule?.disabled
                                                                }
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            />
                                                        )}
                                                        <FontIcon
                                                            className={
                                                                styles.ruleIcon
                                                            }
                                                            name="icon-guizeicon"
                                                            type={
                                                                IconType.COLOREDICON
                                                            }
                                                        />
                                                        <div
                                                            className={
                                                                styles[
                                                                    'rule-info'
                                                                ]
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'rule-name'
                                                                    ]
                                                                }
                                                                title={
                                                                    rule.name
                                                                }
                                                            >
                                                                {rule.name}
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'rule-desc'
                                                                    ]
                                                                }
                                                                title={
                                                                    rule.rule_description
                                                                }
                                                            >
                                                                {
                                                                    rule.rule_description
                                                                }
                                                            </div>
                                                        </div>
                                                        {!isMultiple &&
                                                            currentRule?.id ===
                                                                rule.id && (
                                                                <CheckOutlined
                                                                    className={
                                                                        styles[
                                                                            'rule-info-checked'
                                                                        ]
                                                                    }
                                                                />
                                                            )}
                                                    </div>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    ) : (
                                        renderEmpty()
                                    )}
                                </div>
                            </div>

                            {currentRule?.id && (
                                <>
                                    <Divider
                                        type="vertical"
                                        className={styles.divider}
                                    />
                                    <div className={styles['right-panel']}>
                                        <div className={styles['panel-title']}>
                                            {__('规则预览')}
                                        </div>
                                        <div className={styles['details-box']}>
                                            <RulesDetailsCard
                                                ruleId={currentRule?.id}
                                                type="isTemplateConfig"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </DragBox>
                </div>
            </div>
        </Modal>
    )
}

export default SelectedTemplateRule
