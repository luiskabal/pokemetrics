<script lang="ts">
  import { UI_THEMES } from '../lib/ui-theme';
  import type { UiTheme } from '../lib/ui-theme';
  import { t } from '../lib/i18n';
  let { value, onChange }: { value: UiTheme; onChange: (value: UiTheme) => void } = $props();
</script>

<div class="appearance-controls">
  <span class="appearance-label" id="appearance-label">{$t('themeLabel')}</span>
  <div class="appearance-options" role="group" aria-labelledby="appearance-label" aria-describedby="appearance-help">
    {#each UI_THEMES as theme (theme.id)}
      <button class="btn btn-sm" type="button" id={'theme-' + theme.id} aria-pressed={value === theme.id} onclick={() => onChange(theme.id)}><span class="theme-swatch" data-preview={theme.id} aria-hidden="true"></span>{$t(theme.label)}</button>
    {/each}
  </div>
  <p class="list-help" id="appearance-help">{$t('themeHelp')}</p>
</div>
