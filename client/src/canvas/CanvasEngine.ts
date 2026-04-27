import type { ArtistCommand, CanvasAction, Mood, RegionId, RegionState } from '../../../shared/types';
import { baseColor, hexToRgba, pickColor } from './palettes';
import { pulseValue } from './pulse';
import { regionBounds, regionCenter } from './regions';

interface RunningAction {
  id: string;
  command: ArtistCommand;
  startedAt: number;
  durationMs: number;
  progress: number;
  seed: number;
  lastStep: number;
  prepared?: boolean;
  points?: Array<{ x: number; y: number }>;
}

interface Completion {
  command: ArtistCommand;
  regionUpdates: Partial<Record<RegionId, Partial<Pick<RegionState, 'density' | 'contrast'>>>>;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ease = (value: number): number => value * value * (3 - 2 * value);
const random = (min: number, max: number): number => min + Math.random() * (max - min);

export class CanvasEngine {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private texture: HTMLCanvasElement;
  private textureCtx: CanvasRenderingContext2D;
  private queue: ArtistCommand[] = [];
  private active: RunningAction | null = null;
  private mood: Mood = 'calm';
  private debug = false;
  private completionHandlers: Array<(completion: Completion) => void> = [];
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, debug = false) {
    this.canvas = canvas;
    this.debug = debug;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    this.ctx = ctx;
    this.base = document.createElement('canvas');
    this.texture = document.createElement('canvas');
    const baseCtx = this.base.getContext('2d');
    const textureCtx = this.texture.getContext('2d');
    if (!baseCtx || !textureCtx) throw new Error('Layer context unavailable');
    this.baseCtx = baseCtx;
    this.textureCtx = textureCtx;
    this.resize();
    this.seedSurface();
  }

  onComplete(handler: (completion: Completion) => void): void {
    this.completionHandlers.push(handler);
  }

  enqueue(command: ArtistCommand): void {
    this.mood = command.mood;
    if (command.action === 'interrupt_canvas') {
      this.queue = [];
      this.active = null;
      this.start(command, performance.now());
      return;
    }
    if (!this.active) this.start(command, performance.now());
    else this.queue.push(command);
  }

  hasWork(): boolean {
    return Boolean(this.active || this.queue.length);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(360, Math.floor(rect.width * dpr));
    const height = Math.max(360, Math.floor(rect.height * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;

    const oldBase = document.createElement('canvas');
    oldBase.width = this.base.width || width;
    oldBase.height = this.base.height || height;
    const oldCtx = oldBase.getContext('2d');
    if (oldCtx && this.base.width && this.base.height) oldCtx.drawImage(this.base, 0, 0);

    for (const layer of [this.canvas, this.base, this.texture]) {
      layer.width = width;
      layer.height = height;
    }

    this.baseCtx.fillStyle = baseColor;
    this.baseCtx.fillRect(0, 0, width, height);
    if (oldCtx) this.baseCtx.drawImage(oldBase, 0, 0, width, height);
    this.makeTexture();
  }

  tick(time: number): void {
    this.lastTime = time;
    if (this.active) this.updateAction(this.active, time);
    this.render(time);
  }

  private start(command: ArtistCommand, time: number): void {
    const action: RunningAction = {
      id: `${time}-${Math.random().toString(36).slice(2)}`,
      command,
      startedAt: time,
      durationMs: command.durationMs,
      progress: 0,
      seed: Math.random() * 10000,
      lastStep: 0
    };
    this.prepare(action);
    this.active = action;
  }

  private updateAction(action: RunningAction, time: number): void {
    action.progress = clamp01((time - action.startedAt) / action.durationMs);
    const step = Math.floor(action.progress * 90);
    if (step > action.lastStep || action.command.action === 'pause_and_observe') {
      this.paint(action, action.lastStep, step);
      action.lastStep = step;
    }

    if (action.progress >= 1) {
      const completion = this.finish(action);
      this.active = null;
      this.completionHandlers.forEach((handler) => handler(completion));
      const next = this.queue.shift();
      if (next) this.start(next, time);
    }
  }

  private prepare(action: RunningAction): void {
    if (action.command.action !== 'stroke_line') return;
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.18);
    const count = 14 + Math.floor(action.command.intensity * 20);
    const start = {
      x: bounds.x + random(0.05, 0.35) * bounds.w,
      y: bounds.y + random(0.1, 0.9) * bounds.h
    };
    const end = {
      x: bounds.x + random(0.65, 0.98) * bounds.w,
      y: bounds.y + random(0.1, 0.9) * bounds.h
    };
    if (Math.random() > 0.5) {
      start.x = bounds.x + random(0.1, 0.9) * bounds.w;
      start.y = bounds.y + random(0.05, 0.35) * bounds.h;
      end.x = bounds.x + random(0.1, 0.9) * bounds.w;
      end.y = bounds.y + random(0.65, 0.98) * bounds.h;
    }
    action.points = Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1);
      const wave = Math.sin(t * Math.PI * 2 + action.seed) * bounds.h * 0.07;
      return {
        x: start.x + (end.x - start.x) * t + random(-bounds.w * 0.04, bounds.w * 0.04),
        y: start.y + (end.y - start.y) * t + wave + random(-bounds.h * 0.05, bounds.h * 0.05)
      };
    });
  }

  private paint(action: RunningAction, previousStep: number, step: number): void {
    const command = action.command;
    switch (command.action) {
      case 'stroke_line':
        this.strokeLine(action, previousStep, step);
        break;
      case 'wash_region':
        this.washRegion(action, previousStep, step);
        break;
      case 'erase_region':
        this.eraseRegion(action, previousStep, step);
        break;
      case 'blur_region':
        this.blurRegion(action, previousStep, step);
        break;
      case 'scar_region':
        this.scarRegion(action, previousStep, step);
        break;
      case 'darken_region':
        this.darkenRegion(action, previousStep, step);
        break;
      case 'lighten_region':
        this.lightenRegion(action, previousStep, step);
        break;
      case 'add_texture':
        this.addTexture(action, previousStep, step);
        break;
      case 'pull_color':
        this.pullColor(action, previousStep, step);
        break;
      case 'revisit_region':
        this.revisitRegion(action, previousStep, step);
        break;
      case 'interrupt_canvas':
        this.interruptCanvas(action, previousStep, step);
        break;
      case 'pause_and_observe':
        break;
    }
  }

  private strokeLine(action: RunningAction, previousStep: number, step: number): void {
    const points = action.points ?? [];
    if (points.length < 2) return;
    const command = action.command;
    const ctx = this.baseCtx;
    const color = pickColor(command.mood, command.colorMood, action.seed);
    const end = Math.min(points.length - 1, Math.ceil((step / 90) * (points.length - 1)));
    const start = Math.max(1, Math.floor((previousStep / 90) * (points.length - 1)));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = start; i <= end; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      ctx.globalAlpha = 0.22 + command.intensity * 0.38;
      ctx.strokeStyle = color;
      ctx.lineWidth = random(1.2, 6 + command.intensity * 14);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2 + random(-5, 5), (a.y + b.y) / 2 + random(-5, 5), b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private washRegion(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.22);
    const count = Math.max(1, step - previousStep);
    for (let i = 0; i < count; i += 1) {
      const progress = ease((previousStep + i) / 90);
      this.irregularBlob(bounds, pickColor(action.command.mood, action.command.colorMood, i), 0.012 + action.command.intensity * 0.035 * progress, 8 + action.command.intensity * 10);
    }
  }

  private eraseRegion(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.14);
    const ctx = this.baseCtx;
    const passes = Math.max(1, step - previousStep);
    ctx.save();
    for (let i = 0; i < passes; i += 1) {
      const x = bounds.x + random(0, bounds.w);
      const y = bounds.y + random(0, bounds.h);
      const radius = random(bounds.w * 0.05, bounds.w * (0.12 + action.command.intensity * 0.12));
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(232, 225, 213, ${0.08 + action.command.intensity * 0.16})`);
      gradient.addColorStop(1, 'rgba(232, 225, 213, 0)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * random(0.8, 1.8), radius * random(0.35, 1), random(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private blurRegion(action: RunningAction, previousStep: number, step: number): void {
    if (step - previousStep < 3) return;
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.08);
    const tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.floor(bounds.w));
    tmp.height = Math.max(1, Math.floor(bounds.h));
    const tmpCtx = tmp.getContext('2d');
    if (!tmpCtx) return;
    tmpCtx.drawImage(this.base, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, tmp.width, tmp.height);
    this.baseCtx.save();
    this.baseCtx.globalAlpha = 0.08 + action.command.intensity * 0.12;
    this.baseCtx.filter = `blur(${2 + action.command.intensity * 8}px)`;
    this.baseCtx.drawImage(tmp, bounds.x + random(-2, 2), bounds.y + random(-2, 2), bounds.w, bounds.h);
    this.baseCtx.restore();
  }

  private scarRegion(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.12);
    const ctx = this.baseCtx;
    const passes = Math.max(1, Math.ceil((step - previousStep) * (0.8 + action.command.intensity)));
    ctx.save();
    ctx.lineCap = 'butt';
    for (let i = 0; i < passes; i += 1) {
      const x = bounds.x + random(0, bounds.w);
      const y = bounds.y + random(0, bounds.h);
      const length = random(18, bounds.w * (0.18 + action.command.intensity * 0.35));
      const angle = random(-Math.PI, Math.PI);
      ctx.globalAlpha = 0.28 + action.command.intensity * 0.45;
      ctx.strokeStyle = Math.random() > 0.28 ? pickColor('frustrated', 'dark') : hexToRgba('#e8dfcf', 0.65);
      ctx.lineWidth = random(0.7, 2.5 + action.command.intensity * 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      const midX = x + Math.cos(angle) * length * 0.5 + random(-10, 10);
      const midY = y + Math.sin(angle) * length * 0.5 + random(-10, 10);
      ctx.lineTo(midX, midY);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private darkenRegion(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.18);
    const passes = Math.max(1, step - previousStep);
    for (let i = 0; i < passes; i += 1) {
      this.irregularBlob(bounds, pickColor(action.command.mood, 'dark'), 0.008 + action.command.intensity * 0.028, 5 + action.command.intensity * 8);
    }
  }

  private lightenRegion(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.16);
    const passes = Math.max(1, step - previousStep);
    for (let i = 0; i < passes; i += 1) {
      this.irregularBlob(bounds, pickColor(action.command.mood, 'light'), 0.012 + action.command.intensity * 0.026, 7);
    }
  }

  private addTexture(action: RunningAction, previousStep: number, step: number): void {
    const bounds = regionBounds(action.command.targetRegion, this.base.width, this.base.height, 0.08);
    const ctx = this.baseCtx;
    const count = Math.ceil((step - previousStep) * (7 + action.command.intensity * 20));
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      ctx.globalAlpha = random(0.05, 0.16 + action.command.intensity * 0.12);
      ctx.fillStyle = pickColor(action.command.mood, action.command.colorMood);
      const size = random(0.6, 2.8 + action.command.intensity * 4);
      ctx.beginPath();
      ctx.ellipse(bounds.x + random(0, bounds.w), bounds.y + random(0, bounds.h), size, size * random(0.4, 1.8), random(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private pullColor(action: RunningAction, previousStep: number, step: number): void {
    const from = regionCenter(action.command.targetRegion, this.base.width, this.base.height);
    const to = regionCenter(action.command.secondaryRegion ?? 'center', this.base.width, this.base.height);
    const ctx = this.baseCtx;
    const passes = Math.max(1, step - previousStep);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < passes; i += 1) {
      const t0 = (previousStep + i) / 90;
      const t1 = Math.min(1, t0 + random(0.05, 0.16));
      const jitter = random(-32, 32);
      ctx.globalAlpha = 0.05 + action.command.intensity * 0.12;
      ctx.strokeStyle = pickColor(action.command.mood, action.command.colorMood, i);
      ctx.lineWidth = random(5, 18 + action.command.intensity * 24);
      ctx.beginPath();
      ctx.moveTo(from.x + random(-24, 24), from.y + random(-24, 24));
      ctx.bezierCurveTo(
        from.x + (to.x - from.x) * t0 + jitter,
        from.y + (to.y - from.y) * t0 - jitter,
        from.x + (to.x - from.x) * (t0 + t1) * 0.5 - jitter,
        from.y + (to.y - from.y) * (t0 + t1) * 0.5 + jitter,
        from.x + (to.x - from.x) * t1 + random(-20, 20),
        from.y + (to.y - from.y) * t1 + random(-20, 20)
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  private revisitRegion(action: RunningAction, previousStep: number, step: number): void {
    const variants: CanvasAction[] = ['stroke_line', 'wash_region', 'darken_region', 'scar_region', 'blur_region'];
    const choice = variants[Math.floor(action.seed) % variants.length];
    const subAction: RunningAction = { ...action, command: { ...action.command, action: choice, intensity: action.command.intensity * 0.72 } };
    if (choice === 'stroke_line' && !subAction.points) this.prepare(subAction);
    this.paint(subAction, previousStep, step);
  }

  private interruptCanvas(action: RunningAction, previousStep: number, step: number): void {
    if (step - previousStep < 1) return;
    const ctx = this.baseCtx;
    const progress = ease(step / 90);
    ctx.save();
    ctx.globalAlpha = 0.18 + action.command.intensity * 0.48;
    ctx.strokeStyle = pickColor('frustrated', action.command.colorMood ?? 'dark');
    ctx.lineWidth = 3 + action.command.intensity * 24;
    ctx.lineCap = 'round';
    const y = this.base.height * (0.18 + 0.68 * progress) + random(-18, 18);
    ctx.beginPath();
    ctx.moveTo(-40, y + random(-30, 30));
    for (let x = 0; x < this.base.width + 80; x += this.base.width / 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.018 + action.seed) * 40 + random(-28, 28));
    }
    ctx.stroke();
    ctx.restore();
  }

  private irregularBlob(bounds: { x: number; y: number; w: number; h: number }, color: string, alpha: number, points: number): void {
    const ctx = this.baseCtx;
    const cx = bounds.x + random(0.1, 0.9) * bounds.w;
    const cy = bounds.y + random(0.1, 0.9) * bounds.h;
    const rx = random(bounds.w * 0.08, bounds.w * 0.38);
    const ry = random(bounds.h * 0.08, bounds.h * 0.38);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = random(0.55, 1.2);
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private finish(action: RunningAction): Completion {
    const command = action.command;
    const target = command.targetRegion;
    const densityShift: Record<CanvasAction, number> = {
      stroke_line: 0.06,
      wash_region: 0.09,
      erase_region: -0.15,
      blur_region: -0.03,
      scar_region: 0.08,
      darken_region: 0.08,
      lighten_region: -0.07,
      add_texture: 0.05,
      pull_color: 0.06,
      revisit_region: 0.04,
      interrupt_canvas: 0.09,
      pause_and_observe: 0
    };
    const contrastShift: Record<CanvasAction, number> = {
      stroke_line: 0.05,
      wash_region: 0.01,
      erase_region: -0.07,
      blur_region: -0.05,
      scar_region: 0.14,
      darken_region: 0.1,
      lighten_region: -0.09,
      add_texture: 0.04,
      pull_color: 0.04,
      revisit_region: 0.04,
      interrupt_canvas: 0.16,
      pause_and_observe: 0
    };
    return {
      command,
      regionUpdates: {}
    };
  }

  private render(time: number): void {
    const pulse = pulseValue(this.mood, time);
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = `brightness(${0.97 + pulse * 0.05}) contrast(${0.98 + pulse * 0.04})`;
    this.ctx.drawImage(this.base, 0, 0);
    this.ctx.filter = 'none';
    this.ctx.globalAlpha = 0.16;
    this.ctx.drawImage(this.texture, 0, 0);
    if (this.active?.command.action === 'pause_and_observe') {
      this.ctx.globalAlpha = 0.035 + pulse * 0.035;
      this.ctx.fillStyle = '#f4efe7';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.debug) this.drawDebug();
    this.ctx.restore();
  }

  private drawDebug(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo((this.canvas.width / 3) * i, 0);
      ctx.lineTo((this.canvas.width / 3) * i, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (this.canvas.height / 3) * i);
      ctx.lineTo(this.canvas.width, (this.canvas.height / 3) * i);
      ctx.stroke();
    }
    if (this.active) {
      ctx.fillStyle = 'rgba(20, 20, 20, 0.72)';
      ctx.font = '24px monospace';
      ctx.fillText(`${this.active.command.action}:${this.active.command.targetRegion} ${Math.round(this.active.progress * 100)}%`, 24, 40);
    }
    ctx.restore();
  }

  private seedSurface(): void {
    this.baseCtx.fillStyle = baseColor;
    this.baseCtx.fillRect(0, 0, this.base.width, this.base.height);
    for (let i = 0; i < 90; i += 1) {
      const bounds = { x: 0, y: 0, w: this.base.width, h: this.base.height };
      this.irregularBlob(bounds, i % 3 === 0 ? '#eee9df' : '#d8d0c3', 0.012, 7);
    }
    this.makeTexture();
  }

  private makeTexture(): void {
    const image = this.textureCtx.createImageData(this.texture.width, this.texture.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const shade = 120 + Math.floor(Math.random() * 80);
      image.data[i] = shade;
      image.data[i + 1] = shade;
      image.data[i + 2] = shade;
      image.data[i + 3] = Math.random() > 0.5 ? 18 : 0;
    }
    this.textureCtx.putImageData(image, 0, 0);
  }
}
