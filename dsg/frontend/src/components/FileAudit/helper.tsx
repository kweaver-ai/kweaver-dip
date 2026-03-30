import { Button, Space } from 'antd'

import { ExclamationCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty, Loader } from '@/ui'
import { formatTime } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'
import styles from './styles.module.less'

// 统一的弹窗样式
export const getConfirmModal = ({ title, content, onOk }) => {
    return confirm({
        title,
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        content,
        onOk,
    })
}

// 抽屉footer
export const DrawerFooter = ({
    onSubmit,
    onClose,
}: {
    onSubmit: () => void
    onClose: () => void
}) => {
    return (
        <Space
            style={{ justifyContent: 'flex-end', display: 'flex' }}
            size={12}
        >
            <Button onClick={onClose}>{__('取消')}</Button>
            <Button onClick={onSubmit} type="primary">
                {__('确定')}
            </Button>
        </Space>
    )
}

// 详情展示中的分组样式
export const DetailGroupTitle = ({ title }: { title: string }) => {
    return <div className={styles.detailGroupTitle}>{title}</div>
}

/**
 * 空数据
 */
export const renderEmpty = ({
    desc = __('暂无数据'),
    marginTop = 36,
}: {
    desc?: string
    marginTop?: number
}) => (
    <Empty
        iconSrc={dataEmpty}
        desc={desc}
        style={{ marginTop, width: '100%' }}
    />
)

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)

/**
 * 操作
 */
export enum FileAuditOperate {
    // 审核
    Audit = 'Audit',

    // 预览
    Preview = 'Preview',
}

export const initSearch = {
    limit: 10,
    offset: 1,
}

// 详情列表
export const detailList = [
    {
        key: 'file_resource_name',
        label: __('文件资源名称'),
        span: 24,
        value: '',
    },
    {
        key: 'applier_name',
        label: __('申请人'),
        span: 24,
        value: '',
    },
    {
        key: 'apply_time',
        label: __('申请时间'),
        span: 24,
        value: '',
    },
    {
        key: 'description',
        label: __('描述'),
        span: 24,
        value: '',
    },
]

// 展示值
export const showValue = ({ actualDetails }: { actualDetails?: any }) => ({
    apply_time: formatTime(actualDetails?.apply_time) ?? '--',
})

// 刷新详情
export const refreshDetails = ({ actualDetails }: { actualDetails?: any }) => {
    // 根据详情列表的key，展示对应的value
    return actualDetails
        ? detailList?.map((i) => ({
              ...i,
              value:
                  showValue({
                      actualDetails,
                  })[i.key] ??
                  actualDetails[i.key] ??
                  '',
          }))
        : detailList
}
