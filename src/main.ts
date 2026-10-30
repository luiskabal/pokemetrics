import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import './themes/generation-i.css';
import './themes/generations.css';

mount(App, { target: document.getElementById('app')! });
