<script lang="ts">
  import { IMAGE_SETS } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  import { language, t } from '../lib/i18n';
  import { imageName } from '../lib/localization';
  let { id, value, onChange, label }: { id: string; value: ImageSet; onChange: (value: ImageSet) => void; label?: string } = $props();
</script>

<div class="image-selector">
  <label for={id}>{label ?? $t('imagesByGame')}</label>
  <select class="select" {id} {value} onchange={event => onChange(event.currentTarget.value as ImageSet)}>
    {#each IMAGE_SETS as option (option.id)}<option value={option.id}>{imageName(option.id, $language)}</option>{/each}
  </select>
</div>
