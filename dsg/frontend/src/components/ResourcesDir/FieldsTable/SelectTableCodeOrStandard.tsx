import React, { useEffect, useState, useRef, memo } from 'react'
import { Select, Input, Button } from 'antd'
import { CloseCircleFilled } from '@ant-design/icons'
import { uniqBy } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import {
    CatalogType,
    getDictList,
    getDataElement,
    formatError,
    getDirDataByTypeOrId,
    IStdRecParams,
    IRuleRecParams,
} from '@/core'
import DataEleDetails from '@/components/DataEleManage/Details'
import CodeTableDetails from '@/components/CodeTableManage/Details'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import CodeRuleDetails from '@/components/CodeRulesComponent/CodeRuleDetails'
import { getPopupContainer } from '@/utils'

interface ISelectTableCodeOrStandard {
    placeholder?: any
    value?: any
    onChange?: (o) => void
    // 码表、数据标准、编码规则
    type: 'code' | 'standard' | 'coderule'
    fields?: any
    fieldKeys?: {
        fieldId: string
        fieldLabel: string
    }
    status?: '' | 'warning' | 'error'
    stdRecParams?: IStdRecParams
    ruleRecParams?: IRuleRecParams
}

const SelectTableCodeOrStandard: React.FC<ISelectTableCodeOrStandard> = (
    props,
) => {
    const {
        placeholder,
        value,
        onChange,
        type,
        fields,
        fieldKeys,
        status,
        stdRecParams,
        ruleRecParams,
    } = props
    const selDataRef: any = useRef()
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.CODETABLE,
    )
    const [detailId, setDetailId] = useState<string | undefined>('')
    const [detailIds, setDetailIds] = useState<Array<any> | undefined>([])
    const [dataEleMatchType, setDataEleMatchType] = useState<number>(2)
    const [selDataItems, setSelDataItems] = useState<any[]>([])
    const [selStandardItems, setSelStandardItems] = useState<any[]>([])
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)
    const [inputValue, setInputValue] = useState<string>(
        value?.[fieldKeys?.fieldLabel || ''] || '',
    )

    useEffect(() => {
        setSelDataType(
            type === 'code'
                ? CatalogType.CODETABLE
                : type === 'coderule'
                ? CatalogType.CODINGRULES
                : CatalogType.DATAELE,
        )
    }, [type])

    useEffect(() => {
        if (type === 'code') {
            setSelDataItems([
                {
                    label: fields?.[fieldKeys?.fieldLabel || 'code_table'],
                    key: fields?.[fieldKeys?.fieldId || 'code_table_id'],
                },
            ])
            setInputValue(fields?.[fieldKeys?.fieldLabel || 'code_table'])
        }
        if (type === 'standard') {
            setSelStandardItems([
                {
                    label: fields?.[fieldKeys?.fieldLabel || 'standard'],
                    key: fields?.[fieldKeys?.fieldId || 'standard_code'],
                },
            ])
            setInputValue(fields?.[fieldKeys?.fieldLabel || 'standard'])
        }

        if (type === 'coderule') {
            setSelStandardItems([
                {
                    label: fields?.[fieldKeys?.fieldLabel || 'coderule'],
                    key: fields?.[fieldKeys?.fieldId || 'coderule_code'],
                },
            ])
            setInputValue(fields?.[fieldKeys?.fieldLabel || 'coderule'])
        }
    }, [type, fields])

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        let myDetailIds: any[] = []
        // 码表详情
        if (dataId) {
            // 选择对话框中选择列表中码表查看详情
            myDetailIds = [{ key: dataId }]
            setDetailId(dataId)
        }
        const firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
        if (myDetailIds.length && firstId !== '') {
            setDetailIds(myDetailIds)
            if (dataType === CatalogType.DATAELE) {
                setDataEleDetailVisible(true)
                setDataEleMatchType(1)
            } else if (dataType === CatalogType.CODETABLE) {
                setCodeTbDetailVisible(true)
            } else if (dataType === CatalogType.CODINGRULES) {
                setCodeRuleDetailVisible(true)
            }
        }
    }

    return (
        <>
            <Input.Group compact className={styles.codeWrapper}>
                <Input
                    style={{ width: 'calc(100% - 70px)' }}
                    placeholder={placeholder || __('请选择')}
                    readOnly
                    allowClear
                    name="code"
                    value={inputValue}
                    status={status}
                />
                {inputValue && (
                    <CloseCircleFilled
                        onClick={() => {
                            onChange?.({})
                            setSelDataItems([])
                            setSelStandardItems([])
                            setInputValue('')
                        }}
                        className={styles.clearBtn}
                    />
                )}
                <Button onClick={() => setSelDataByTypeVisible(true)}>
                    {__('选择')}
                </Button>
            </Input.Group>

            {/* 选择码表/编码规则 */}
            {selDataByTypeVisible && (
                <SelDataByTypeModal
                    visible={selDataByTypeVisible}
                    ref={selDataRef}
                    onClose={() => {
                        setSelDataByTypeVisible(false)
                    }}
                    dataType={selDataType}
                    dataKey={
                        ['code', 'coderule'].includes(type) ? 'id' : 'code'
                    }
                    oprItems={
                        selDataType === CatalogType.CODETABLE
                            ? selDataItems
                            : selStandardItems
                    }
                    setOprItems={(o) => {
                        const [selectData] = o
                        if (selDataType === CatalogType.CODETABLE) {
                            setSelDataItems(o)
                            setInputValue(selectData?.label)
                        } else {
                            if (selectData?.key) {
                                setSelDataItems([
                                    {
                                        key: selectData?.key || '',
                                        label: selectData?.label || '',
                                    },
                                ])
                            }
                            setSelStandardItems(o)
                            setInputValue(selectData?.label)
                        }
                        onChange?.(
                            fieldKeys
                                ? {
                                      [fieldKeys.fieldId]: selectData?.key,
                                      [fieldKeys.fieldLabel]: selectData?.label,
                                  }
                                : selectData,
                        )
                    }}
                    handleShowDataDetail={handleShowDataDetail}
                    getContainer={getPopupContainer()}
                    stdRecParams={stdRecParams}
                    ruleRecParams={ruleRecParams}
                />
            )}
            {/* 查看码表详情 */}
            {detailIds && detailIds.length > 0 && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    title={__('码表详情')}
                    dictId={detailIds[0].key}
                    onClose={() => setCodeTbDetailVisible(false)}
                    handleError={(errorKey: string) => {
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            // form.setFieldValue('dict_id', [])
                            selDataRef?.current?.reloadData()
                            setDetailIds([])
                        }
                    }}
                    getContainer={getPopupContainer()}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={detailId}
                    onClose={() => setDataEleDetailVisible(false)}
                    dataEleMatchType={dataEleMatchType}
                    getContainer={getPopupContainer()}
                />
            )}
            {/* 查看编码规则详情，支持多选框查看详情 */}
            {codeRuleDetailVisible && !!detailId && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible && !!detailId}
                    id={detailId}
                    mulDetailIds={detailIds}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                    }}
                    getContainer={getPopupContainer()}
                />
            )}
        </>
    )
}

export default memo(SelectTableCodeOrStandard)
