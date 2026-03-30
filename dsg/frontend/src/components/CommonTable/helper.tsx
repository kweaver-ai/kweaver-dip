export const paramsIsNull = (data) => {
    return Object.values(data).some((item) => !!item)
}
