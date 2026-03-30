import { FC, useState } from 'react'
import { noop } from 'lodash'
import { Button, Form, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { useQuery } from '@/utils'
import { TabsKey } from './const'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import ConfigIndcatorForm from './ConfigIndcatorForm'
import { formatError } from '@/core'
import GlobalMenu from '../GlobalMenu'
import IndicatorIcons from './IndicatorIcons'

interface IIndicatorEdit {
    dataId?: string
    domainDataId?: string
    modelDataId?: string
    indicatorDataType?: TabsKey
    onClose?: (needReload: boolean) => void
}
const IndicatorEdit: FC<IIndicatorEdit> = ({
    dataId,
    domainDataId,
    modelDataId,
    indicatorDataType,
    onClose = noop,
}) => {
    const query = useQuery()

    const indicatorId = query.get('indicatorId') || dataId
    const domainId = query.get('domainId') || domainDataId
    const modelId = query.get('modelId') || modelDataId
    const indicatorType =
        (query.get('indicatorType') as TabsKey) || indicatorDataType

    const [form] = Form.useForm()
    const [hasChange, setHasChange] = useState<boolean>(false)
    const navigate = useNavigate()
    const [saveLoading, setSaveLoading] = useState<boolean>(false)

    /**
     *  获取抽屉的title
     * @returns
     */
    const getReturnTitle = (curentKey) => {
        switch (curentKey) {
            case TabsKey.ATOMS:
                return indicatorId ? __('编辑原子指标') : __('新建原子指标')
            case TabsKey.DERIVE:
                return indicatorId ? __('编辑衍生指标') : __('新建衍生指标')
            case TabsKey.RECOMBINATION:
                return indicatorId ? __('编辑复合指标') : __('新建复合指标')
            default:
                return ''
        }
    }

    const handleUpdateOrCreate = async () => {
        setSaveLoading(true)
        try {
            await form.submit()
        } catch (error) {
            formatError(error)
        } finally {
            setSaveLoading(false)
        }
    }

    return (
        <div className={styles.CreateIndicatorWrap}>
            <div className={styles.titleWrap}>
                <div className={styles.titleWrapContainer}>
                    <GlobalMenu />
                    <div
                        className={styles.return}
                        onClick={() => {
                            if (hasChange) {
                                ReturnConfirmModal({
                                    onCancel: () => {
                                        form.resetFields()
                                        setHasChange(false)
                                        onClose(false)
                                    },
                                })
                            } else {
                                form.resetFields()
                                onClose(false)
                            }
                        }}
                    >
                        <LeftOutlined style={{ fontSize: 16 }} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <div className={styles.drawerTitle}>
                        <div className={styles.titleIcon}>
                            <IndicatorIcons
                                type={indicatorType}
                                fontSize={20}
                            />
                        </div>
                        {getReturnTitle(indicatorType)}
                    </div>
                </div>
            </div>
            <div className={styles.content}>
                <ConfigIndcatorForm
                    form={form}
                    indicatorType={indicatorType}
                    onChange={() => {
                        setHasChange(true)
                    }}
                    domainId={domainId}
                    modelId={modelId}
                    onFinish={() => {
                        setSaveLoading(false)
                        form.resetFields()
                        onClose(true)
                    }}
                    indicatorId={indicatorId}
                />
            </div>
            <div className={styles.footer}>
                <Space>
                    <Button
                        className={styles.btn}
                        onClick={() => {
                            onClose(false)
                            form.resetFields()
                        }}
                    >
                        {__('取消')}
                    </Button>

                    <Button
                        type="primary"
                        className={styles.btn}
                        loading={saveLoading}
                        disabled={saveLoading}
                        onClick={handleUpdateOrCreate}
                    >
                        {indicatorId ? __('更新指标') : __('发布')}
                    </Button>
                </Space>
            </div>
        </div>
    )
}
export default IndicatorEdit
