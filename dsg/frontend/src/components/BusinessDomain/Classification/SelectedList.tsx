import { useEffect, useState } from 'react'
import classnames from 'classnames'
import { DownOutlined } from '@ant-design/icons'
import { formatError, getBusinessObjDefine } from '@/core'
import { FontIcon } from '@/icons'
import GroupContainer from './GroupContainer'
import { useClassificationContext } from './ClassificationProvider'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import empty from '@/assets/dataEmpty.svg'
import __ from '../locale'

interface SelectedListProps {
    objectiveId: string
}
const SelectedList = ({ objectiveId }: SelectedListProps) => {
    useEffect(() => {
        getSelectedList()
    }, [objectiveId])

    const [treeData, setTreeData] = useState<Array<any>>([])
    const { selectedAttribute, setSelectedAttribute, updateEmptyStatus } =
        useClassificationContext()

    // 获取已选列表
    const getSelectedList = async () => {
        try {
            const res = await getBusinessObjDefine(objectiveId)
            setSelectedAttribute(res?.logic_entities[0]?.attributes[0])
            setTreeData(res?.logic_entities || [])
            if (res?.logic_entities?.length === 0) {
                updateEmptyStatus(true)
            }
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.selectedListContainer}>
            {treeData?.length ? (
                treeData.map((item, index) => {
                    return (
                        <GroupContainer
                            data={item}
                            defaultExpand={index === 0}
                            key={item.id}
                        >
                            <div>
                                {item.attributes.map((attr) => (
                                    <div
                                        key={attr.id}
                                        onClick={() =>
                                            setSelectedAttribute(attr)
                                        }
                                        className={classnames(
                                            styles.leafContainer,
                                            {
                                                [styles.selected]:
                                                    selectedAttribute.id ===
                                                    attr.id,
                                            },
                                        )}
                                    >
                                        <FontIcon
                                            name="icon-shuxing"
                                            style={{
                                                fontSize: 20,
                                                color: 'rgba(245, 137, 13, 1)',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            className={styles.leafNodeText}
                                            title={attr.name}
                                        >
                                            {attr.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </GroupContainer>
                    )
                })
            ) : (
                <div className={styles.emptyWrapper}>
                    <Empty iconSrc={empty} desc={__('暂无属性')} />
                </div>
            )}
        </div>
    )
}

export default SelectedList
