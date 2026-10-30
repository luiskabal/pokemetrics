<script lang="ts">
  import { IMAGE_SETS } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  let { id, value, onChange }: { id: string; value: ImageSet; onChange: (value: ImageSet) => void } = $props();
</script>

<div class="image-selector">
  <label for={id}>Imágenes por juego</label>
  <select class="select" {id} {value} onchange={event => onChange(event.currentTarget.value as ImageSet)}>
    {#each IMAGE_SETS as option (option.id)}<option value={option.id}>{option.name}</option>{/each}
  </select>
</div>
