import { StillWorkingApp } from './app';
import './styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing app root');

const app = new StillWorkingApp(root);
app.start().catch((error) => {
  root.innerHTML = `<main class="boot-error">Still Working could not start.<br />${error instanceof Error ? error.message : String(error)}</main>`;
});
