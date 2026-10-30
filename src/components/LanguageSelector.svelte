<script lang="ts">
  import { language, t } from '../lib/i18n';
  import { LANGUAGES } from '../lib/localization';
</script>

<nav class="language-controls" aria-label={$t('language')}>
  <span class="language-label">{$t('language')}</span>
  <div class="join view-switch language-switch" role="group" aria-label={$t('language')}>
    {#each LANGUAGES as option (option.id)}
      <button type="button" class="btn join-item" id={'lang-' + option.id} lang={option.id} aria-pressed={$language === option.id} onclick={() => language.set(option.id)}>{option.label}</button>
    {/each}
  </div>
</nav>
