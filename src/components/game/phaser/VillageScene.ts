import Phaser from 'phaser';
import { generateAllTextures, generateAnimalTexture, type PlayerColors } from './textures';
import { houseTierTextureKey } from './buildings';

export const TILE = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 18;
export const MAP_W = MAP_COLS * TILE;
export const MAP_H = MAP_ROWS * TILE;

export interface VillageNpcData {
  id: string;
  species: string;
  name: string;
  dialogue: string[];
}

export interface VillageSceneData {
  playerColors: PlayerColors;
  npcs: VillageNpcData[];
  houseTier: 1 | 2 | 3;
  rareItem?: { emoji: string };
}

type Dir = 'down' | 'up' | 'side';

const WATER_RECT = { x: 17 * TILE, y: 2 * TILE, w: 4 * TILE, h: 3 * TILE };

const BUILDINGS: { key: string; x: number; y: number; navigate: 'shop' | 'inventory' | 'decorate' | 'house'; label: string; colliderW: number; colliderH: number }[] = [
  { key: 'building-house', x: 12 * TILE, y: 4 * TILE + 16, navigate: 'house', label: '우리 집', colliderW: 70, colliderH: 20 },
  { key: 'building-shop', x: 4 * TILE + 16, y: 8 * TILE + 24, navigate: 'shop', label: '상점', colliderW: 56, colliderH: 18 },
  { key: 'building-library', x: 20 * TILE - 16, y: 8 * TILE + 24, navigate: 'decorate', label: '도서관', colliderW: 56, colliderH: 18 },
  { key: 'building-school', x: 7 * TILE + 16, y: 15 * TILE, navigate: 'decorate', label: '학교', colliderW: 60, colliderH: 18 },
  { key: 'building-storage', x: 4 * TILE + 16, y: 12 * TILE + 16, navigate: 'inventory', label: '보유함', colliderW: 40, colliderH: 16 },
];

const TREES = [
  { x: 2 * TILE, y: 2 * TILE },
  { x: 22 * TILE, y: 2 * TILE },
  { x: 2 * TILE, y: 16 * TILE },
  { x: 22 * TILE, y: 16 * TILE },
  { x: 19.5 * TILE, y: 14.5 * TILE },
  { x: 3 * TILE, y: 9.5 * TILE },
];

const FLOWERS: { x: number; y: number; color: 'pink' | 'white' | 'purple' | 'yellow' }[] = [
  { x: 5 * TILE, y: 7 * TILE, color: 'pink' },
  { x: 18 * TILE, y: 7 * TILE, color: 'white' },
  { x: 9 * TILE, y: 11.5 * TILE, color: 'purple' },
  { x: 13.5 * TILE, y: 7 * TILE, color: 'yellow' },
];

const FOUNTAIN = { x: 15 * TILE, y: 9.5 * TILE };
const BENCHES = [{ x: 9 * TILE, y: 9 * TILE }, { x: 16 * TILE, y: 12 * TILE }];
const MAILBOX = { x: 12.5 * TILE, y: 5.5 * TILE };

const NPC_POSITIONS = [
  { x: 6 * TILE, y: 9.4 * TILE },
  { x: 9 * TILE, y: 9.4 * TILE },
  { x: 15 * TILE, y: 8.6 * TILE },
  { x: 18 * TILE, y: 9.4 * TILE },
  { x: 12 * TILE, y: 13.5 * TILE },
];

/**
 * 마을 WebGL 씬 — 32px 그리드 기반 잔디/길/물 + 충돌 영역, 카메라 추적,
 * 캐릭터 4방향 걷기/대기 애니메이션, 동물 주민 idle + 탭 대사,
 * 물 반짝임/나무 흔들림 환경 애니메이션, 미션/레벨업/배치/레어 파티클 이펙트를 담당한다.
 */
export default class VillageScene extends Phaser.Scene {
  sceneData!: VillageSceneData;
  bridge!: Phaser.Events.EventEmitter;

  private player!: Phaser.Physics.Arcade.Sprite;
  private water!: Phaser.GameObjects.TileSprite;
  private joyDir = { x: 0, y: 0 };
  private moveTarget: { x: number; y: number } | null = null;
  private currentDir: Dir = 'down';
  private rareShimmer?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('Village');
  }

  /** Phaser.Game 생성 전에 호출 — React ↔ 씬 데이터/이벤트 브릿지를 주입한다 */
  configure(data: VillageSceneData, bridge: Phaser.Events.EventEmitter) {
    this.sceneData = data;
    this.bridge = bridge;
  }

  create() {
    generateAllTextures(this, this.sceneData.playerColors);
    this.sceneData.npcs.forEach((npc) => generateAnimalTexture(this, npc.species));

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    this.drawGround();
    const colliders = this.createColliders();
    this.placeProps();
    this.placeBuildings(colliders);
    this.placeNpcs();
    this.createPlayer(colliders);
    this.createAnimations();
    this.setupCamera();
    this.setupInput();

    if (this.sceneData.rareItem) {
      this.rareShimmer = this.startRareShimmer(13 * TILE, 11 * TILE);
    }

    this.bridge.emit('ready');
  }

  // ── 맵 ──────────────────────────────────────────────
  private drawGround() {
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const px = tx * TILE;
        const py = ty * TILE;
        const inWater = px >= WATER_RECT.x && px < WATER_RECT.x + WATER_RECT.w && py >= WATER_RECT.y && py < WATER_RECT.y + WATER_RECT.h;
        if (inWater) continue;
        const isPath = ((ty === 8 || ty === 9) && tx >= 2 && tx <= 21) || ((tx === 11 || tx === 12) && ty >= 2 && ty <= 15);
        this.add.image(px + TILE / 2, py + TILE / 2, isPath ? 'tile-path' : 'tile-grass').setDepth(0);
      }
    }
    this.water = this.add.tileSprite(WATER_RECT.x, WATER_RECT.y, WATER_RECT.w, WATER_RECT.h, 'tile-water').setOrigin(0, 0).setDepth(0.5);
  }

  private createColliders() {
    const group = this.physics.add.staticGroup();
    const addRect = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x, y, w, h, 0x000000, 0);
      group.add(r);
    };
    // 외곽 울타리
    addRect(MAP_W / 2, TILE / 2, MAP_W, TILE);
    addRect(MAP_W / 2, MAP_H - TILE / 2, MAP_W, TILE);
    addRect(TILE / 2, MAP_H / 2, TILE, MAP_H);
    addRect(MAP_W - TILE / 2, MAP_H / 2, TILE, MAP_H);
    // 연못
    addRect(WATER_RECT.x + WATER_RECT.w / 2, WATER_RECT.y + WATER_RECT.h / 2, WATER_RECT.w, WATER_RECT.h);
    return group;
  }

  private placeProps() {
    TREES.forEach((t) => {
      const tree = this.add.image(t.x, t.y, 'tree').setOrigin(0.5, 0.97).setDepth(1);
      this.tweens.add({ targets: tree, angle: { from: -2.5, to: 2.5 }, duration: 2400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    FLOWERS.forEach((f) => this.add.image(f.x, f.y, `prop-flower-${f.color}`).setOrigin(0.5, 0.9).setDepth(1));
    this.add.image(FOUNTAIN.x, FOUNTAIN.y, 'prop-fountain').setOrigin(0.5, 1).setDepth(1);
    BENCHES.forEach((b) => this.add.image(b.x, b.y, 'prop-bench').setOrigin(0.5, 1).setDepth(1));
    this.add.image(MAILBOX.x, MAILBOX.y, 'prop-mailbox').setOrigin(0.5, 1).setDepth(1);
  }

  private placeBuildings(colliders: Phaser.Physics.Arcade.StaticGroup) {
    BUILDINGS.forEach((b) => {
      const key = b.key === 'building-house' ? houseTierTextureKey(this, this.sceneData.houseTier) : b.key;
      const img = this.add.image(b.x, b.y, key).setOrigin(0.5, 1).setDepth(1).setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.bridge.emit('navigate', b.navigate));
      const label = this.add.text(b.x, b.y + 4, b.label, {
        fontSize: '10px',
        fontFamily: 'sans-serif',
        color: '#5b4636',
        backgroundColor: '#ffffffb0',
        padding: { x: 4, y: 1 },
      }).setOrigin(0.5, 0).setDepth(1);
      label.setName('label');
      const r = this.add.rectangle(b.x, b.y - b.colliderH / 2, b.colliderW, b.colliderH, 0x000000, 0);
      colliders.add(r);
    });
  }

  private placeNpcs() {
    this.sceneData.npcs.slice(0, NPC_POSITIONS.length).forEach((npc, i) => {
      const pos = NPC_POSITIONS[i];
      const sprite = this.add.image(pos.x, pos.y, `npc-${npc.species}`).setOrigin(0.5, 1).setDepth(1).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: sprite, y: pos.y - 5, angle: { from: -4, to: 4 }, duration: 1100 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      sprite.on('pointerdown', () => {
        const lines = npc.dialogue.length > 0 ? npc.dialogue : ['안녕!'];
        const line = lines[Math.floor(Math.random() * lines.length)];
        this.showBubble(sprite, line);
        this.bridge.emit('resident-tap', npc.id);
      });
      this.add.text(pos.x, pos.y + 2, npc.name, {
        fontSize: '9px',
        fontFamily: 'sans-serif',
        color: '#5b4636',
        backgroundColor: '#ffffffb0',
        padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 0).setDepth(1);
    });
  }

  private createPlayer(colliders: Phaser.Physics.Arcade.StaticGroup) {
    const startX = 12 * TILE;
    const startY = 9 * TILE;
    this.player = this.physics.add.sprite(startX, startY, 'player-down-a');
    this.player.setOrigin(0.5, 0.92);
    this.player.body!.setSize(20, 16).setOffset(10, 34);
    this.player.setDepth(2);
    this.physics.add.collider(this.player, colliders);
  }

  private createAnimations() {
    (['down', 'up', 'side'] as const).forEach((dir) => {
      this.anims.create({ key: `walk-${dir}`, frames: [{ key: `player-${dir}-a` }, { key: `player-${dir}-b` }], frameRate: 5, repeat: -1 });
      this.anims.create({ key: `idle-${dir}`, frames: [{ key: `player-${dir}-a` }, { key: `player-${dir}-b` }], frameRate: 1.4, repeat: -1, yoyo: true });
    });
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.setZoom(1.4);
    cam.startFollow(this.player, true, 0.1, 0.1);
  }

  private setupInput() {
    const ground = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0).setDepth(-1).setInteractive();
    ground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.moveTarget = {
        x: Phaser.Math.Clamp(pointer.worldX, TILE, MAP_W - TILE),
        y: Phaser.Math.Clamp(pointer.worldY, TILE, MAP_H - TILE),
      };
    });
  }

  // ── 외부(React)에서 호출하는 입력/이펙트 API ──────────
  setJoystick(x: number, y: number) {
    this.joyDir = { x, y };
    if (x !== 0 || y !== 0) this.moveTarget = null;
  }

  private showBubble(sprite: Phaser.GameObjects.Image, text: string) {
    const prev = sprite.getData('bubble') as Phaser.GameObjects.Container | undefined;
    if (prev) prev.destroy();
    const txt = this.add.text(0, 0, text, { fontSize: '11px', fontFamily: 'sans-serif', color: '#3A2C20', wordWrap: { width: 110 } });
    const padding = 6;
    const w = txt.width + padding * 2;
    const h = txt.height + padding * 2;
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.fillRoundedRect(0, 0, w, h, 8);
    txt.setPosition(padding, padding);
    const container = this.add.container(sprite.x - w / 2, sprite.y - sprite.displayHeight - h - 6, [bg, txt]);
    container.setDepth(10);
    sprite.setData('bubble', container);
    this.time.delayedCall(2600, () => {
      container.destroy();
      sprite.setData('bubble', undefined);
    });
  }

  /** 미션 완료 시 포인트 획득 반짝임 파티클 */
  playMissionCompleteEffect() {
    const x = this.player.x;
    const y = this.player.y - 20;
    const emitter = this.add.particles(x, y, 'particle-sparkle', {
      speed: { min: 40, max: 100 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.9, end: 0 },
      lifespan: 650,
      quantity: 1,
      tint: [0xfff6d6, 0xffe69a],
    });
    emitter.explode(16);
    this.time.delayedCall(750, () => emitter.destroy());
  }

  /** 레벨업 시 별/반짝이 축하 이펙트 */
  playLevelUpEffect() {
    const x = this.player.x;
    const y = this.player.y - 20;
    const emitter = this.add.particles(x, y, 'particle-star', {
      speed: { min: 60, max: 170 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 900,
      quantity: 1,
      gravityY: 100,
    });
    emitter.explode(28);
    this.time.delayedCall(1000, () => emitter.destroy());
  }

  /** 아이템 배치 시 "뿅" 등장 이펙트 — 좌표는 타일 그리드 기준 (0~1 비율) */
  playItemPlacedEffect(xPct: number, yPct: number) {
    const x = xPct * MAP_W;
    const y = yPct * MAP_H;
    const ring = this.add.circle(x, y, 4, 0xffffff, 0.6).setDepth(9);
    this.tweens.add({ targets: ring, scaleX: 7, scaleY: 7, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
    const emitter = this.add.particles(x, y, 'particle-dot', {
      speed: { min: 20, max: 70 },
      scale: { start: 0.7, end: 0 },
      lifespan: 420,
      quantity: 1,
    });
    emitter.explode(10);
    this.time.delayedCall(500, () => emitter.destroy());
  }

  /** 희귀 아이템 은은한 반짝임 루프 */
  startRareShimmer(tileX: number, tileY: number) {
    return this.add.particles(tileX, tileY, 'particle-sparkle', {
      speed: { min: 4, max: 16 },
      scale: { start: 0.5, end: 0 },
      lifespan: 1300,
      quantity: 1,
      frequency: 380,
      alpha: { start: 0.85, end: 0 },
      tint: 0xfff6d6,
    });
  }

  update(_time: number, delta: number) {
    const speed = 130;
    let vx = 0;
    let vy = 0;

    if (Math.abs(this.joyDir.x) > 0.05 || Math.abs(this.joyDir.y) > 0.05) {
      vx = this.joyDir.x * speed;
      vy = this.joyDir.y * speed;
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        this.moveTarget = null;
      } else {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      }
    }

    this.player.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.currentDir = 'side';
        this.player.setFlipX(vx < 0);
      } else {
        this.currentDir = vy < 0 ? 'up' : 'down';
      }
      this.player.anims.play(`walk-${this.currentDir}`, true);
    } else {
      this.player.anims.play(`idle-${this.currentDir}`, true);
    }

    this.water.tilePositionX += delta * 0.02;
    this.water.tilePositionY += delta * 0.006;
  }
}
