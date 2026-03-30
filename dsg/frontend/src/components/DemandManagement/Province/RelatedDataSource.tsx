import { Button } from 'antd'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import { AddOutlined } from '@/icons'
import SelectDataResource from './SelectDataResource'
import Confirm from '@/components/Confirm'
import { ISSZDCatalog } from '@/core'
import { ResourceType } from './const'
import Catalog from './Catalog'

interface IRelatedDataSource {
    depId: string
    getRelatedRes: (res: ISSZDCatalog, type: ResourceType) => void
    resType?: ResourceType
}
const RelatedDataSource = ({
    depId,
    getRelatedRes,
    resType,
}: IRelatedDataSource) => {
    const [selectResOpen, setSelectResOpen] = useState(false)
    const [removeVisible, setRemoveVisible] = useState(false)
    const [dataSource, setDataSource] = useState<ISSZDCatalog>()
    // 挂接资源类型
    const [type, setType] = useState<ResourceType>()

    useEffect(() => {
        if (dataSource && type) {
            getRelatedRes(dataSource, type)
        }
    }, [dataSource])

    const getRes = (
        res: ISSZDCatalog | undefined,
        resourceType?: ResourceType,
    ) => {
        setDataSource(res)
        setType(resourceType)
    }

    return (
        <div className={classNames(styles['related-datasource-wrapper'])}>
            <div className={styles['title-container']}>
                <CommonTitle title={__('关联需求数据资源')} />
            </div>
            <div className={styles['select-res-row']}>
                <span className={styles['required-flag']}>*</span>
                <span className={styles.label}>{`${__(
                    '关联需求数据资源',
                )}：`}</span>
                <Button
                    icon={<AddOutlined />}
                    type="primary"
                    onClick={() => setSelectResOpen(true)}
                >
                    {__('选择已上报数据资源')}
                </Button>
            </div>
            <div className={styles['catalog-container']}>
                {dataSource && (
                    <Catalog
                        chooseResource={() => setSelectResOpen(true)}
                        removeResource={() => getRes(undefined)}
                        value={dataSource}
                        isImplement
                        attachedResourceType={type}
                    />
                )}
            </div>
            {selectResOpen && (
                <SelectDataResource
                    open={selectResOpen}
                    onClose={() => setSelectResOpen(false)}
                    getRes={getRes}
                    depId={depId}
                    resType={resType}
                />
            )}
            <Confirm
                open={removeVisible}
                title={__('确定要移除${name}目录吗？', {
                    name: '',
                })}
                content={__('移除后可重新加入，请确认。')}
                onOk={() => {
                    setDataSource(undefined)
                    setRemoveVisible(false)
                }}
                onCancel={() => {
                    setRemoveVisible(false)
                }}
                width={432}
            />
        </div>
    )
}

export default RelatedDataSource
