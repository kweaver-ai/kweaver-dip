import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { Space } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { BusinessDomainType, BusinessTypeInfo } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { GlossaryIcon } from './GlossaryIcons'
import { getPlatformNumber } from '@/utils'

interface IObjType {
    value?: BusinessDomainType
    onChange?: (val: BusinessDomainType) => void
}
const ObjType: React.FC<IObjType> = ({
    value = BusinessDomainType.business_object,
    onChange,
}) => {
    const [selectedType, setSelectedType] = useState<BusinessDomainType>(
        BusinessDomainType.business_object,
    )
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        if (value) {
            setSelectedType(value)
        }
    }, [value])

    const handleClick = (val: BusinessDomainType) => {
        setSelectedType(val)
        onChange?.(val)
    }
    return (
        <div className={styles.objTypeWrapper}>
            <Space size={12}>
                {BusinessTypeInfo.filter(
                    (type) =>
                        type.value !== BusinessDomainType.business_activity,
                    //  ||platformNumber === LoginPlatform.default,
                ).map((type) => (
                    <div
                        className={classnames(
                            styles.typeItem,
                            selectedType === type.value &&
                                styles.selectedTypeItem,
                        )}
                        onClick={() => handleClick(type.value)}
                        key={type.value}
                    >
                        <GlossaryIcon
                            width="32px"
                            type={type.value}
                            fontSize="32px"
                        />
                        <div className={styles.infos}>
                            <div className={styles.name}>{type.name}</div>
                            <div className={styles.desc}>{type.desc}</div>
                        </div>
                        <div className={styles.checkContainer}>
                            <CheckOutlined className={styles.checkIcon} />
                        </div>
                    </div>
                ))}
            </Space>
        </div>
    )
}
export default ObjType
