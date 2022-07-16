/**
 * 从 AST 对象生成渲染函数
 * @param {AST} el
 */
export default function generate(el) {
  const renderStr = genElement(el)
  // 通过 new Function 将字符串形式的函数转换成可执行函数，并用 with 为渲染函数扩展作用域
  return new Function(`with(this) { return ${renderStr} }`)
}
/**
 *
 * _c(tag, attr, children)
 */
function genElement(el) {
  const { tag, rawAttr, attr } = el
  const attrs = { ...rawAttr, ...attr }
  const children = genChildren(el)
  if (tag === 'slot') {
    return `_t(${JSON.stringify(attrs)},[${children}])`
  }
  return `_c('${tag}',${JSON.stringify(attrs)},[${children}])`
}

/**
 * 处理 AST 节点的子节点，将子节点变成渲染函数
 * @param {*} el
 */
function genChildren(el) {
  const ret = [],
    { children } = el

  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i]
    if (child.type === 3) {
      // 文本节点
      ret.push(`_v(${JSON.stringify(child)})`)
    } else if (child.type === 1) {
      // 元素节点
      ret.push(genElement(child))
    }
  }
  return ret
}
