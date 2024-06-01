import { set } from 'lodash-es'
import { toRaw } from 'vue-demi'
import type { BaseField } from './field'
import { stringifyPath, toRegexp } from './utils/path'

export class PathField {
  private map: Map<string, BaseField> = new Map()

  get = (path: Array<string | number>) => {
    if (path.length <= 0)
      return
    return this.map.get(toRaw(stringifyPath(path)))
  }

  getAll = () => {
    const res = {} as any
    this.map.forEach((field, key) => {
      const val = field.value.value
      const condition1 = !field.isList
      const condition2 = field.isList && (!val || val.length <= 0)
      if (condition1 || condition2)
        set(res, key, toRaw(val))
    })
    return res
  }

  set = (path: string[], field: BaseField) => {
    if (path.length <= 0)
      return
    this.map.set(stringifyPath(path), field)
  }

  delete = (path: string[]) => {
    if (path.length <= 0)
      return
    this.map.delete(stringifyPath(path))
  }

  query = () => {}

  match = (key: string) => {
    const reg = toRegexp(key)
    const ret: BaseField[] = []
    this.map.forEach((field, path) => {
      if (reg.test(path))
        ret.push(field)
    })
    return ret
  }
}
