import type { ArtistCommand, Mood } from '../../../shared/types';
import { pulseValue } from '../canvas/pulse';

export class MindPanel {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private current: HTMLElement;
  private previous: HTMLElement;
  private mood: HTMLElement;
  private pulse: HTMLElement;
  private source: HTMLElement;
  private thoughts: string[] = [];
  private currentMood: Mood = 'calm';

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.className = 'mind-panel';
    this.root.innerHTML = `
      <canvas class="mind-canvas" aria-hidden="true"></canvas>
      <div class="mind-meta">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span class="mood-label">calm</span>
      </div>
      <div class="thought-current">waiting for a mark</div>
      <div class="thought-history"></div>
      <div class="source-label"></div>
    `;
    this.canvas = this.root.querySelector('.mind-canvas')!;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Mind canvas context unavailable');
    this.ctx = ctx;
    this.current = this.root.querySelector('.thought-current')!;
    this.previous = this.root.querySelector('.thought-history')!;
    this.mood = this.root.querySelector('.mood-label')!;
    this.pulse = this.root.querySelector('.pulse-dot')!;
    this.source = this.root.querySelector('.source-label')!;
    this.resizeCanvas();
  }

  applyCommand(command: ArtistCommand, source: string): void {
    this.currentMood = command.mood;
    if (this.current.textContent) {
      this.thoughts = [this.current.textContent, ...this.thoughts].filter((thought, index, array) => array.indexOf(thought) === index).slice(0, 20);
    }
    this.current.textContent = command.thought;
    this.mood.textContent = command.mood;
    this.source.textContent = source === 'openai' ? 'The restless artist' : 'local fallback';
    this.paintThoughtAction(command);
    this.renderHistory();
  }

  seed(thoughts: string[], mood: Mood): void {
    this.currentMood = mood;
    this.mood.textContent = mood;
    if (thoughts.length > 0) {
      this.current.textContent = thoughts[0];
      this.thoughts = thoughts.slice(1, 20);
      this.renderHistory();
    }
  }

  update(time: number): void {
    this.resizeCanvas();
    const pulse = pulseValue(this.currentMood, time);
    this.pulse.style.transform = `scale(${0.65 + pulse * 0.65})`;
    this.pulse.style.opacity = `${0.28 + pulse * 0.5}`;
  }

  private resizeCanvas(): void {
    const rect = this.root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;

    const previous = document.createElement('canvas');
    previous.width = this.canvas.width || width;
    previous.height = this.canvas.height || height;
    const previousCtx = previous.getContext('2d');
    if (previousCtx && this.canvas.width && this.canvas.height) previousCtx.drawImage(this.canvas, 0, 0);

    this.canvas.width = width;
    this.canvas.height = height;
    if (previousCtx) this.ctx.drawImage(previous, 0, 0, width, height);
  }

  private paintThoughtAction(command: ArtistCommand): void {
    this.resizeCanvas();
    const ctx = this.ctx;
    const bounds = this.regionBounds(command.targetRegion);
    const color = this.colorForMood(command.mood);
    const intensity = Math.max(0.15, command.intensity);
    ctx.save();

    if (command.action === 'erase_region' || command.action === 'lighten_region') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.08 + intensity * 0.12;
      this.paintMindBlob(bounds, '#000', 4 + Math.floor(intensity * 5));
    } else if (command.action === 'blur_region' || command.action === 'wash_region') {
      ctx.globalAlpha = 0.035 + intensity * 0.065;
      ctx.filter = command.action === 'blur_region' ? `blur(${3 + intensity * 8}px)` : 'none';
      this.paintMindBlob(bounds, color, 7 + Math.floor(intensity * 6));
    } else if (command.action === 'scar_region' || command.action === 'interrupt_canvas') {
      ctx.globalAlpha = 0.22 + intensity * 0.24;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 + intensity * 3;
      ctx.lineCap = 'butt';
      const cuts = command.action === 'interrupt_canvas' ? 9 : 4;
      for (let i = 0; i < cuts; i += 1) this.paintMindSlash(bounds);
    } else if (command.action === 'darken_region') {
      ctx.globalAlpha = 0.05 + intensity * 0.12;
      this.paintMindBlob(bounds, '#11110f', 6);
    } else if (command.action === 'add_texture') {
      ctx.fillStyle = color;
      for (let i = 0; i < 40 + intensity * 90; i += 1) {
        ctx.globalAlpha = 0.035 + Math.random() * 0.09;
        const x = bounds.x + Math.random() * bounds.w;
        const y = bounds.y + Math.random() * bounds.h;
        const size = 1 + Math.random() * (2 + intensity * 3);
        ctx.fillRect(x, y, size, size);
      }
    } else if (command.action === 'pull_color') {
      this.paintMindPull(command, color, intensity);
    } else if (command.action === 'pause_and_observe') {
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    } else {
      ctx.globalAlpha = 0.16 + intensity * 0.18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 + intensity * 5;
      ctx.lineCap = 'round';
      this.paintMindLine(bounds);
    }

    ctx.restore();
  }

  private regionBounds(regionId: ArtistCommand['targetRegion']): { x: number; y: number; w: number; h: number } {
    const index = ['top_left', 'top_center', 'top_right', 'middle_left', 'center', 'middle_right', 'bottom_left', 'bottom_center', 'bottom_right'].indexOf(regionId);
    const col = Math.max(0, index % 3);
    const row = Math.max(0, Math.floor(index / 3));
    const pad = this.canvas.width * 0.05;
    const cellW = (this.canvas.width - pad * 2) / 3;
    const cellH = (this.canvas.height - pad * 2) / 3;
    return {
      x: pad + col * cellW + cellW * 0.12,
      y: pad + row * cellH + cellH * 0.12,
      w: cellW * 0.76,
      h: cellH * 0.76
    };
  }

  private colorForMood(mood: Mood): string {
    const colors: Record<Mood, string> = {
      calm: '#d8d0c3',
      restless: '#c5a53a',
      frustrated: '#b65f45',
      dreaming: '#7da1a8',
      obsessive: '#8f7462'
    };
    return colors[mood];
  }

  private paintMindBlob(bounds: { x: number; y: number; w: number; h: number }, color: string, points: number): void {
    const ctx = this.ctx;
    const cx = bounds.x + bounds.w * (0.25 + Math.random() * 0.5);
    const cy = bounds.y + bounds.h * (0.25 + Math.random() * 0.5);
    const rx = bounds.w * (0.18 + Math.random() * 0.35);
    const ry = bounds.h * (0.12 + Math.random() * 0.3);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = 0.65 + Math.random() * 0.7;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  private paintMindLine(bounds: { x: number; y: number; w: number; h: number }): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.w * 0.12, bounds.y + bounds.h * (0.25 + Math.random() * 0.5));
    ctx.bezierCurveTo(
      bounds.x + bounds.w * 0.34,
      bounds.y + bounds.h * Math.random(),
      bounds.x + bounds.w * 0.66,
      bounds.y + bounds.h * Math.random(),
      bounds.x + bounds.w * 0.9,
      bounds.y + bounds.h * (0.25 + Math.random() * 0.5)
    );
    ctx.stroke();
  }

  private paintMindSlash(bounds: { x: number; y: number; w: number; h: number }): void {
    const ctx = this.ctx;
    const x = bounds.x + Math.random() * bounds.w;
    const y = bounds.y + Math.random() * bounds.h;
    const length = bounds.w * (0.25 + Math.random() * 0.55);
    const angle = -Math.PI * 0.22 + Math.random() * Math.PI * 0.44;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  private paintMindPull(command: ArtistCommand, color: string, intensity: number): void {
    const ctx = this.ctx;
    const from = this.regionBounds(command.targetRegion);
    const to = this.regionBounds(command.secondaryRegion ?? 'center');
    const start = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
    const end = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
    ctx.globalAlpha = 0.08 + intensity * 0.12;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5 + intensity * 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(start.x, end.y, end.x, start.y, end.x, end.y);
    ctx.stroke();
  }

  private renderHistory(): void {
    this.previous.replaceChildren(
      ...this.thoughts.map((thought, index) => {
        const item = document.createElement('div');
        item.className = 'thought-old';
        item.style.opacity = `${Math.max(0.18, 0.54 - index * 0.026)}`;
        item.textContent = thought;
        return item;
      })
    );
  }
}
