<script lang="ts">
  import { loadPokemonInfo, descriptionFor, translatedText } from '../lib/details';
  import type { PokemonInfo } from '../lib/details';
  import type { Pokemon, ViewMode } from '../lib/model';
  import { LANGUAGES, localizedName } from '../lib/localization';
  import { language, t } from '../lib/i18n';
  import { generation as selectedGeneration } from '../lib/generation-state';
  let { pokemon, view, onOpen }: { pokemon: Pokemon; view: ViewMode; onOpen: (id: number) => void } = $props();
  let info = $state.raw<PokemonInfo | null>(null);
  let failed = $state(false);
  let retry = $state(0);
  const id = $derived(pokemon.id);
  const generation = $derived(view === 'legacy' ? $selectedGeneration : 'current');
  const description = $derived(info ? descriptionFor(info.species, $language, generation) : null);
  $effect(() => {
    retry;
    const controller = new AbortController();
    info = null; failed = false;
    void loadPokemonInfo(id, generation, controller.signal).then(value => { if (!controller.signal.aborted) info = value; }).catch(() => { if (!controller.signal.aborted) failed = true; });
    return () => controller.abort();
  });
</script>

<section class="pokemon-info" aria-labelledby="pokemon-info-title" aria-busy={!info && !failed}>
  <h3 id="pokemon-info-title">{$t('infoTitle')}</h3>
  {#if info}
    <p class="species-category"><strong>{$t('category')}</strong> {localizedName(info.species.category, $language, '—')}</p>
    {#if description}
      <p class="species-description" lang={description.language}>{description.text}</p>
      <p class="stat-note">{$t('entrySource', { game: localizedName(info.versions[description.versionId], $language, description.version), language: LANGUAGES.find(locale => locale.id === description.language)!.label })}</p>
      {#if description.language !== $language}<p class="stat-note">{$t('translationFallback')}</p>{/if}
    {:else}<p class="stat-note">{$t('noEraDescription')}</p>{/if}
    <h4>{$t('abilities')}</h4>
    {#if generation !== 'current' && generation < 3}<p class="description">{$t('noHistoricalAbilities')}</p>
    {:else}
      <ul class="ability-list">{#each info.abilities as ability (ability.info.id)}{@const text = translatedText(ability.info.description, $language)}<li><strong>{localizedName(ability.info.names, $language, ability.info.name)}</strong>{#if ability.hidden}<span class="badge">{$t('hiddenAbility')}</span>{/if}<p lang={text?.language ?? $language}>{text?.text ?? $t('infoUnavailable')}</p>{#if text && text.language !== $language}<small class="stat-note">{$t('translationFallback')}</small>{/if}</li>{/each}</ul>
    {/if}
    <h4>{$t('evolutionChain')}</h4>
    <ul class="evolution-list">{#each info.evolutions as node (node.species.id)}<li style:margin-left={node.depth * 12 + 'px'}><span aria-hidden="true">{node.depth ? '↳' : '●'}</span><button class="btn btn-sm" type="button" data-evolution={node.species.id} aria-current={node.species.id === pokemon.id ? 'true' : undefined} disabled={node.species.id === pokemon.id} onclick={() => onOpen(node.species.id)}>{localizedName(node.species.names, $language, node.species.name)}</button></li>{/each}</ul>
  {:else if failed}<div class="app-notice" role="status"><p>{$t('infoError')}</p><button class="btn btn-sm" type="button" onclick={() => retry++}>{$t('retry')}</button></div>
  {:else}<p class="description" role="status"><span class="loading loading-spinner loading-xs" aria-hidden="true"></span> {$t('infoLoading')}</p>{/if}
</section>
