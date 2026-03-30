/**
 * 加载图片
 * @param svgdata 图片名称
 * @returns
 */
const conbineSvg = (svgdata: string) => {
    return (
        <svg
            dangerouslySetInnerHTML={{
                __html: svgdata,
            }}
            viewBox="0 0 1024 1024"
        />
    )
}

/**
 * 根据图标名称获取图标
 * @param roleIcons
 * @param icon
 * @returns
 */
const getCurrentRoleIcon = (roleIcons: Array<any>, icon: string) => {
    if (!roleIcons.length) {
        return ''
    }
    return (
        roleIcons.find((roleIcon) => roleIcon.name === icon) || {
            icon: '',
        }
    ).icon
}

export { conbineSvg, getCurrentRoleIcon }
