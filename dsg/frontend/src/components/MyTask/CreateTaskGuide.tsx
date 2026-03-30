import React, { useEffect, useState } from 'react'
import { Modal, Radio, RadioChangeEvent } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import freeTaskGuide from '@/assets/guideImage/freeTaskGuide.svg'
import projectTaskGuide from '@/assets/guideImage/projectTaskGuide.svg'

interface ICreateTaskGuide {
    visible: boolean
    onSure: (type: string) => void
    onClose: () => void
}

/**
 * 我的任务创建引导
 * @param visible 显示/隐藏
 * @param onSure 确定
 * @param onClose 关闭
 */
const CreateTaskGuide: React.FC<ICreateTaskGuide> = ({
    visible,
    onSure,
    onClose,
}) => {
    // 选择任务分类
    const [selectedType, setSelectedType] = useState<'free' | 'project'>(
        'project',
    )

    // 引导信息
    const guideInfo = [
        {
            title: __('项目任务'),
            img: projectTaskGuide,
            desc: __('您可以在一个多人协作的业务运营项目中进行任务分配'),
            type: 'project',
        },
        {
            title: __('独立任务'),
            img: freeTaskGuide,
            desc: __('您可以创建一个能让用户独立完成的轻量级任务'),
            type: 'free',
        },
    ]

    useEffect(() => {
        setSelectedType('project')
    }, [visible])

    return (
        <Modal
            title={__('新建任务')}
            width={480}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={() => onSure(selectedType)}
            destroyOnClose
            getContainer={false}
            bodyStyle={{
                height: 284,
            }}
        >
            <div className={styles.createTaskGuideWrapper}>
                {guideInfo.map((g) => {
                    return (
                        <div
                            key={g.title}
                            className={classnames(
                                styles.ctg_listWrapper,
                                selectedType === g.type &&
                                    styles.ctg_listSelected,
                            )}
                            onClick={() => setSelectedType(g.type as any)}
                        >
                            <Radio checked={g.type === selectedType} />
                            <img
                                src={g.img}
                                alt=""
                                className={styles.ctg_icon}
                            />
                            <div className={styles.ctg_infoWrapper}>
                                <div className={styles.ctg_title}>
                                    {g.title}
                                </div>
                                <div>{g.desc}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {/* <div className={styles.gf_imageWrapper}>
                <img
                    style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '4px 4px 0 0',
                    }}
                    src={guideInfo[step].img}
                    alt=""
                />
            </div>
            <div className={styles.df_descWrapper}>
                <div className={styles.df_title}>
                    {guideInfo[step].title}
                    <span className={styles.df_step}>{step + 1}/3</span>
                </div>
                <div className={styles.df_desc}>
                    <Space size={12} direction="vertical">
                        {guideInfo[step].desc.map((d) => (
                            <div className={styles.df_descItem} key="d">
                                <div className={styles.df_dot} />
                                {d}
                            </div>
                        ))}
                    </Space>
                </div>
            </div> */}
        </Modal>
    )
}

export default CreateTaskGuide
