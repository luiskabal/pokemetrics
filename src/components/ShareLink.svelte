<script lang="ts">
  import { t } from '../lib/i18n';
  let { url, id }: { url: string; id: string } = $props();
  let feedback = $state<'copied' | 'manual' | null>(null);
  $effect(() => { url; feedback = null; });
  async function share() {
    try { await navigator.clipboard.writeText(url); feedback = 'copied'; }
    catch { feedback = 'manual'; }
  }
</script>

<div class="share-control">
  <button class="btn btn-sm" {id} type="button" onclick={share}>{$t(feedback === 'copied' ? 'linkCopied' : 'shareLink')}</button>
  <span class="sr-only" role="status">{feedback === 'copied' ? $t('linkCopied') : ''}</span>
  {#if feedback === 'manual'}<label class="share-fallback">{$t('copyLinkManually')}<input class="input" readonly value={url} onclick={event => event.currentTarget.select()}/></label>{/if}
</div>
