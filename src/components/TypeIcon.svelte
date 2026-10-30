<script lang="ts">
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { TypeId } from '../lib/metadata';
  let { type }: { type: TypeId } = $props();
</script>

<svg class="type-icon" viewBox="0 0 24 24" aria-hidden="true">{@html TYPE_BY_ID[type].icon}</svg>
