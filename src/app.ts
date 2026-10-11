// Must load before any view is styled.
import './core-fixes';
import { createApp } from 'nativescript-vue';
import { installMasonKit } from '@triniwiz/nativescript-masonkit/vue';
import AppShell from './components/AppShell.vue';

// Registers MasonKit's elements (<view>, <text>, <scroll>, <button>, ...) and
// the HTML-shaped ones (<div>, <section>, <h1>, <p>, <span>, ...).
//
// `View.preflight` stays off: elements keep their browser-like defaults and
// Bootstrap's Reboot resets them, exactly as it does on the web.
installMasonKit();

createApp(AppShell).start();
