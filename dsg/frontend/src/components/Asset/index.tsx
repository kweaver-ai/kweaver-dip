/* eslint-disable no-param-reassign */
import { RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSize } from 'ahooks'
import { Drawer } from 'antd'
import { useRef, useState } from 'react'
import DataSource from './DataSource'
import TagClassification from './TagClassification'
import TagGrading from './TagGrading'
import styles from './styles.module.less'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import AssetClassification from './AssetClassification'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IAssetProps {
    needHeader?: boolean
}
function Asset({ needHeader = true }: IAssetProps) {
    const navigator = useNavigate()
    const [isGradeOpen] = useGradeLabelState()
    const [detailOpen, setDetailOpen] = useState(false)
    const ref = useRef<any>()
    const size = useSize(ref)
    const { checkPermission } = useUserPermCtx()
    const goToPage = (path: string) => {
        navigator(path)
    }

    return (
        <div className={styles.asset}>
            {needHeader && (
                <div className={styles['asset-top']}>
                    <div className={styles['asset-title']}>
                        <div>数据资源架构</div>
                        <div
                            onClick={() => goToPage('/asset-view/architecture')}
                        >
                            <span>详情</span>
                            <RightOutlined />
                        </div>
                    </div>
                    <div className={styles['asset-top-content']}>
                        <DataSource />
                    </div>
                </div>
            )}
            {checkPermission('manageDataClassification') && (
                <div className={styles['asset-center']}>
                    <div className={styles['asset-title']}>
                        <div>数据分类{isGradeOpen ? '分级' : ''}</div>
                        <div
                            onClick={() => {
                                if (needHeader) {
                                    goToPage('/asset-view/classification')
                                } else {
                                    setDetailOpen(true)
                                }
                            }}
                        >
                            <span>详情</span>
                            <RightOutlined />
                        </div>
                    </div>
                    <div className={styles['asset-center-table']} ref={ref}>
                        <div
                            className={styles['table-item']}
                            style={{ width: isGradeOpen ? '50%' : '100%' }}
                        >
                            <div className={styles['table-item-title']}>
                                分类统计
                            </div>
                            <div className={styles['table-item-view']}>
                                <TagClassification
                                    size={size}
                                    isGradeOpen={isGradeOpen}
                                />
                            </div>
                        </div>
                        {isGradeOpen && (
                            <div
                                className={styles['table-item']}
                                style={{ width: '50%' }}
                            >
                                <div className={styles['table-item-title']}>
                                    分级统计
                                </div>
                                <div className={styles['table-item-view']}>
                                    <TagGrading size={size} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {detailOpen && (
                <Drawer
                    title={null}
                    open={detailOpen}
                    closable={false}
                    contentWrapperStyle={{
                        width: '100%',
                        height: '100%',
                        boxShadow: 'none',
                        transform: 'none',
                        marginTop: 0,
                    }}
                    style={{
                        top: '52px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        position: 'absolute',
                    }}
                    headerStyle={{ display: 'none' }}
                    bodyStyle={{
                        padding: '0 0 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    destroyOnClose
                    maskClosable={false}
                    mask={false}
                    push={false}
                >
                    <AssetClassification
                        onClose={() => {
                            setDetailOpen(false)
                        }}
                    />
                </Drawer>
            )}
        </div>
    )
}

export default Asset
