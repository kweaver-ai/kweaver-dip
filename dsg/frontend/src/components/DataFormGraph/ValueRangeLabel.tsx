import { FC, useEffect, useState, CSSProperties } from 'react'
import { Button } from 'antd'
import {
    CodeStatus,
    StandardDataDetail,
    ValueRangeType,
    exChangeRangeDataToObj,
} from '../FormTableMode/const'
import {
    CatalogType,
    formatError,
    getCodeRuleDetails,
    getDataEleDetailById,
    getDictDetailById,
} from '@/core'

import __ from './locale'
import styles from './styles.module.less'

import ViewRuleRegular from '../FormTableMode/ViewRuleRegular'
import CodeStatusLabel from '../FormTableMode/CodeStatusLabel'
import { StateType } from '@/utils'
import DataEleDetails, { DataEleMatchType } from '../DataEleManage/Details'
import { StandardingOutlined } from '@/icons'

/**
 * 选择“编码规则/码表”
 */
interface ISelectValueRange {
    type: ValueRangeType
    value?: string
    style?: CSSProperties
    isStandard?: boolean
}

const ValueRangeLabel: FC<ISelectValueRange> = ({
    type,
    value,
    style,
    isStandard,
}) => {
    // 当前选择的数据结果
    const [selectedData, setSelectedData] = useState<any>()

    // 标准类型
    const [catalogViewType, setCatalogViewType] = useState<
        CatalogType.CODETABLE | CatalogType.CODINGRULES
    >(CatalogType.CODINGRULES)

    // 预览详情的信息
    const [codeViewId, setCodeViewId] = useState<string>('')

    const [details, setDetails] = useState<any>()

    // 编码规则/码表集合
    const standardRuleDetail: StandardDataDetail = new StandardDataDetail(
        [],
        [],
    )
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)

    const [detailId, setDetailId] = useState<string>('')
    useEffect(() => {
        if (value) {
            if (type === ValueRangeType.DataElement) {
                getDataElementDetail(value)
            } else {
                const objInfo = exChangeRangeDataToObj(value)
                setSelectedData(objInfo)
                if (objInfo.id) {
                    getCodeRuleDetail(objInfo.id)
                }
            }
        } else {
            setSelectedData(undefined)
        }
    }, [value, type])

    const getDataElementDetail = async (id) => {
        try {
            const { data } = await getDataEleDetailById({
                type: 2,
                value: id,
            })
            setSelectedData({
                id,
                name: data?.name_cn || data.name,
            })
            setDetails(data)
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 获取当前编码规则的详情
     * @param id
     */
    const getCodeRuleDetail = async (id) => {
        try {
            if (type) {
                if (type === ValueRangeType.CodeRule) {
                    const { data } = await getCodeRuleDetails(id)
                    setDetails(data)
                } else {
                    const { data } = await getDictDetailById(id)
                    setDetails(data)
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <div>
            <div className={styles.viewRulerWrapper} style={style}>
                <div className={styles.nameBox}>
                    <div className={styles.flexBox} title={selectedData?.name}>
                        {isStandard && (
                            <StandardingOutlined
                                style={{
                                    color: '#126ee3',
                                    marginRight: '8px',
                                    fontSize: 16,
                                }}
                            />
                        )}
                        {details?.ch_name || details?.name || details?.name_cn}
                    </div>

                    <CodeStatusLabel
                        status={
                            details?.deleted
                                ? CodeStatus.Deleted
                                : details?.state === StateType.DISABLE
                                ? CodeStatus.Disabled
                                : CodeStatus.Normal
                        }
                    />
                </div>

                <Button
                    type="link"
                    onClick={() => {
                        if (type === ValueRangeType.CodeRule) {
                            setCatalogViewType(CatalogType.CODINGRULES)
                            setCodeViewId(selectedData.id)
                        } else if (type === ValueRangeType.DataElement) {
                            setDataEleDetailVisible(true)
                            setDetailId(selectedData.id)
                        } else {
                            setCatalogViewType(CatalogType.CODETABLE)
                            setCodeViewId(selectedData.id)
                        }
                    }}
                >
                    {__('详情')}
                </Button>
            </div>
            {/* 选择码表/编码规则 */}
            {codeViewId && (
                <ViewRuleRegular
                    onClose={() => {
                        setCodeViewId('')
                    }}
                    codeRuleId={codeViewId}
                    open={!!codeViewId}
                    regularType={catalogViewType}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible && !!detailId}
                    dataEleId={detailId}
                    onClose={() => {
                        setDataEleDetailVisible(false)
                        setDetailId('')
                    }}
                    getContainer={false}
                    dataEleMatchType={DataEleMatchType.CODEMATCH}
                />
            )}
        </div>
    )
}

export default ValueRangeLabel
