import { FC, useState } from 'react'
import { noop, trim } from 'lodash'
import { Button, Form, Input } from 'antd'
import { FormInstance } from 'antd/es/form'
import { PasswordModel } from '../const'
import __ from '../locale'
import styles from '../styles.module.less'
import { passwordCharsRegex } from '@/utils'

interface IPasswordEditor {
    type?: PasswordModel
    onChangeModel?: (value: PasswordModel) => void
    form: FormInstance<any>
    isSystemManger?: boolean
}

const PasswordEditor: FC<IPasswordEditor> = ({
    type,
    onChangeModel = noop,
    form,
    isSystemManger = true,
}) => {
    const [hasError, setHasError] = useState(false)
    const getPasswordTemplate = (modelType) => {
        switch (modelType) {
            case PasswordModel.CREATE:
            case PasswordModel.EDIT:
                return (
                    <div className={styles.editPasswordWrapper}>
                        <div className={styles.passwordItem}>
                            <Form.Item
                                name="password"
                                label={__('密码')}
                                required={isSystemManger}
                                validateFirst
                                validateTrigger={['onBlur', 'onChange']}
                                rules={
                                    isSystemManger
                                        ? [
                                              {
                                                  required: true,
                                                  message: __('请输入密码'),
                                                  transform: (value) =>
                                                      trim(value),
                                              },
                                              {
                                                  pattern: passwordCharsRegex,
                                                  validateTrigger: ['onBlur'],
                                                  message: __(
                                                      '密码只能包含 英文、数字或 ~！%#$@-！字符，长度范围6~72个字符。',
                                                  ),
                                                  transform: (value) =>
                                                      trim(value),
                                              },
                                              //   {
                                              //       validateTrigger: ['onBlur'],
                                              //       validator: (_, value) => {
                                              //           const password = trim(
                                              //               form.getFieldValue(
                                              //                   'rePassword',
                                              //               ),
                                              //           )
                                              //           if (
                                              //               password &&
                                              //               trim(value) !==
                                              //                   password
                                              //           ) {
                                              //               form.setFields([
                                              //                   {
                                              //                       name: 'rePassword',
                                              //                       errors: [
                                              //                           __(
                                              //                               '两次输入的密码不一致, 请重新输入',
                                              //                           ),
                                              //                       ],
                                              //                   },
                                              //               ])
                                              //           }
                                              //           return Promise.resolve()
                                              //       },
                                              //   },
                                          ]
                                        : []
                                }
                            >
                                <Input.Password
                                    placeholder={__('请输入密码')}
                                    maxLength={72}
                                    visibilityToggle={false}
                                    disabled={!isSystemManger}
                                />
                            </Form.Item>
                        </div>
                        <div className={styles.passwordItem}>
                            <Form.Item
                                shouldUpdate={(preData, curData) => {
                                    if (preData.password !== curData.password) {
                                        return true
                                    }
                                    return false
                                }}
                            >
                                {({ getFieldValue }) => {
                                    const curPassword =
                                        getFieldValue('password')
                                    const rePassword =
                                        getFieldValue('rePassword')

                                    if (curPassword === rePassword) {
                                        form.setFields([
                                            {
                                                name: 'rePassword',
                                                errors: [],
                                            },
                                        ])
                                    }
                                    return (
                                        <Form.Item
                                            name="rePassword"
                                            label={__('确认密码')}
                                            validateTrigger={[
                                                'onBlur',
                                                'onChange',
                                            ]}
                                            required
                                            validateFirst
                                            rules={
                                                isSystemManger
                                                    ? [
                                                          {
                                                              required: true,
                                                              message:
                                                                  __(
                                                                      '请再次输入密码',
                                                                  ),
                                                          },
                                                          {
                                                              validateTrigger: [
                                                                  'onBlur',
                                                              ],
                                                              validator: (
                                                                  _,
                                                                  value,
                                                              ) => {
                                                                  const password =
                                                                      trim(
                                                                          form.getFieldValue(
                                                                              'password',
                                                                          ),
                                                                      )
                                                                  if (
                                                                      password &&
                                                                      trim(
                                                                          value,
                                                                      ) !==
                                                                          password
                                                                  ) {
                                                                      return Promise.reject(
                                                                          __(
                                                                              '两次输入的密码不一致, 请重新输入',
                                                                          ),
                                                                      )
                                                                  }
                                                                  return Promise.resolve()
                                                              },
                                                          },
                                                      ]
                                                    : []
                                            }
                                        >
                                            <Input.Password
                                                placeholder={__(
                                                    '请再次输入密码',
                                                )}
                                                maxLength={72}
                                                visibilityToggle={false}
                                                disabled={!isSystemManger}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </div>
                        {modelType === PasswordModel.EDIT && (
                            <div className={styles.btn}>
                                <Button
                                    type="link"
                                    onClick={() =>
                                        onChangeModel(PasswordModel.VIEW)
                                    }
                                    className={styles.btnText}
                                >
                                    {__('取消更改')}
                                </Button>
                            </div>
                        )}
                    </div>
                )
            case PasswordModel.VIEW:
                return (
                    <div className={styles.previewWrapper}>
                        <Form.Item
                            label={__('密码')}
                            required
                            style={{ marginBottom: 0 }}
                        >
                            <Input.Password
                                disabled
                                value="12345678"
                                visibilityToggle={false}
                            />
                        </Form.Item>
                        <div className={styles.buttonWrapper}>
                            <Button
                                type="link"
                                onClick={() => {
                                    onChangeModel(PasswordModel.EDIT)
                                    form.setFieldValue('password', '')
                                    form.setFieldValue('rePassword', '')
                                }}
                                className={styles.btn}
                                disabled={!isSystemManger}
                            >
                                {__('更改密码')}
                            </Button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className={styles.passwordContainer}>
            <div className={styles.passwordWrapper}>
                {getPasswordTemplate(type)}
            </div>
            {type !== PasswordModel.VIEW ? (
                <div className={styles.tips}>
                    {__('提示：')}
                    <br />
                    {__(
                        '密码只能包含 英文、数字或 ~！%#$@-！字符，长度范围6~72个字符。',
                    )}
                    <br />
                    {__('设置的密码无法再次查看，请妥善保管好您的密码。')}
                </div>
            ) : (
                <div className={styles.tips}>
                    {__('提示：设置的密码无法再次查看，请妥善保管好您的密码。')}
                </div>
            )}
        </div>
    )
}

export default PasswordEditor
