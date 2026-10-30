export const TYPES = [
      { id: 'normal', name: 'Normal', color: '#9b9e8c', ink: '#596049', tint: '#f0f1ea', on: '#192119', icon: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>' },
      { id: 'fire', name: 'Fuego', color: '#ee874b', ink: '#a14c28', tint: '#fff0e6', on: '#3a2012', icon: '<path d="M12 2c1 5-3 5-3 9 0 1 1 2 2 2-1-3 3-4 3-7 4 4 6 7 4 11-1 3-4 5-7 4-4 0-6-3-6-6 0-4 4-6 7-13Z"/>' },
      { id: 'water', name: 'Agua', color: '#5c9edd', ink: '#346aa2', tint: '#eaf3fe', on: '#132c49', icon: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15c0 2 1 3 3 3"/>' },
      { id: 'grass', name: 'Planta', color: '#78ac61', ink: '#4c793b', tint: '#edf5e7', on: '#182f13', icon: '<path d="M20 3C8 2 2 9 6 16c6 7 15 0 14-13Z"/><path d="m4 21 12-12m-7 7 5 0m-2-3V8"/>' },
      { id: 'electric', name: 'Eléctrico', color: '#e7c44c', ink: '#8e7421', tint: '#fcf7df', on: '#352d0b', icon: '<path d="m14 2-9 12h6l-1 8 9-13h-6l1-7Z"/>' },
      { id: 'ice', name: 'Hielo', color: '#7bbfbd', ink: '#387d80', tint: '#e9f7f5', on: '#153636', icon: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4"/>' },
      { id: 'fighting', name: 'Lucha', color: '#cc7567', ink: '#9d4b3d', tint: '#fbede9', on: '#341a15', icon: '<path d="M6 12V7a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v3a2 2 0 0 1 3 2v5l-5 5H9l-6-6v-4a2 2 0 0 1 3 0Zm4-5v5m4-6v6m4-3v3M6 12l4 3"/>' },
      { id: 'poison', name: 'Veneno', color: '#ac80b5', ink: '#865393', tint: '#f5edf8', on: '#2c1833', icon: '<path d="M7 15a7 7 0 1 1 10 0v4H7v-4Zm3 4v3m4-3v3"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="m11 14 1-2 1 2"/>' },
      { id: 'ground', name: 'Tierra', color: '#c4a16c', ink: '#8a6836', tint: '#f7f0e6', on: '#302312', icon: '<path d="m2 20 7-15 4 9 3-5 6 11H2Zm4-7h7m-7 4h9"/>' },
      { id: 'flying', name: 'Volador', color: '#9a9ccc', ink: '#686a9f', tint: '#f0f0fa', on: '#23243e', icon: '<path d="M3 17C5 6 14 3 22 4c-2 9-8 16-18 15m3-3 10-8M7 12l6 0m-3 4h5"/>' },
      { id: 'psychic', name: 'Psíquico', color: '#df8ca5', ink: '#a84e6b', tint: '#fceef3', on: '#3a1825', icon: '<path d="M21 12a9 9 0 1 0-9 9 6 6 0 0 0 6-6 5 5 0 1 0-5 5m-1-7a2 2 0 1 1 2-2"/>' },
      { id: 'bug', name: 'Bicho', color: '#a5b75a', ink: '#78852f', tint: '#f2f5e6', on: '#26300c', icon: '<ellipse cx="12" cy="14" rx="6" ry="7"/><path d="m9 7-2-4m8 4 2-4M3 10l3 2m-4 5h4m15-7-3 2m4 5h-4M12 8v13M8 14h8"/>' },
      { id: 'rock', name: 'Roca', color: '#b6a376', ink: '#817044', tint: '#f5f2e8', on: '#2e2716', icon: '<path d="m7 4 10 1 5 12-7 4-12-3L2 9l5-5Zm0 0 3 7 7-6M3 18l7-7 5 10m-5-10 12 6"/>' },
      { id: 'ghost', name: 'Fantasma', color: '#8a88b1', ink: '#615c92', tint: '#f0edf8', on: '#211e39', icon: '<path d="M4 20v-9a8 8 0 0 1 16 0v9l-4-2-4 3-4-3-4 2Z"/><path d="M9 10v3m6-3v3"/>' },
      { id: 'dragon', name: 'Dragón', color: '#8f91d3', ink: '#605aa5', tint: '#efedfc', on: '#211b43', icon: '<path d="m15 3 5 3-2 7-6 6H5l-3-4 5 1 3-4-4-1 3-5 6 1V3Zm0 4 3 2m-5 10 4 2m-8-2-1 3"/>' },
      { id: 'dark', name: 'Siniestro', color: '#8c817b', ink: '#675d58', tint: '#f1eeec', on: '#fff', icon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>' },
      { id: 'steel', name: 'Acero', color: '#96adb0', ink: '#566f76', tint: '#edf2f3', on: '#1b2f35', icon: '<path d="m7 3 10 0 5 9-5 9H7l-5-9 5-9Z"/><circle cx="12" cy="12" r="4"/>' },
      { id: 'fairy', name: 'Hada', color: '#daa1c7', ink: '#a36793', tint: '#faeff7', on: '#371b2f', icon: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Zm7 0v4m-2-2h4M3 18v4m-2-2h4"/>' }
    ] as const;

export type TypeId = (typeof TYPES)[number]["id"];
export type TypeInfo = (typeof TYPES)[number];
export const TYPE_BY_ID = Object.fromEntries(TYPES.map(type => [type.id, type])) as Record<TypeId, TypeInfo>;
export const LEGACY_TYPES = TYPES.filter(type => !["dark", "steel", "fairy"].includes(type.id));
export const STATS = [
      { id: 'hp', name: 'PS' }, { id: 'attack', name: 'Ataque' }, { id: 'defense', name: 'Defensa' },
      { id: 'special-attack', name: 'Ataque especial' }, { id: 'special-defense', name: 'Defensa especial' }, { id: 'speed', name: 'Velocidad' }
    ] as const;
export type StatId = (typeof STATS)[number]["id"];

export const GAMES = [
  { id: 'red-green-japan', name: 'Rojo/Verde · Japón (Gen I)' },
  { id: 'red-blue', name: 'Rojo/Azul (Gen I)' },
  { id: 'yellow', name: 'Amarillo (Gen I)' },
] as const;
export type GameId = (typeof GAMES)[number]['id'];
export type ImageSet = 'artwork' | GameId;
export const IMAGE_SETS = [{ id: 'artwork', name: 'Arte actual' }, ...GAMES] as const;

export const HISTORICAL_ARTWORKS = [
  { id: 'red-and-blue', name: 'Rojo/Azul · Gen I' },
  { id: 'red-and-green', name: 'Rojo/Verde · Japón · Gen I' },
] as const;
export type HistoricalArtworkId = (typeof HISTORICAL_ARTWORKS)[number]['id'];
