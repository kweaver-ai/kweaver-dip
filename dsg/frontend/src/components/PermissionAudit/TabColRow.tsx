import { useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import RowColView from '../RowAndColFilter/RowColView'
import styles from './styles.module.less'
import { formatError, getSubViewById, IDatasheetField, ISubView } from '@/core'

function TabColRow({ fields, data, id }: any) {
    const [viewData, setViewData] = useState<ISubView>()
    const [viewFields, setViewFields] = useState<IDatasheetField[]>([])

    const loadSubView = async () => {
        try {
            const res = await getSubViewById(id)
            setViewData(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            loadSubView()
        } else {
            setViewData(data)
        }
        setViewFields(fields)
    }, [id, fields, data])

    return (
        <div className={styles.tabColRow}>
            <RowColView value={viewData} fields={viewFields} showTip={false} />
        </div>
    )
}

export default TabColRow
