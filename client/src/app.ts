import type { ArtistCommand, CanvasState, DirectorResponse, InstallationMode } from '../../shared/types';
import { getNextCommand, getRuntime, getState, completeAction, type RuntimeConfig } from './api/directorClient';
import { CanvasEngine } from './canvas/CanvasEngine';
import { MindPanel } from './mind/MindPanel';

const delay = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const randomDelay = (min: number, max: number): number => min + Math.random() * Math.max(0, max - min);

export class StillWorkingApp {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private mindRoot: HTMLElement;
  private debugRoot: HTMLElement;
  private engine: CanvasEngine;
  private mind: MindPanel;
  private state: CanvasState | null = null;
  private runtime: RuntimeConfig | null = null;
  private debug: boolean;
  private waitingForCompletion = false;
  private lastResponse: DirectorResponse | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    this.root.innerHTML = `
      <main class="installation">
        <section id="mind" aria-label="artist mind"></section>
        <section class="canvas-stage" aria-label="living canvas">
          <canvas id="painting"></canvas>
          <div class="debug-panel" hidden></div>
        </section>
      </main>
    `;
    this.canvas = this.root.querySelector('#painting')!;
    this.mindRoot = this.root.querySelector('#mind')!;
    this.debugRoot = this.root.querySelector('.debug-panel')!;
    this.debugRoot.hidden = !this.debug;
    this.engine = new CanvasEngine(this.canvas, this.debug);
    this.mind = new MindPanel(this.mindRoot);
    this.engine.onComplete((completion) => {
      this.waitingForCompletion = false;
      void this.handleCompletion(completion.command);
    });
    window.addEventListener('resize', () => this.engine.resize());
  }

  async start(): Promise<void> {
    const [state, runtime] = await Promise.all([getState(), getRuntime()]);
    this.state = state;
    this.runtime = runtime;
    this.mind.seed(state.recentThoughts, state.currentMood);
    this.loop(performance.now());
    void this.directorLoop();
  }

  private loop = (time: number): void => {
    this.engine.resize();
    this.engine.tick(time);
    this.mind.update(time);
    this.renderDebug();
    window.requestAnimationFrame(this.loop);
  };

  private async directorLoop(): Promise<void> {
    while (true) {
      if (!this.state || !this.runtime) {
        await delay(1000);
        continue;
      }

      try {
        const response = await getNextCommand(this.state, this.runtime.installationMode as InstallationMode);
        this.lastResponse = response;
        this.applyResponse(response);
        this.waitingForCompletion = true;
        while (this.waitingForCompletion || this.engine.hasWork()) await delay(500);
      } catch (error) {
        console.error(error);
      }

      const min = Math.min(this.runtime.directorIntervalMinMs, this.runtime.directorIntervalMaxMs);
      const max = Math.max(this.runtime.directorIntervalMinMs, this.runtime.directorIntervalMaxMs);
      await delay(Math.max(3000, randomDelay(Math.min(3000, min), Math.min(15000, max))));
    }
  }

  private applyResponse(response: DirectorResponse): void {
    this.mind.applyCommand(response.command, response.source);
    this.engine.enqueue(response.command);
  }

  private async handleCompletion(command: ArtistCommand): Promise<void> {
    try {
      this.state = await completeAction({ command });
    } catch (error) {
      console.error(error);
    }
  }

  private renderDebug(): void {
    if (!this.debug || !this.debugRoot || !this.state) return;
    this.debugRoot.textContent = JSON.stringify(
      {
        source: this.lastResponse?.source,
        command: this.lastResponse?.command,
        totalActions: this.state.totalActions,
        mood: this.state.currentMood,
        openAiConfigured: this.runtime?.openAiConfigured
      },
      null,
      2
    );
  }
}
