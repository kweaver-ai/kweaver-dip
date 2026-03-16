import { ArrowRightOutlined } from '@ant-design/icons'
import { Sender, type SenderProps, Suggestion } from '@ant-design/x'
import { Flex, type GetProp, type GetRef, message } from 'antd'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Employee } from '@/apis'
import AppIcon from '../AppIcon'

interface AiInputProps extends SenderProps {
  /** 可选的数字员工列表（用于 @ 提示） */
  employees?: Employee[]
}

const AiInput: React.FC<AiInputProps> = ({ employees, onSubmit, onCancel, ...props }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [mentionedEmployees, setMentionedEmployees] = useState<Employee[]>([])
  type SuggestionItems = Exclude<GetProp<typeof Suggestion, 'items'>, () => void>
  const senderRef = useRef<GetRef<typeof Sender>>(null)

  // Mock send message
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false)
        message.success('Send message successfully!')
      }, 3000)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [loading])

  const suggestions: SuggestionItems = useMemo(() => {
    if (!employees || employees.length === 0) {
      return []
    }
    return employees.map((emp) => ({
      label: emp.name,
      value: String(emp.id),
      icon: <AppIcon icon={emp.icon} name={emp.name} size={16} />,
    }))
  }, [employees])

  return (
    <Flex vertical gap="middle" className="w-full">
      <Suggestion
        items={suggestions}
        onSelect={(val) => {
          const value = typeof val === 'string' ? val : (val as any)?.value
          if (!value) return
          const employee = employees?.find((emp) => String(emp.id) === String(value))
          if (!employee) return
          setMentionedEmployees((prev) => [...prev, employee])
          senderRef.current?.insert?.(
            [
              {
                type: 'tag',
                key: `employee_${employee.id}_${Date.now()}`,
                props: {
                  label: `@${employee.name}`,
                  value: String(employee.id),
                },
                formatResult: (value) => {
                  console.log('formatResult', value)
                  return `@${value}`
                },
              },
            ],
            'cursor',
            '@',
          )
        }}
      >
        {({ onTrigger, onKeyDown }) => {
          return (
            <Sender
              loading={loading}
              ref={senderRef}
              placeholder="Press Enter to send message"
              footer={(_, info: any) => {
                const { SendButton, LoadingButton } = info.components
                return (
                  <Flex justify="end" align="center">
                    {loading ? (
                      <LoadingButton type="primary" loading={loading} />
                    ) : (
                      <SendButton type="primary" shape="square" icon={<ArrowRightOutlined />} />
                    )}
                  </Flex>
                )
              }}
              onKeyDown={(e) => {
                if (e.key === '@' && suggestions.length > 0) {
                  onTrigger()
                }
                return onKeyDown(e)
              }}
              suffix={false}
              onSubmit={(v, slotConfig, skill) => {
                setLoading(true)
                console.log('onSubmit', senderRef.current?.getValue())
                onSubmit?.(v, slotConfig, skill)
                senderRef.current?.clear?.()
              }}
              onCancel={() => {
                setLoading(false)
                onCancel?.()
              }}
              slotConfig={[]}
              autoSize={{ minRows: 3, maxRows: 3 }}
              className="bg-[white]"
              {...props}
            />
          )
        }}
      </Suggestion>
    </Flex>
  )
}

export default AiInput
