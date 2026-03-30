import { Typography, Tag } from 'antd'
import { useState, useEffect } from 'react'
import { noop } from 'lodash'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import styles from './styles.module.less'
import __ from './locale'
import { CloseOutlined } from '@/icons'
import { mountTypeOptions } from '@/components/ResourcesDir/const'

export const catlgSourceTypeList = []

export const searchFormData: IformItem[] = [
    {
        label: __('类型'),
        key: 'mount_type',
        options: [
            {
                label: __('不限'),
                value: '',
            },
            ...mountTypeOptions,
        ],
        type: SearchType.Radio,
        initLabel: __('类型不限'),
    },
]

/**
 * 带展开收起的标签组件
 * @param param0
 * @returns
 */
export const SelRescTags = ({
    initValue,
    valueKey,
    minRow = 3,
    maxTextLength = 15,
    onDelete = noop,
}: {
    initValue: Array<any>
    valueKey: string
    minRow?: number
    maxTextLength?: number
    onDelete?: (value: any) => void
}) => {
    const [ellipsis, setEllipsis] = useState<boolean>(false)
    const [visible, setVisible] = useState<boolean>(false) // 是否全部展示
    const { Paragraph, Text } = Typography

    useEffect(() => {
        setVisible(false)
    }, [initValue])

    return (
        <div className={styles.selRescTagTextView}>
            {/* <div
                style={{
                    maxHeight: '132px',
                    overflowY: 'auto',
                    flex: '1',
                }}
            > */}
            {/* <Paragraph
                    ellipsis={
                        visible
                            ? false
                            : {
                                  rows: minRow,
                                  expandable: true,
                                  onEllipsis: (status) => {
                                      setEllipsis(status)
                                  },
                                  symbol: (
                                      <span style={{ visibility: 'hidden' }}>
                                          Expand
                                      </span>
                                  ),
                              }
                    }
                > */}
            {initValue && initValue.length
                ? initValue.map((value, index) => (
                      <Tag
                          className={styles.checkedTag}
                          title={valueKey ? value[valueKey] : value}
                          key={index}
                      >
                          {/* {valueKey
                                      ? value[valueKey].length > maxTextLength
                                          ? `${value[valueKey].slice(
                                                0,
                                                maxTextLength,
                                            )}...`
                                          : value[valueKey]
                                      : value.length > maxTextLength
                                      ? `${value.slice(0, maxTextLength)}...`
                                      : value} */}
                          <div
                              className={styles.tagName}
                              title={value[valueKey]}
                          >
                              {value[valueKey]}
                          </div>
                          {value.is_auto_related ? (
                              <div className={styles.relateTag}>
                                  {__('自动关联')}
                              </div>
                          ) : (
                              <CloseOutlined
                                  className={styles.closeIcon}
                                  style={{
                                      fontSize: 16,
                                  }}
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onDelete(value)
                                  }}
                              />
                          )}
                      </Tag>
                  ))
                : '--'}
            {/* </Paragraph> */}
            {/* </div> */}
            {/* {ellipsis && (
                <div className={styles.btn}>
                    {visible ? (
                        <Button
                            type="link"
                            onClick={() => {
                                setVisible(false)
                            }}
                            style={{
                                fontSize: '12px',
                            }}
                        >
                            {__('收起')}
                            <UpOutlined />
                        </Button>
                    ) : (
                        <Button
                            type="link"
                            onClick={() => setVisible(true)}
                            style={{
                                visibility: ellipsis ? 'visible' : 'hidden',
                                fontSize: '12px',
                            }}
                        >
                            {__('展开')}
                            <DownOutlined />
                        </Button>
                    )}
                </div>
            )} */}
        </div>
    )
}

export enum SubmitActionType {
    // 暂存
    SAVE = 'save',
    // 提交发布
    SUBMIT = 'submit',
}
