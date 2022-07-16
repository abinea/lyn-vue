/**
 * 判断标签是自闭合标签
 * @param {string} tagName
 */
export function isUnaryTag(tagName) {
  return ['input'].includes(tagName)
}

/**
 * 判断标签是否平台保留标签
 * @param {string} tagName
 */
export function isReserveTag(tagName) {
  const reserveTag = [
    'div',
    'input',
    'select',
    'option',
    'button',
    'h3',
    'span',
    'p',
    'template',
  ]
  return reserveTag.includes(tagName)
}
