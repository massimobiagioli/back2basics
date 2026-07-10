import vueTsEslintConfig from '@vue/eslint-config-typescript'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  ...vueTsEslintConfig(),
  {
    plugins: { 'vuejs-accessibility': vueA11y },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
]
