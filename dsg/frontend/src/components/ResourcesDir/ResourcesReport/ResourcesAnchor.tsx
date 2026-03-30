import { Anchor } from 'antd'
import { noop, trim } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { ResTypeEnum, reportAnchor } from '../const'

const { Link } = Anchor

interface ResourcesAnchorType {
    onClick?: () => void
    type: ResTypeEnum
    contentRef?: any
}
const ResourcesAnchor = ({
    type,
    contentRef,
    onClick = noop,
}: ResourcesAnchorType) => {
    return (
        <Anchor
            getContainer={() => {
                return (contentRef?.current as HTMLElement) || window
            }}
            onClick={(e: any) => e.preventDefault()}
            className={styles.anchorWrapper}
        >
            {type === ResTypeEnum.TABLE ? (
                reportAnchor?.map((link) => {
                    return (
                        <Link
                            href={`#${link.modKey}`}
                            title={link.title}
                            key={link.modKey}
                        />
                    )
                })
            ) : (
                <>
                    <Link href="#catalog" title={__('上报目录信息')} />
                    <Link href="#resource" title={__('上报资源信息')}>
                        <Link href="#requestBody" title={__('请求body')} />
                        <Link href="#responseBody" title={__('响应参数')} />
                    </Link>
                </>
            )}
        </Anchor>
    )
}
export default ResourcesAnchor
