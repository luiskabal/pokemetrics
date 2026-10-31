<script lang="ts">
  import { generation, edition } from '../lib/generation-state';
  import { GENERATIONS } from '../lib/generations';
  import { loadUniverse } from '../lib/universe';
  import { filterAndSortPokemon } from '../lib/analysis';
  import { defensiveMatchups } from '../lib/effectiveness';
  import { statsForGeneration } from '../lib/stats';
  import { STAT_COLORS } from '../lib/metadata';
  import { readTeams, saveTeams, sharedTeam, teamUrl } from '../lib/teams';
  import type { LocalTeam } from '../lib/teams';
  import type { Pokemon } from '../lib/model';
  import { language, t } from '../lib/i18n';
  import { imageName, localizedName, pokemonName, statName, LOCALES } from '../lib/localization';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import ShareLink from './ShareLink.svelte';
  let { onEdition }: { onEdition: (game: string) => void } = $props();
  const incoming = sharedTeam(new URL(location.href));
  let teams = $state<LocalTeam[]>([...readTeams(), ...(incoming ? [incoming] : [])]);
  let selectedId = $state<string | null>(incoming?.id ?? null);
  const current = $derived(teams.find(team => team.id === selectedId && team.game === $edition) ?? teams.find(team => team.game === $edition) ?? null);
  let pool = $state.raw<Pokemon[]>([]); let query = $state(''); let loading = $state(true); let failed = $state(false); let saveFailed = $state(false); let retry = $state(0);
  const candidates = $derived(filterAndSortPokemon(pool, query, 'number-asc', $language, 'legacy', $generation).slice(0, 20));
  const members = $derived((current?.members ?? []).map(id => pool.find(pokemon => pokemon.id === id)).filter((pokemon): pokemon is Pokemon => !!pokemon));
  const profiles = $derived(teams.filter(team => team.game === $edition));
  const coverage = $derived(members.length ? defensiveMatchups(members[0].legacyTypes, $generation).map(attack => ({ type: attack.type, values: members.map(pokemon => defensiveMatchups(pokemon.legacyTypes, $generation).find(entry => entry.type === attack.type)!.multiplier) })) : []);
  const weaknesses = $derived(coverage.filter(row => row.values.filter(value => value > 1).length >= 2));
  const averages = $derived(members.length ? statsForGeneration(members[0], $generation)?.map(stat => ({ id: stat.id, value: members.reduce((sum, pokemon) => sum + (statsForGeneration(pokemon, $generation)?.find(row => row.id === stat.id)?.value ?? 0), 0) / members.length })) ?? [] : []);
  const link = $derived(current ? teamUrl(new URL(location.href), current) : location.href);
  $effect(() => { retry; const era = $generation; const game = $edition; const controller = new AbortController(); loading = true; failed = false; pool = []; void loadUniverse(era, 'national', game, null, controller.signal).then(data => { if (!controller.signal.aborted) pool = data.pokemon; }).catch(() => { if (!controller.signal.aborted) failed = true; }).finally(() => { if (!controller.signal.aborted) loading = false; }); return () => controller.abort(); });
  function update(change: Partial<LocalTeam>) {
    const base = current ?? { id: crypto.randomUUID(), game: $edition, name: $t('myTeam'), members: [] };
    const next = { ...base, ...change }; teams = [...teams.filter(team => team.id !== next.id), next]; selectedId = next.id; saveFailed = !saveTeams(teams);
  }
  function newTeam() { const team = { id: crypto.randomUUID(), game: $edition, name: $t('myTeam'), members: [] }; teams = [...teams, team]; selectedId = team.id; saveFailed = !saveTeams(teams); }
</script>
<section class="team-builder" aria-labelledby="teams-title"><h1 id="teams-title">{$t('teamsTitle')}</h1><p class="description">{$t('teamsIntro')}</p>
  <div class="game-context-controls"><label>{$t('contextGame')}<select class="select" id="team-game" value={$edition} onchange={event => onEdition(event.currentTarget.value)}>{#each GENERATIONS as era}<optgroup label={localizedName(era.names, $language, era.roman)}>{#each era.games as game}<option value={game.id}>{imageName(game.id, $language)}</option>{/each}</optgroup>{/each}</select></label><label>{$t('savedTeams')}<select class="select" id="team-profile" value={current?.id ?? ''} onchange={event => selectedId = event.currentTarget.value}><option value="" disabled>{$t('chooseTeam')}</option>{#each profiles as team}<option value={team.id}>{team.name}</option>{/each}</select></label><label>{$t('teamName')}<input class="input" id="team-name" maxlength="64" value={current?.name ?? ''} onchange={event => update({ name: event.currentTarget.value.trim() || $t('myTeam') })}/></label></div>
  <div class="list-actions"><button class="btn btn-sm" id="new-team" onclick={newTeam}>{$t('newTeam')}</button>{#if current}<ShareLink url={link} id="share-team"/>{/if}<span role="status">{current?.members.length ?? 0} / 6</span></div>
  {#if saveFailed}<p role="status" class="app-notice">{$t('teamStorageError')}</p>{/if}
  {#if loading}<p role="status">{$t('infoLoading')}</p>{:else if failed}<p role="status">{$t('infoError')}</p><button class="btn btn-sm" onclick={() => retry++}>{$t('retry')}</button>{:else}
  <div class="team-members">{#each members as pokemon, index}<article class="card team-member"><PokemonImage {pokemon} illustration={`game:${$edition}`}/><strong>#{pokemon.id} {pokemonName(pokemon.name, $language)}</strong><div class="pokemon-types">{#each pokemon.legacyTypes as type}<TypeBadge {type}/>{/each}</div><div class="team-stat-chips">{#each statsForGeneration(pokemon, $generation) ?? [] as stat}<span style:--stat-color={STAT_COLORS[stat.id]}>{statName(stat.id, $language)} <b>{stat.value}</b></span>{/each}</div><button class="btn btn-sm" data-remove-team={index} onclick={() => update({ members: current!.members.filter((_, position) => position !== index) })}>{$t('remove')}</button></article>{/each}{#if members.length < 6}<div class="team-empty-slot">{$t('emptyTeamSlots', { count: 6 - members.length })}</div>{/if}</div>
  <label class="data-view-label" for="team-search">{$t('addTeamPokemon')}</label><input class="input" id="team-search" bind:value={query} placeholder={$t('searchPlaceholder')}/><ul class="team-candidates">{#each candidates as pokemon}<li><button class="btn btn-sm" data-add-team={pokemon.id} disabled={(current?.members.length ?? 0) >= 6} onclick={() => update({ members: [...(current?.members ?? []), pokemon.id] })}>＋ #{pokemon.id} {pokemonName(pokemon.name, $language)}</button></li>{/each}</ul>
  {#if members.length}<h2>{$t('teamBaseAverages')}</h2><div class="team-stat-chips">{#each averages as stat}<span style:--stat-color={STAT_COLORS[stat.id]}>{statName(stat.id, $language)} <b>{stat.value.toLocaleString(LOCALES[$language], { maximumFractionDigits: 1 })}</b></span>{/each}</div><h2>{$t('sharedWeaknesses')}</h2><div class="matchup-chips">{#each weaknesses as row}<span class="matchup-item"><TypeBadge type={row.type}/><b>{row.values.filter(value => value > 1).length}</b></span>{:else}<p>{$t('none')}</p>{/each}</div><details><summary>{$t('teamDefenseTable')}</summary><div class="comparison-scroll" role="region" aria-label={$t('teamDefenseTable')}><table class="comparison-table"><thead><tr><th>{$t('attackType')}</th>{#each members as pokemon}<th>{pokemonName(pokemon.name, $language)}</th>{/each}</tr></thead><tbody>{#each coverage as row}<tr><th><TypeBadge type={row.type}/></th>{#each row.values as value}<td class:coverage-weak={value > 1} class:coverage-resistant={value < 1}>×{value}</td>{/each}</tr>{/each}</tbody></table></div></details>{/if}
  {/if}<p class="stat-note">{$t('matchupsScope')}</p><p class="stat-note">{$t('teamEraScope')}</p>
</section>
