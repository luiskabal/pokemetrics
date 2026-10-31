<script lang="ts">
  import { captureProfile, setCaptureStatus } from '../lib/captures';
  import type { CaptureStatus } from '../lib/captures';
  import { t } from '../lib/i18n';
  let { id }: { id: number } = $props();
</script>
<label class="capture-status" data-capture={id}><span class="sr-only">{$t('captureState')} · #{id}</span><select class="select" aria-label={`${$t('captureState')} · #${id}`} value={$captureProfile?.pokemon[id] ?? 'pending'} onchange={event => setCaptureStatus(id, event.currentTarget.value as CaptureStatus, $t('captureDefault'))}>{#each ['pending', 'seen', 'caught'] as status}<option value={status}>{$t(status as CaptureStatus)}</option>{/each}</select></label>
