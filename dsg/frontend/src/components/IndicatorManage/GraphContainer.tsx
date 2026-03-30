import { useEffect, useRef, useState } from 'react'
import SceneGraph from './SceneGraph'
import { ModeType } from './const'
import styles from './styles.module.less'
import MoreAttribute from './MoreAttribute'
import { IndicatorProvider } from './IndicatorProvider'

const GraphContainer = () => {
    const [mode, setMode] = useState<ModeType>(ModeType.Definition)
    // 更多属性
    const [data, setData] = useState<any>()
    const ref = useRef<any>()
    const attrRef = useRef<any>()

    const handleChange = (values) => {
        setData(values)
    }

    const handleValidateMore = async () => {
        try {
            await attrRef.current?.form?.validateFields()
            await attrRef.current?.form?.submit()
            return true
        } catch (error) {
            return false
        }
    }

    return (
        <IndicatorProvider>
            <div className={styles.graphWrapper}>
                <SceneGraph
                    mode={mode}
                    setMode={setMode}
                    ref={ref}
                    onValidateMore={handleValidateMore}
                    moreData={data}
                />
                <div hidden={mode !== ModeType.More}>
                    <div className={styles.moreInfoContainer}>
                        <MoreAttribute ref={attrRef} onChange={handleChange} />
                    </div>
                </div>
            </div>
        </IndicatorProvider>
    )
}

export default GraphContainer
