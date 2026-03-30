import { Drawer } from 'antd'
import { noop } from 'lodash'
import { FC } from 'react'
import Config from './Config'

interface IConfigDrawer {
    visible: boolean
    getContainer?: any
    /**
     * 字段列表，可选。用于指定需要生成SQL语句的字段。
     */
    fieldList?: Array<any>
    /**
     * 默认的SQL语句，可选。当没有指定特定的SQL生成规则时，可以使用这个默认的SQL语句。
     */
    defaultSql?: string
    /**
     * 数据库表的ID，必需。用于标识生成SQL语句的具体数据库表。
     */
    dataViewId: string
    /**
     * 取消操作的回调函数，可选。当用户取消生成SQL语句的操作时，可以调用这个回调函数。
     */
    onCancel?: (sql: string) => void
    /**
     * 确认操作的回调函数，可选。当用户确认生成SQL语句的操作时，可以调用这个回调函数，并传入生成的SQL语句。
     * @param sql 生成的SQL语句
     */
    onConfirm?: (sql: string) => void

    onClose?: () => void
}
const ConfigDrawer: FC<IConfigDrawer> = ({
    visible,
    getContainer = false,
    fieldList = [],
    defaultSql = '',
    dataViewId,
    onCancel = noop,
    onConfirm = noop,
    onClose = noop,
}) => {
    return (
        <Drawer
            open={visible}
            // onClose={onClose}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={
                getContainer
                    ? {
                          position: 'absolute',
                      }
                    : {}
            }
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            getContainer={getContainer}
        >
            <Config
                fieldList={fieldList}
                defaultSql={defaultSql}
                dataViewId={dataViewId}
                onCancel={onCancel}
                onConfirm={onConfirm}
                onClose={onClose}
            />
        </Drawer>
    )
}

export default ConfigDrawer
