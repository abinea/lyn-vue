import { isUnaryTag } from '../utils.js'

export default function parse(template) {
  // 最终返回的 AST
  let root = null
  // 备份模板
  let html = template
  // 存放 AST 对象
  const stack = []
  while (html.trim()) {
    if (html.indexOf('<!--') === 0) {
      // 存在注释标签
      const endIdx = html.indexOf('-->')
      html = html.slice(endIdx + 3)
      continue
    }
    const startIdx = html.indexOf('<')
    if (startIdx === 0) {
      // 匹配到正常标签，<div id="app"> </div>
      if (html.indexOf('</') === 0) {
        // 结束标签
        parseEnd()
      } else {
        // 开始标签
        parseStartTag()
      }
    } else if (startIdx > 0) {
      // 在开始标签之前有一段文本，<div id="app"> text </div>
      // 在html 字符串中找到下一个标签的位置
      const nextStartIdx = html.indexOf('<')
      if (stack.length) {
        // stack 不为空，说明文本是栈顶元素的文本节点
        processChars(html.slice(0, nextStartIdx))
      }
      html = html.slice(nextStartIdx)
    } else {
      // 整个 template 中没有标签，即纯文本
      // 不考虑该情况
    }
  }
  return root

  /**
   * 处理开始标签，比如 <div id="app"> <h3>
   */
  function parseStartTag() {
    const endIdx = html.indexOf('>')
    // 截取开始标签中所有内容，'div id="app"'
    const content = html.slice(1, endIdx)
    // 更新 html，将 content 从 html 截断
    html = html.slice(endIdx + 1)
    // 标签名和属性字符串
    let tagName = '',
      attrStr = ''
    // 找到 content 中的第一个空格
    const firstSpaceIdx = content.indexOf(' ')
    if (firstSpaceIdx === -1) {
      // 没找到空格，说明标签没有属性，<h3>title</h3>
      tagName = content
    } else {
      // 标签名，<div>
      tagName = content.slice(0, firstSpaceIdx)
      // 属性字符串。id="app"
      attrStr = content.slice(firstSpaceIdx + 1)
    }
    // ['id="app"','class="test"]
    const attrs = attrStr ? attrStr.split(' ') : []
    // 进一步处理成 k-v 数组，得到一个 Map 对象
    const attrMap = parseAttrs(attrs)
    // 生成 AST
    const elementAst = generateAST(tagName, attrMap)
    if (!root) {
      // 说明是处理的第一个标签
      root = elementAst
      // 将 AST 对象 push 到栈中，遇到它的结束标签，就将栈顶的 AST 对象 pop出来
    }
    stack.push(elementAst)

    // 自闭合标签，<input type="text" />
    if (isUnaryTag(tagName)) {
      // 说明是自闭合标签，直接进入闭合标签的处理流程
      processElement()
    }
  }

  /**
   * 解析属性数组得到 Map
   * @param {*} attrs
   */
  function parseAttrs(attrs) {
    const attrMap = {}
    for (const attr of attrs) {
      const [attrName, attrValue] = attr.split('=')
      attrMap[attrName] = attrValue.replace(/\"/g, '')
    }
    return attrMap
  }

  /**
   * 生成 AST 对象
   * @param {*} tag
   * @param {*} attrMap
   */
  function generateAST(tag, attrMap) {
    return {
      // 元素节点
      type: 1,
      // 标签名
      tag,
      // 原生属性对象
      rawAttr: attrMap,
      // 子节点
      children: [],
    }
  }
  /**
   * 处理结束标签，</div>
   */
  function parseEnd() {
    // 将闭合标签从 html 字符串中截掉
    html = html.slice(html.indexOf('>') + 1)
    // / 进一步处理栈顶元素
    processElement()
  }

  /**
   * 处理元素的闭合标签之后被调用
   * 进一步处理开始标签上的各个属性，并将处理结果放到 attr 属性上
   */
  function processElement() {
    // 首先弹出栈顶元素
    const curEle = stack.pop()
    // 进一步处理 AST 对象中的 rawAttr 对象：{ attrName : attrValue }，处理结果放到 curEle.attr 属性上
    const { rawAttr } = curEle
    curEle.attr = {}
    // 原始属性名组成的数据，比如 ['v-model', 'v-bind:title', 'v-on:click']
    const propertyArr = Object.keys(rawAttr)
    if (propertyArr.includes('v-model')) {
      // 处理 v-model 指令
      processVModel(curEle)
    } else if (propertyArr.find((item) => item.match(/v-bind:(.*)/))) {
      // 处理 v-bind 指令
      console.log(RegExp.$1)
      processVBind(curEle, RegExp.$1, rawAttr[`v-bind:${RegExp.$1}`])
    } else if (propertyArr.find((item) => item.match(/v-on:(.*)/))) {
      // 处理 v-on 指令
      processVOn(curEle, RegExp.$1, rawAttr[`v-on:${RegExp.$1}`])
    }

    processSlotContent(curEle)

    // 属性已经处理完成之后，让其与父节点产生关系
    const stackLen = stack.length
    if (stackLen) {
      stack[stackLen - 1].children.push(curEle)
      curEle.parent = stack[stackLen - 1]
      // 如果节点存在 slotName，说明该节点是组件传递给插槽的内容
      // 将插槽信息放在组件的 rawAttr.scopeSlots 对象上
      // 这些信会在生成的插槽的 vnode 时（renderSlot）会用到
      if (curEle.slotName) {
        const { parent, slotName, scopeSlot, children } = curEle
        // 构造插槽信息
        const slotInfo = {
          slotName,
          scopeSlot,
          children: children.map((item) => {
            // 为了避免 JSON，stringify(attr) 出现爆栈，因为会存在循环引用
            delete item.parent
            return item
          }),
        }
        if (parent.rawAttr.scopedSlots) {
          parent.rawAttr.scopedSlots[curEle.slotName] = slotInfo
        } else {
          parent.rawAttr.scopedSlots = {
            [curEle.slotName]: slotInfo,
          }
        }
      }
    }
  }

  /**
   * 处理 v-model 指令，处理结果放到 curEle.attr 属性上
   * @param {*} curEle
   */
  function processVModel(curEle) {
    const { tag, attr, rawAttr } = curEle
    const { type, 'v-model': vModelValue } = rawAttr
    if (tag === 'input') {
      if (/text/.test(type)) {
        attr.vModel = { tag, type: 'text', value: vModelValue }
      } else if (/checkbox/.test(type)) {
        attr.vModel = { tag, type: 'checkbox', value: vModelValue }
      }
    } else if (tag === 'textarea') {
      attr.vModel = { tag, value: vModelValue }
    } else if (tag === 'select') {
      attr.vModel = { tag, value: vModelValue }
    }

    attr.VModel = {}
  }

  /**
   * 处理 v-bind 指令，处理结果放到 curEle.attr 属性上
   * @param {*} curEle 当前节点的 AST 对象
   * @param {*} bindKey title
   * @param {*} bindValue value
   */
  function processVBind(curEle, bindKey, bindValue) {
    curEle.attr.vBind = { [bindKey]: bindValue }
  }

  /**
   * 处理 v-on 指令，处理结果放到 VOn 属性上
   * @param {*} curEle
   */
  function processVOn(curEle, vOnKey, vOnValue) {
    curEle.attr.vOn = { [vOnKey]: vOnValue }
  }

  /**
   * 处理文本
   * @param {string} text
   */
  function processChars(text) {
    if (!text.trim()) return
    // 构造文本节点的 AST 对象
    const textAst = {
      type: 3,
      text,
    }
    if (text.match(/{{(.*)}}/))
      // 处理文本表达式的情况，{{ text }}
      textAst.expression = text.match(/{{(.*)}}/)[1].trim()
    stack[stack.length - 1].children.push(textAst)
  }
}

/**
 * <scope-slot>
 *  <template v-slot:default="scopeSlot"></template>
 * </scope-slot>
 * @param {*} el 节点的 AST 对象
 */
function processSlotContent(el) {
  // 具有 v-slot:xx 属性 template 只能是组件根元素
  if (el.tag === 'template') {
    const attrMap = el.rawAttr
    // 遍历 attrMap 对象，找到其中 v-slot 指令的信息
    for (const key in attrMap) {
      if (key.match(/v-slot:(.*)/)) {
        // 说明 template 标签上有 v-slot 指令
        // 获取插槽名称
        const slotName = (el.slotName = RegExp.$1)
        // 获取作用域插槽的值
        el.scopeSlot = attrMap[`v-slot:${slotName}`]
        // 因为标签上只可能有一个 v-slot 指令
        return
      }
    }
  }
}
