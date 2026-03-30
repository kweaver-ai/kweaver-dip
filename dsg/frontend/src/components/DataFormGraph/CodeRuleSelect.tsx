import { Button, Select, Tooltip } from 'antd'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { CloseCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import classnames from 'classnames'
import {
    CatalogType,
    formatError,
    getCodeRuleDetails,
    IRuleRecParams,
    IStdRecParams,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import CodeStatusLabel from '../FormTableMode/CodeStatusLabel'
import { CodeStatus } from '../FormTableMode/const'
import { StateType } from '@/utils'
import SelDataByTypeModal from '../SelDataByTypeModal'

interface CodeTableSelectProps {
    value?: string
    onChange?: (value: string) => void
    style?: CSSProperties
    placeholder?: string
    disabled?: boolean
    getContainer?: any
    stdRecParams?: IStdRecParams
    ruleRecParams?: IRuleRecParams
    onSelectDetails?: (id: string, type: CatalogType) => void
}
const CodeRuleSelect = ({
    value,
    onChange = noop,
    style,
    placeholder,
    disabled,
    getContainer,
    stdRecParams,
    ruleRecParams,
    onSelectDetails = noop,
}: CodeTableSelectProps) => {
    const [selectedData, setSelectedData] = useState<any>(null)

    // 当前选择的数据详情
    const [selectedDataDetail, setSelectedDataDetail] = useState<any>()

    const [deleted, setDeleted] = useState<boolean>(false)

    // 预览详情的信息
    const [codeViewId, setCodeViewId] = useState<string>('')

    const [selCodeTable, setSelCodeTable] = useState<boolean>(false)

    const [oprItems, setOprItem] = useState<Array<any>>([])

    const [isViewDetail, setIsViewDetail] = useState<boolean>(true)

    // 弹窗的ref
    const codeTableRef: any = useRef()

    useEffect(() => {
        if (value) {
            getCodeTableDetail(value)
        } else {
            setSelectedData('')
            setSelectedDataDetail(null)
        }
    }, [value])

    useEffect(() => {
        setOprItem(
            selectedData
                ? [
                      {
                          key: selectedData.id,
                          label: selectedData.name,
                      },
                  ]
                : [],
        )
    }, [selectedData])

    /**
     * 获取码表详情
     * @param id 码表id
     */
    const getCodeTableDetail = async (id: string) => {
        try {
            const res = await getCodeRuleDetails(id)
            setSelectedData({
                id: value,
                name: res?.data?.name,
            })
            setSelectedDataDetail(res.data)
        } catch (err) {
            if (
                err.data.code === 'Standardization.ResourceError.DataNotExist'
            ) {
                setDeleted(true)
            } else {
                formatError(err)
            }
        }
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowCodeTableDetail = (
        dataType: CatalogType,
        dataId?: string,
    ) => {
        if (dataId) {
            if (isViewDetail) {
                // setCodeTableVisible(true)
                // setDetailId(dataId)
                onSelectDetails(dataId, CatalogType.CODINGRULES)
            } else {
                onSelectDetails(dataId, CatalogType.CODINGRULES)
            }
        }
    }

    return (
        <div
            className={`${styles.selectRulerWrapper} error-customer-style`}
            style={style}
        >
            <div className={styles.textNameWrapper}>
                {selectedData?.name ? (
                    <Tooltip
                        title={
                            (deleted || selectedDataDetail?.deleted) &&
                            __('已被删除，无法查看详情')
                        }
                    >
                        <Button
                            type="link"
                            className={styles.nameText}
                            disabled={deleted || selectedDataDetail?.deleted}
                            onClick={() => {
                                if (disabled) {
                                    return
                                }
                                setCodeViewId(selectedData.id)
                                onSelectDetails(
                                    selectedData.id,
                                    CatalogType.CODINGRULES,
                                )
                            }}
                            title={
                                selectedDataDetail?.ch_name ||
                                selectedDataDetail?.name ||
                                selectedData?.name
                            }
                        >
                            {selectedDataDetail?.ch_name ||
                                selectedDataDetail?.name ||
                                selectedData?.name}
                        </Button>
                    </Tooltip>
                ) : (
                    <span className={styles.namePlaceholder}>
                        {placeholder || __('请选择编码规则')}
                    </span>
                )}
                {selectedDataDetail ? (
                    <CodeStatusLabel
                        status={
                            deleted
                                ? CodeStatus.Deleted
                                : selectedDataDetail?.deleted
                                ? CodeStatus.Deleted
                                : selectedDataDetail?.state ===
                                  StateType.DISABLE
                                ? CodeStatus.Disabled
                                : CodeStatus.Normal
                        }
                    />
                ) : null}
            </div>
            <div className={styles.rightButtonBar}>
                {value && !disabled ? (
                    <CloseCircleFilled
                        onClick={() => {
                            onChange('')
                        }}
                        className={styles.clearBtn}
                    />
                ) : null}
                <div
                    onClick={(e) => {
                        if (!disabled) {
                            e.stopPropagation()
                            setSelCodeTable(true)
                            if (
                                deleted ||
                                selectedDataDetail?.deleted ||
                                selectedDataDetail?.state === StateType.DISABLE
                            ) {
                                onChange('')
                            }
                        }
                    }}
                    className={classnames(
                        styles.selectBtn,
                        disabled ? styles.selectBtnDisabled : '',
                    )}
                >
                    {__('选择')}
                </div>
            </div>

            {selCodeTable ? (
                <SelDataByTypeModal
                    visible={selCodeTable}
                    ref={codeTableRef}
                    onClose={() => {
                        setSelCodeTable(false)
                    }}
                    onOk={() => {
                        // form.validateFields(['std_files'])
                    }}
                    dataType={CatalogType.CODINGRULES}
                    rowSelectionType="radio"
                    oprItems={oprItems}
                    setOprItems={(newValue) => {
                        if (newValue[0]) {
                            // 数据元默认使用数据元code，若传dataKey为id，则使用key值
                            onChange(newValue[0].key as string)
                        }
                    }}
                    handleShowDataDetail={handleShowCodeTableDetail}
                    isEnableCodeRule
                    isEnableDict
                    getContainer={getContainer || false}
                    stdRecParams={stdRecParams}
                    ruleRecParams={ruleRecParams}
                />
            ) : null}
        </div>
    )
}

export default CodeRuleSelect
