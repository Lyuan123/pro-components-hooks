import { cloneDeep, get, has, set, unset } from 'lodash-es'
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { InternalPath, PathPattern } from '../path'
import type { ValueMergeStrategy } from '../utils/value'
import { mergeByStrategy } from '../utils/value'
import type { BaseField } from '../field'
import type { FieldStore } from './fieldStore'

interface ValueStoreOptions {
  initialValues: any
  onFieldValueUpdated: (field: BaseField, value: any) => void
}
/**
 * 管理值
 */
export class ValueStore {
  public fieldStore: FieldStore
  public options: ValueStoreOptions
  public values: Ref<Record<string, any>>
  public initialValues: Record<string, any>

  constructor(
    fieldStore: FieldStore,
    options: ValueStoreOptions,
  ) {
    this.values = ref({})
    this.options = options
    this.fieldStore = fieldStore
    this.initialValues = cloneDeep(options.initialValues ?? {})
  }

  getFieldValue = (path: InternalPath) => {
    return get(this.values.value, path)
  }

  getFieldsValue = (paths?: Array<InternalPath> | true) => {
    if (paths === true) {
      // 所有的值，包含用户设置的和可能被隐藏的字段
      return this.values.value
    }

    if (!paths) {
      // 拿到存在的表单值返回
      return this.fieldStore.fieldsValue.value
    }

    return paths.reduce<Record<string, any>>(
      (p, path) => {
        const value = this.getFieldValue(path)
        set(p, path, value)
        return p
      },
      {},
    )
  }

  has(path: InternalPath) {
    return has(this.values.value, path)
  }

  delete(path: InternalPath) {
    return unset(this.values.value, path)
  }

  getFieldsTransformedValue = () => {
    return this.fieldStore.getFieldsTransformedValue()
  }

  matchPath = (pattern: PathPattern) => {
    return this.fieldStore.matchFieldPath(pattern)
  }

  resolveValueWithPostValue = (field: BaseField | undefined, value: any) => {
    return field && field.postValue
      ? field.postValue(value)
      : value
  }

  resolveValuesWithPostValue = (vals: any, effect?: (field: BaseField, value: any) => void) => {
    const clonedVals = cloneDeep(vals)
    const postValueFieldsPathMap = this.fieldStore.getHasPostValueFieldsPathMap.value
    postValueFieldsPathMap.forEach((field) => {
      const { stringPath } = field
      const rawStringPath = stringPath.value

      if (has(clonedVals, rawStringPath)) {
        const value = get(clonedVals, rawStringPath)
        const postedValue = field.postValue(value)
        if (!Object.is(value, postedValue)) {
          set(clonedVals, rawStringPath, postedValue)
          effect && effect(field, postedValue)
        }
      }
    })
    return clonedVals
  }

  setFieldValue = (path: InternalPath, value: any) => {
    const oldValue = this.getFieldValue(path)
    const field = this.fieldStore.getFieldByPath(path)
    const resolvedValue = this.resolveValueWithPostValue(field, value)
    set(this.values.value, path, resolvedValue)

    if (field && !Object.is(oldValue, resolvedValue))
      this.options.onFieldValueUpdated(field, resolvedValue)
  }

  setFieldsValue = (vals: Record<string, any>, strategy?: ValueMergeStrategy) => {
    const effects: Array<() => void> = []
    const resolvedValues = this.resolveValuesWithPostValue(
      vals,
      (field, value) => {
        effects.push(() => this.options.onFieldValueUpdated(field, value))
      },
    )
    this.values.value = mergeByStrategy(
      this.values.value,
      resolvedValues,
      strategy,
    )
    while (effects.length > 0)
      effects.shift()?.()
  }

  resetFieldValue = (path: InternalPath) => {
    const oldValue = this.getFieldValue(path)
    const field = this.fieldStore.getFieldByPath(path)
    const initialValue = cloneDeep(get(this.initialValues, path))
    const resolvedValue = this.resolveValueWithPostValue(field, initialValue)
    set(this.values.value, path, resolvedValue)

    if (field && !Object.is(oldValue, resolvedValue))
      this.options.onFieldValueUpdated(field, resolvedValue)
  }

  resetFieldsValue = () => {
    const effects: Array<() => void> = []
    const resolvedValues = this.resolveValuesWithPostValue(
      this.initialValues,
      (field, value) => {
        effects.push(() => this.options.onFieldValueUpdated(field, value))
      },
    )
    this.values.value = resolvedValues
    while (effects.length > 0)
      effects.shift()?.()
  }

  setInitialValue = (path: InternalPath, value: any) => {
    set(this.initialValues, path, cloneDeep(value))
  }

  setInitialValues = (vals: Record<string, any>, strategy?: ValueMergeStrategy) => {
    this.initialValues = mergeByStrategy(
      this.initialValues,
      cloneDeep(vals),
      strategy,
    )
  }
}

export function createValueStore(fieldStore: FieldStore, options: ValueStoreOptions) {
  return new ValueStore(fieldStore, options)
}
