import { computed, ref } from 'vue-demi'
import { compile } from '../../hooks'
import type { ExpressionScope } from './types'

interface UseFormItemProps {
  scope: ExpressionScope
}
export function useFormItemProps(options: UseFormItemProps) {
  const { scope } = options
  const formItemProps = ref<Record<string, any>>({})

  function doUpdateFormItemProps(props: Record<string, any>) {
    formItemProps.value = compile(props, scope)
  }

  return {
    formItemProps: computed(() => formItemProps.value),
    doUpdateFormItemProps,
  }
}
