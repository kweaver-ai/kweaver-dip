import { Drawer } from 'antd'
import { useMemo, useEffect } from 'react'
import styles from './styles.module.less'
import { ExplorationType } from './const'
import __ from '../locale'
import ExplorationForm from './ExplorationForm'
import { useDataViewContext } from '../DataViewProvider'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import Header from '@/components/BusinessDiagnosis/components/Header'

interface IDatasourceExploration {
    open: boolean
    onClose: (showTask?: boolean) => void
    type?: ExplorationType
    formView?: any
    datasourceId?: any
    hiddenRadio?: boolean
}

const DatasourceExploration = ({
    open,
    onClose,
    type = ExplorationType.Datasource,
    formView,
    hiddenRadio = false,
    datasourceId,
}: IDatasourceExploration) => {
    const [{ cssjj }] = useGeneralConfig()
    const { explorationData, setExplorationData } = useDataViewContext()

    useEffect(() => {
        setExplorationData((prev) => ({
            ...prev,
            explorationType: type,
        }))
    }, [type])

    useEffect(() => {
        setExplorationData((prev) => ({
            ...prev,
            dataViewId: formView?.id,
        }))
    }, [formView?.id])

    useEffect(() => {
        setExplorationData((pre) => ({
            ...pre,
            cssjj: !!cssjj,
        }))
    }, [cssjj])

    const title = useMemo(() => {
        return formView?.business_name
            ? __('配置库表探查规则')
            : __('配置数据源探查规则')
    }, [formView])

    return (
        <Drawer
            title={
                <Header
                    showGlobalMenu={false}
                    back={() => {
                        onClose()
                        setExplorationData({})
                    }}
                    leftContent={
                        <span
                            className={styles.explorationDrawerTitle}
                            title={title}
                        >
                            {title}
                        </span>
                    }
                />
            }
            placement="right"
            onClose={() => {
                onClose()
                setExplorationData({})
            }}
            closable={false}
            open={open}
            width="100%"
            className={styles.drawerWrapper}
            push={false}
        >
            <ExplorationForm
                hiddenRadio={hiddenRadio}
                formViewId={formView?.id}
                onClose={(flag?: boolean) => {
                    onClose(flag)
                    setExplorationData({})
                }}
                datasourceId={datasourceId}
                explorationType={type}
            />
        </Drawer>
    )
}

export default DatasourceExploration
