import React, { useState } from 'react'
import { Button, Modal, Space } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
// import guide1 from '@/assets/guideImage/guide1.gif'
// import guide2 from '@/assets/guideImage/guide2.gif'
// import guide3 from '@/assets/guideImage/guide3.gif'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface IGuideFlow {
    visible: boolean
    onClose: () => void
}

/**
 * 流程图的引导
 * @param visible 显示/隐藏
 * @param onClose 关闭
 * @param onSure 确定
 */
const GuideFlow: React.FC<IGuideFlow> = ({ visible, onClose }) => {
    const [userInfo] = useCurrentUser()
    // 引导信息
    const guideInfo = [
        {
            title: '工具栏',
            // img: guide1,
            desc: [
                '您可以拖拽或点击工具栏中泳道、流程、判定条件、子流程、文档等工具，绘制所需业务流程图',
            ],
        },
        {
            title: '关联业务节点表',
            // img: guide2,
            desc: [
                '点击【配置】按钮展开流程节点配置侧边栏，可通过关联已有业务表、新建业务表、导入业务表的方式将业务表与流程节点进行关联，助于建立业务与数据的关联',
            ],
        },
        {
            title: '流程复用/导入',
            // img: guide3,
            desc: [
                '点击【配置】按钮展开子流程节点配置侧边栏，可通过从已有流程中引用、新建流程、导入流程的方式将业务流程添加至当前流程中，实现快速复用。导入的节点若需关联业务表、业务流程，可进行替换操作',
                '替换方式：拖拽或选中需替换节点后、按Shift键同时点击所需工具栏中节点完成替换',
            ],
        },
    ]

    // 步骤
    const [step, setStep] = useState(0)

    // 上一步
    const handleUpPage = () => {
        setStep(step - 1)
    }

    // 下一步
    const handleDownPage = () => {
        if (step === 2) {
            handleClose()
            return
        }
        setStep(step + 1)
    }

    // 关闭引导并保存信息
    const handleClose = () => {
        if (localStorage.getItem('af_flowGuide') === null) {
            localStorage.setItem(
                'af_flowGuide',
                JSON.stringify({
                    [userInfo.ID]: true,
                }),
            )
        } else {
            const flowGuide = JSON.parse(
                localStorage.getItem('af_flowGuide') || '',
            )
            localStorage.setItem(
                'af_flowGuide',
                JSON.stringify({
                    ...flowGuide,
                    [userInfo.ID]: true,
                }),
            )
        }
        onClose()
    }

    // 页脚
    const footer = (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    color: 'rgba(0,0,0,0.65)',
                    cursor: 'pointer',
                    visibility: step === 2 ? 'hidden' : 'visible',
                }}
                onClick={handleClose}
            >
                {__('退出引导')}
            </div>
            <div>
                <Button hidden={step === 0} onClick={handleUpPage}>
                    {__('上一步')}
                </Button>
                <Button type="primary" onClick={handleDownPage}>
                    {step === 2 ? __('知道了') : __('下一步')}
                </Button>
            </div>
        </div>
    )

    return (
        <Modal
            title={null}
            width={640}
            maskClosable={false}
            open={visible}
            footer={footer}
            onCancel={handleClose}
            onOk={handleDownPage}
            closable={false}
            destroyOnClose
            getContainer={false}
            className={styles.guideFlowWrapper}
            bodyStyle={{
                padding: 0,
                maxHeight: 488,
            }}
        >
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
            </div> */}
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
            </div>
        </Modal>
    )
}

export default GuideFlow
