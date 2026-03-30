import React, { useState, useRef, useEffect, useContext, useMemo } from 'react'
import { Button, Divider } from 'antd'
import BusinessForm from './BusinessForm'
import StandardContent from './StandardContent'
import empty from '@/assets/emptyAdd.svg'
import {
    IFormData,
    IQueryForms,
    queryForms,
    formatError,
    TaskStatus,
    transformQuery,
} from '@/core'
import { getInitForm, TabKey, defaultMenu } from './const'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import { FormType } from '../Forms/const'
import Loader from '@/ui/Loader'
import { TaskInfoContext } from '@/context'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface IStandard {
    modalId: string
    switchTab: (key: TabKey, formType?: FormType) => void
}

const Standard: React.FC<IStandard> = ({ modalId, switchTab }) => {
    const ref = useRef({})

    const [forms, setForms] = useState<IFormData[]>([])

    const [selectedForm, setSelectedForm] = useState<IFormData>(getInitForm())

    const [total, setTotal] = useState(0)

    const [loading, setLoading] = useState(true)

    const [searchCondition, setSearchCondition] = useState<IQueryForms>({
        offset: 1,
        limit: 20,
        keyword: '',
        type: 2, // 2代表默认查业务表
        rate: 1, // 1代表查看字段标准化率信息
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })

    const { taskInfo } = useContext(TaskInfoContext)
    const { isDraft, selectedVersion } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 编辑等更新后表单列表应保持之前的选中状态
    const getFormList = async () => {
        try {
            const res = await queryForms(modalId, {
                ...searchCondition,
                ...versionParams,
            })

            setTotal(res.total_count)
            setForms(res.entries || [])
            setLoading(false)
            if (res.entries.length === 0) return
            // 被选中项数据重置
            if (selectedForm.id !== '') {
                const tempForm = res.entries?.find(
                    (item) => selectedForm?.id === item.id,
                )
                if (tempForm) {
                    setSelectedForm(tempForm)
                }
                return
            }

            setSelectedForm(res.entries?.[0])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getFormList()
    }, [JSON.stringify(searchCondition), modalId])

    const formsEmpty = () => {
        const descComp =
            taskInfo.taskStatus === TaskStatus.COMPLETED ? (
                '暂无数据'
            ) : (
                <>
                    <div> 系统中还未添加任何业务表单 </div>
                    <div>
                        请先至
                        <Button
                            type="link"
                            onClick={() => {
                                switchTab(TabKey.FORM, FormType.STANDARD)
                            }}
                        >
                            「表单」
                        </Button>
                        板块添加表单后再新建字段标准
                    </div>
                </>
            )
        return <Empty desc={descComp} iconSrc={empty} />
    }
    return (
        <div className={styles.bussinessStandard}>
            <div className={styles.standardtContent}>
                {loading ? (
                    <div style={{ width: '100%' }}>
                        <Loader />
                    </div>
                ) : forms.length === 0 && !searchCondition.keyword ? (
                    <div className={styles.emptyForm}>{formsEmpty()}</div>
                ) : (
                    <>
                        <BusinessForm
                            ref={ref}
                            total={total}
                            forms={forms}
                            selectedForm={selectedForm}
                            setSelectedForm={setSelectedForm}
                            searchCondition={searchCondition}
                            setSearchCondition={setSearchCondition}
                        />
                        <Divider
                            type="vertical"
                            style={{
                                height: 'calc(100% + 48px)',
                                marginTop: -16,
                                marginLeft: 0,
                            }}
                        />
                        <StandardContent
                            form={selectedForm}
                            modalId={modalId}
                            updateFormList={getFormList}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default Standard
