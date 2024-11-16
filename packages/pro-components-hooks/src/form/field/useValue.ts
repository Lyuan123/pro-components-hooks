import type { ComputedRef, Ref } from 'vue-demi'
import { computed } from 'vue-demi'
import { useInjectForm } from '../context'

interface UseValueOptions {
  onInputValue?: (fieldValue: Ref<any>, inputValue: any, ...args: any[]) => void
}

export function useValue<T = any>(id: string, path: ComputedRef<string[]>, options: UseValueOptions) {
  const { onInputValue } = options
  const form = useInjectForm()!

  const proxy = computed({
    get,
    set,
  })

  function get() {
    const p = path.value
    const storeValue = form.valueStore.getFieldValue(p)
    return storeValue
  }

  function set(val: any) {
    form.valueStore.setFieldValue(path.value, val)
    const field = form.fieldStore.getField(id)
    if (field)
      field.touching = false
  }

  function doUpdateValue(value: any, ...args: any[]) {
    const field = form.fieldStore.getField(id)
    if (field)
      field.touching = true
    if (onInputValue) {
      onInputValue(proxy, value, ...args)
      return
    }
    proxy.value = value
  }

  return {
    value: proxy as ComputedRef<T>,
    doUpdateValue,
  }
}
