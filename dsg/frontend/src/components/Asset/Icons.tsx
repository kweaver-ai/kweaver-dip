import CommonIcon from '@/components/CommonIcon'
import { ReactComponent as yewuyuSvg } from '@/icons/svg/colored/yewuyu.svg'
import { ReactComponent as zhutiyu1Svg } from '@/icons/svg/colored/zhutiyu1.svg'
import { ReactComponent as yewuduixiangSvg } from '@/icons/svg/colored/yewuduixiang.svg'
import { ReactComponent as yewuluojishitiSvg } from '@/icons/svg/colored/yewuluojishiti.svg'
import { ReactComponent as yewushuxingSvg } from '@/icons/svg/colored/yewushuxing.svg'
import { ReactComponent as bang1Svg } from '@/icons/svg/colored/cupOne.svg'
import { ReactComponent as bang2Svg } from '@/icons/svg/colored/cupTwo.svg'
import { ReactComponent as bang3Svg } from '@/icons/svg/colored/cupThree.svg'
import { ReactComponent as bang4Svg } from '@/icons/svg/colored/cupFour.svg'
import { ReactComponent as bang5Svg } from '@/icons/svg/colored/cupFive.svg'
import { ReactComponent as weizhiSvg } from '@/icons/svg/outlined/weizhi.svg'
import { ReactComponent as yewuxitongSvg } from '@/icons/svg/outlined/yewuxitong.svg'
import { ReactComponent as kuSvg } from '@/icons/svg/outlined/ku.svg'
import { ReactComponent as goujianshuSvg } from '@/icons/svg/outlined/goujianshu.svg'
import { ReactComponent as gerenSvg } from '@/icons/svg/outlined/geren.svg'
import { ReactComponent as tianchongxingSvg } from '@/icons/svg/colored/tianchongxing.svg'
import { ReactComponent as departmentSvg } from '@/icons/svg/outlined/department.svg'

function Icons({ type }: any) {
    let icon: any
    let fontSize: string = '16px'
    let color: any
    switch (type) {
        case '1':
            icon = yewuyuSvg
            fontSize = '48px'
            break
        case '2':
            icon = zhutiyu1Svg
            fontSize = '48px'
            break
        case '3':
            icon = yewuduixiangSvg
            fontSize = '48px'
            break
        case '4':
            icon = yewuluojishitiSvg
            fontSize = '48px'
            break
        case '5':
            icon = yewushuxingSvg
            fontSize = '48px'
            break
        case '6':
            icon = bang1Svg
            fontSize = '24px'
            break
        case '7':
            icon = bang2Svg
            fontSize = '24px'
            break
        case '8':
            icon = bang3Svg
            fontSize = '24px'
            break
        case '9':
            icon = bang4Svg
            fontSize = '24px'
            break
        case '10':
            icon = bang5Svg
            fontSize = '24px'
            break
        case '11':
            icon = weizhiSvg
            break
        case '12':
            icon = yewuxitongSvg
            break
        case '13':
            icon = kuSvg
            break
        case '14':
            icon = goujianshuSvg
            break
        case '15':
            icon = gerenSvg
            break
        case '16':
            icon = tianchongxingSvg
            fontSize = '20px'
            break
        case '17':
            icon = departmentSvg
            break
        default:
            icon = yewuyuSvg
    }
    return <CommonIcon icon={icon} style={{ fontSize, color }} />
}

export default Icons
