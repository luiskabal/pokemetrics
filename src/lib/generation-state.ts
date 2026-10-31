import { writable } from 'svelte/store';
export const generation = writable(1);
export const edition = writable('red-green-japan');
