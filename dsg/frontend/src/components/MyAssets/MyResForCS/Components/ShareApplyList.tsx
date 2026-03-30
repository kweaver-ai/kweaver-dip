import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { RefreshBtn } from '@/components/ToolbarComponents'
import __ from '../locale'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import { ResTypeEnum } from '../const'
import {
    formatError,
    getAppliedApiShareApplyList,
    getAppliedViewShareApplyList,
    IAppliedApiShareApplyItem,
    IAppliedViewShareApplyItem,
} from '@/core'

const ShareApplyList = ({
    id,
    type,
    getSelectedApply,
}: {
    id: string
    type: ResTypeEnum
    getSelectedApply: (
        apply: IAppliedApiShareApplyItem | IAppliedViewShareApplyItem,
    ) => void
}) => {
    const [selectedApply, setSelectedApply] = useState<
        IAppliedApiShareApplyItem | IAppliedViewShareApplyItem
    >()
    const [applyList, setApplyList] = useState<
        (IAppliedApiShareApplyItem | IAppliedViewShareApplyItem)[]
    >([])
    const [keyword, setKeyword] = useState<string>('')

    useEffect(() => {
        getDataList()
    }, [id, type])

    useUpdateEffect(() => {
        setApplyList(
            applyList.filter((item) =>
                item.share_apply_name
                    .toLocaleLowerCase()
                    .includes(keyword.toLocaleLowerCase()),
            ) as any,
        )
    }, [keyword])

    const getDataList = async () => {
        try {
            if (!id) return
            const req =
                type === ResTypeEnum.Api
                    ? getAppliedApiShareApplyList
                    : getAppliedViewShareApplyList
            const res = (await req(id)) as (
                | IAppliedApiShareApplyItem
                | IAppliedViewShareApplyItem
            )[]
            if (keyword) {
                setApplyList(
                    res.filter((item) =>
                        item.share_apply_name
                            .toLocaleLowerCase()
                            .includes(keyword.toLocaleLowerCase()),
                    ) as any,
                )
            } else {
                setApplyList(res)
            }

            if (res.length > 0 && !selectedApply) {
                setSelectedApply(res[0])
                getSelectedApply(res[0])
            }
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles['apply-list-container']}>
            <div className={styles['apply-list-header']}>
                <div className={styles.title}>{__('共享申请清单')}</div>
                <RefreshBtn onClick={getDataList} />
            </div>
            <SearchInput
                placeholder={__('搜索共享申请单名称')}
                style={{ width: '100%' }}
                onKeyChange={(kw: string) => {
                    setKeyword(kw)
                }}
            />
            <div className={styles['apply-list-content']}>
                {keyword && applyList.length === 0 && <Empty />}
                {applyList.map((item) => (
                    <div
                        key={item.share_apply_id}
                        className={classNames(styles['apply-item'], {
                            [styles['selected-apply-item']]:
                                selectedApply?.share_apply_id ===
                                item.share_apply_id,
                        })}
                        onClick={() => {
                            setSelectedApply(item)
                            getSelectedApply(item)
                        }}
                    >
                        <FontIcon
                            type={IconType.COLOREDICON}
                            name="icon-gongxiangshenqing"
                            className={styles['apply-icon']}
                        />
                        <div className={styles['item-content']}>
                            <div
                                className={styles['apply-name']}
                                title={item.share_apply_name}
                            >
                                {item.share_apply_name}
                            </div>
                            <div
                                className={styles['apply-code']}
                                title={item.share_apply_code}
                            >
                                {item.share_apply_code}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ShareApplyList
