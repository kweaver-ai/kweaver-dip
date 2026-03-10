/**
 * 对两个值（即objA和objB）进行浅相等性比较，以确定它们是否相等。
 * 如果两个变量objA和objB已经严格相等，或者满足以下所有条件，则相等性检查返回 true ：
 * objA和objB它们都是具有相同键的对象。
 * 对于每个键，其值objA和objB值严格相等（===）
 * 如果compare提供了（预期为函数）参数，则会调用该参数来比较值。如果compare该参数返回undefined（即void 0），则比较操作将由函数本身处理shallowequal。
 * 该compare函数绑定到compareContext并调用三个参数：(value, other, key)。
 * @param objA 第一个对象
 * @param objB 第二个对象
 * @param compare 比较函数
 * @param compareContext 比较函数上下文
 * @returns 是否相等
 */
function shallowEqual(objA: any, objB: any, compare?: any, compareContext?: any): boolean {
  var ret = compare ? compare.call(compareContext, objA, objB) : void 0
  var idx: number
  var key: string
  var valueA: any
  var valueB: any

  if (ret !== void 0) {
    return !!ret
  }

  if (Object.is(objA, objB)) {
    return true
  }

  if (typeof objA !== 'object' || !objA || typeof objB !== 'object' || !objB) {
    return false
  }

  var keysA = Object.keys(objA)
  var keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB)

  // Test for A's keys different from B.
  for (idx = 0; idx < keysA.length; idx++) {
    key = keysA[idx]

    if (!bHasOwnProperty(key)) {
      return false
    }

    valueA = objA[key]
    valueB = objB[key]

    ret = compare ? compare.call(compareContext, valueA, valueB, key) : void 0

    if (ret === false || (ret === void 0 && !Object.is(valueA, valueB))) {
      return false
    }
  }

  return true
}

export default shallowEqual
