export const isJSONString = (str: string) => {
  try {
    if (JSON.parse(str) instanceof Object) {
      return true
    }
  } catch {
    return false
  }
}
