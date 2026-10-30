<script lang="ts">
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { TypeId } from '../lib/metadata';
  import TypeIcon from './TypeIcon.svelte';
  let { type }: { type: TypeId } = $props();
  const info = $derived(TYPE_BY_ID[type]);
</script>

<span class="badge type-chip" style:--tint={info.tint} style:--type-ink={info.ink}>
  <TypeIcon {type} /><span>{info.name}</span>
</span>
