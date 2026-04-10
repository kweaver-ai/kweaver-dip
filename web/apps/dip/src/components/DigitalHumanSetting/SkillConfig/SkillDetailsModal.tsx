// import type { ModalProps } from 'antd'
// import { Modal } from 'antd'
// import type { DigitalHumanSkill } from '@/apis'
// import AiPromptInput from '@/components/DipChatKit/components/AiPromptInput'
// import ScrollBarContainer from '@/components/ScrollBarContainer'

// export interface SelectSkillModalProps extends Omit<ModalProps, 'onCancel'> {
//   onOk: (result: DigitalHumanSkill[]) => void
//   onCancel: () => void
//   skill: DigitalHumanSkill
// }

// /** 技能详情 */
// const SkillDetailsModal = ({ open, onCancel }: SkillDetailsModalProps) => {
//   return (
//     <Modal
//       title="技能详情"
//       open={open}
//       onCancel={onCancel}
//       width={744}
//       mask={{ closable: false }}
//       destroyOnHidden
//       styles={{
//         body: { paddingTop: 8 },
//       }}
//       footer={null}
//     >
//       <div className="flex flex-col gap-y-6">
//         <ScrollBarContainer className="grid max-h-[400px] overflow-y-auto relative min-h-[180px] mx-[-24px] px-6">
//           {renderContent()}
//         </ScrollBarContainer>
//       </div>
//     </Modal>
//   )
// }

// export default SelectSkillModal
