import { Form } from 'antd'
import { memo, useEffect } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useLanguageStore } from '@/stores/languageStore'
import AdPromptInput from '../AdPromptInput'
import { useDigitalHumanStore } from '../digitalHumanStore'
import NameDescriptionFields from './NameDescriptionFields'

const BasicSetting = ({ readonly }: { readonly?: boolean }) => {
  const { language } = useLanguageStore()
  const { basic, skills, updateBasic } = useDigitalHumanStore()
  const [form] = Form.useForm()

  const skillOptions = skills.map((skill) => ({
    label: skill.name,
    value: ` @${skill.name}`,
    type: 'text',
  }))

  useEffect(() => {
    form.setFieldsValue({
      name: basic.name,
      creature: basic.creature,
      soul: basic.soul,
    })
  }, [basic.name, basic.creature, basic.soul, form])

  const ROLE_INSTRUCTION_PLACEHOLDER: Record<string, string> = {
    'zh-CN': `# 角色
角色名称
# 角色描述
角色概述和主要职责的一句话描述
## 目标
角色的工作目标，如果有多目标可以分点列出
## 技能
为了实现目标，角色需要具备的技能1（可使用@调用技能）
为了实现目标，角色需要具备的技能2（可使用@调用技能）
为了实现目标，角色需要具备的技能3（可使用@调用技能）
`,

    'zh-TW': `設定 AI 應答規範請參照以下格式指南：
  
  # 角色任務
  描述Decision Agent的角色人設，期望完成的主要任務或目標。
  # 使用技能
  描述Decision Agent可用的元件，並說明如何使用這些技能。
  # 要求與限制
  指定回答的輸入格式、結果內容、風格要求或字數限制等。`,

    'en-US': `To set AI response specifications, please refer to the following format guide:
  
  # Role Task
  Describe the Decision Agent's persona and the main tasks or goals it is expected to accomplish.
  # Skill Usage
  Describe the components available to the Decision Agent and explain how to use these skills.
  # Requirements and Restrictions
  Specify the input format, result content, style requirements, word count limits, etc. for the responses.`,
  }

  if (readonly) {
    return (
      <ScrollBarContainer className="h-full flex flex-col p-6 flex-1">
        <div className="text-xl">基本信息</div>
        <div className="h-px w-full bg-[--dip-border-color] my-4 flex-shrink-0" />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <span className="text-base font-medium">名称</span>
            <span className="text-sm break-words">{basic.name}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">简介</span>
            <span className="text-sm whitespace-pre-wrap break-words">
              {basic.creature || '--'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">角色设定</span>
            <AdPromptInput
              bordered={false}
              transparent
              disabled
              value={basic.soul || '--'}
              style={{ minHeight: '200px' }}
              placeholder={''}
              trigger={[
                {
                  character: '@',
                  options: skillOptions,
                },
              ]}
            />
          </div>
        </div>
      </ScrollBarContainer>
    )
  }

  return (
    <ScrollBarContainer className="h-full flex flex-col p-6 flex-1">
      <div className="font-medium text-[--dip-text-color]">基本设定</div>
      <div className="mt-1 text-[--dip-text-color-45]">
        定义数字员工的名称、简介和核心职责描述。
      </div>
      <Form
        form={form}
        layout="vertical"
        className="mt-6"
        onValuesChange={(_, allValues) =>
          updateBasic({
            name: allValues.name,
            creature: allValues.creature,
            soul: allValues.soul,
          })
        }
      >
        <NameDescriptionFields />

        <Form.Item label="角色设定" name="soul" style={{ marginBottom: 0 }}>
          <AdPromptInput
            style={{ minHeight: '240px', maxHeight: 'calc(100vh - 476px)' }}
            placeholder={ROLE_INSTRUCTION_PLACEHOLDER[language]}
            trigger={[
              {
                character: '@',
                options: skillOptions,
              },
            ]}
          />
        </Form.Item>
      </Form>
    </ScrollBarContainer>
  )
}

export default memo(BasicSetting)
