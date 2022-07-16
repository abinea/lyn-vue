import generate from './generate.js'
import parse from './parse.js'

export default function compileToFunction(template) {
  // 将模板编译为 AST
  const ast = parse(template)
  // 从 AST 生成渲染函数
  const render = generate(ast)
  return render
}
