<script lang="ts">
  import { IMAGE_SETS } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  let { id, value, onChange, label = 'Imágenes por juego' }: { id: string; value: ImageSet; onChange: (value: ImageSet) => void; label?: string } = $props();
</script>

<div class="image-selector">
  <label for={id}>{label}</label>
  <select class="select" {id} {value} onchange={event => onChange(event.currentTarget.value as ImageSet)}>
    {#each IMAGE_SETS as option (option.id)}<option value={option.id}>{option.name}</option>{/each}
  </select>
</div>
