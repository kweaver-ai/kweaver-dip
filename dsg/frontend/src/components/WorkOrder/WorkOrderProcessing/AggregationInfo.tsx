import { forwardRef, useImperativeHandle, useRef } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { SourceTypeEnum } from '../WorkOrderManage/helper'
import AggregationAsset from './AggregationAsset'
import AggregationCollection from './AggregationCollection'
import __ from './locale'

const AggregationInfo = forwardRef(
    ({ readOnly, data, fromType, onClose }: any, ref) => {
        const collectionRef = useRef<any>()
        const assetRef = useRef<any>()

        const renderEmpty = () => {
            return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
        }

        // 添加验证方法
        const validate = () => {
            if (readOnly) return { valid: true }

            if (fromType === SourceTypeEnum.BUSINESS_FORM) {
                return (
                    assetRef?.current?.validate?.() || {
                        valid: false,
                        message: __('业务表归集资源验证失败'),
                    }
                )
            }
            return (
                collectionRef?.current?.validate?.() || {
                    valid: false,
                    message: __('归集资源验证失败'),
                }
            )
        }

        // 获取表单数据
        const getFormData = () => {
            if (readOnly) return {}

            if (fromType === SourceTypeEnum.BUSINESS_FORM) {
                return assetRef?.current?.getFormData?.() || {}
            }
            return collectionRef?.current?.getFormData?.() || {}
        }

        const handleSubmit = () => {
            if (!readOnly) {
                if (fromType === SourceTypeEnum.BUSINESS_FORM) {
                    assetRef?.current?.handleFinish()
                } else {
                    collectionRef?.current?.handleFinish()
                }
            }
        }

        const onResourceChange = () => {
            if (!readOnly) {
                if (fromType === SourceTypeEnum.BUSINESS_FORM) {
                    assetRef?.current?.handleFinish()
                }
                collectionRef?.current?.handleFinish()
            }
        }

        useImperativeHandle(ref, () => ({
            handleSubmit,
            onResourceChange,
            validate,
            getFormData,
        }))

        return (
            <div>
                {readOnly &&
                !data?.data_aggregation_inventory?.resources?.length ? (
                    <div>{renderEmpty()}</div>
                ) : fromType === SourceTypeEnum.BUSINESS_FORM ? (
                    <AggregationAsset
                        ref={assetRef}
                        readOnly={readOnly}
                        data={data}
                        onClose={onClose}
                    />
                ) : fromType === SourceTypeEnum.PLAN ||
                  fromType === SourceTypeEnum.STANDALONE ||
                  fromType === SourceTypeEnum.PROJECT ||
                  fromType === SourceTypeEnum.SUPPLY_AND_DEMAND ? (
                    <AggregationCollection
                        ref={collectionRef}
                        readOnly={readOnly}
                        fromType={fromType}
                        data={data}
                        onClose={onClose}
                    />
                ) : (
                    <div>{renderEmpty()}</div>
                )}
            </div>
        )
    },
)

export default AggregationInfo
