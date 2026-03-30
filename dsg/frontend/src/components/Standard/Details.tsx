import React, { useState, useEffect } from 'react'
import { Row, Col, Divider } from 'antd'
import moment from 'moment'
import {
    formatError,
    quertStandardDetails,
    IStandardDetail,
    IStandardEnum,
    IStandardEnumData,
} from '@/core'
import CustomDrawer from '@/components/CustomDrawer'
import styles from './styles.module.less'
import {
    FieldShowType,
    IDetailConfig,
    detailBasicConfig,
    detailBusinessAttributesConfig,
    detailTechnicalAttributesConfig,
    detailAdditionalAttributesConfig,
    ListNameEnum,
    yesOrNoList,
} from './const'
import { StandardStatusLabel } from '../Forms/helper'
import __ from './locale'

interface IDetails {
    visible: boolean
    modalId: string
    formId?: string
    standardId?: number
    standardEnum?: IStandardEnum
    onClose?: () => void
}

const Details: React.FC<IDetails> = ({
    visible,
    modalId,
    formId,
    standardId,
    standardEnum,
    onClose = () => {},
}) => {
    const [detailsData, setDetailsData] = useState<IStandardDetail>()

    const getStandardDetail = async () => {
        if (!standardId && standardId !== 0) return
        try {
            const res = await quertStandardDetails(modalId, formId!, standardId)
            setDetailsData(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (visible && formId) {
            getStandardDetail()
        }
    }, [visible])

    const getValue = (
        type: FieldShowType,
        data: any,
        name: string,
        listName?: ListNameEnum,
    ) => {
        if (type === FieldShowType.BASIC) {
            return data?.[name] || data?.[name] === 0 ? data?.[name] : '--'
        }
        if (type === FieldShowType.TIME) {
            return data?.[name]
                ? moment(data?.[name]).format('YYYY-MM-DD HH:mm:ss')
                : '--'
        }

        if (type === FieldShowType.SELECT) {
            let list: IStandardEnumData[] | undefined
            if (listName === ListNameEnum.YESORNO) {
                list = yesOrNoList
            } else {
                list = listName && standardEnum?.[listName]
            }
            const res = list?.find((item) => item.value === data?.[name])
            return res ? res.type : '--'
        }

        if (type === FieldShowType.STATUS) {
            return <StandardStatusLabel value={data?.[name] || ''} />
        }

        return '--'
    }

    const getCommonComp = (config: IDetailConfig[], data: any) => {
        return config.map((info: IDetailConfig) => {
            // 数据类型为 数字型：展示数据长度和数据精度   字符型：展示数据长度 其他类型不展示
            if (info.dependence && info.dependenceValue) {
                if (!info.dependenceValue.includes(data?.[info.dependence])) {
                    return null
                }
            }
            return (
                <Col span={12} key={info.name}>
                    <div className={styles.infoWrapper}>
                        <div className={styles.label}>{info.label} :</div>
                        <div className={styles.value}>
                            {getValue(
                                info.type,
                                data,
                                info.name,
                                info?.listName,
                            )}
                        </div>
                    </div>
                </Col>
            )
        })
    }

    return (
        <div className={styles.detailsWrapper}>
            <CustomDrawer
                open={visible}
                onClose={onClose}
                isShowFooter={false}
                headerWidth={1140}
                title={detailsData?.base_info.name}
            >
                {visible && (
                    <div className={styles.bodyWrapper}>
                        <div className={styles.title}>{__('基本信息')}</div>
                        <Row>
                            {getCommonComp(
                                detailBasicConfig,
                                detailsData?.base_info,
                            )}
                        </Row>
                        <Divider className={styles.divider} />
                        <div className={styles.title}>{__('业务属性信息')}</div>
                        <Row>
                            {getCommonComp(
                                detailBusinessAttributesConfig,
                                detailsData?.business_attributes,
                            )}
                        </Row>
                        <Divider className={styles.divider} />
                        <div className={styles.title}>{__('技术属性信息')}</div>
                        <Row>
                            {getCommonComp(
                                detailTechnicalAttributesConfig,
                                detailsData?.technical_attributes,
                            )}
                        </Row>
                        <Divider className={styles.divider} />
                        <div className={styles.title}>{__('附加属性信息')}</div>
                        <Row>
                            {getCommonComp(
                                detailAdditionalAttributesConfig,
                                detailsData?.additional_attributes,
                            )}
                        </Row>
                    </div>
                )}
            </CustomDrawer>
        </div>
    )
}
export default Details
