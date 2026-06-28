import Phaser from 'phaser';
import { generateHomeTextures, generatePetTextures } from './homeTextures';
import { DECOR_BY_ID } from '../../../config/decor';

export const TILE = 32;
export const MAP_COLS = 18;
export const MAP_ROWS = 14;
export const MAP_W = MAP_COLS * TILE;
export const MAP_H = MAP_ROWS * TILE;

export type TimeOfDay = 'day' | 'evening' | 'night';
export type Weather = 'clear' | 'rain';
export type EmoteType = 'heart' | 'excl' | 'note' | 'smile';
export type PoseType = 'idle' | 'wave' | 'cheer' | 'sit';

export interface PlacementView {
  id: string;
  itemId: string;
  x: number; // 0~1
  y: number; // 0~1
  rotation: number;
  flipX: boolean;
}

export interface HomeSceneData {
  pet?: { species: string; name: string };
  placements: PlacementView[];
  timeOfDay: TimeOfDay;
}

type Dir = 'down' | 'up' | 'side';

/**
 * 개인 공간(집+마당) Phaser 씬.
 * - 캐릭터 자유 이동(가속/감속) + 포즈/감정
 * - 활성 펫 AI(배회/따라오기/쉬기/장난)
 * - 꾸미기 배치 렌더 + 편집(이동/회전/삭제) + 가구 상호작용(앉기/눕기)
 * - 낮/저녁/밤 틴트 + 간단 날씨
 * React와는 EventEmitter 브릿지로 통신(편집 결과는 store가 소스).
 */
export default class HomeScene extends Phaser.Scene {
  sceneData!: HomeSceneData;
  bridge!: Phaser.Events.EventEmitter;

  private player!: Phaser.Physics.Arcade.Sprite;
  private pet?: Phaser.Physics.Arcade.Sprite;
  private joy = { x: 0, y: 0 };
  private moveTarget: { x: number; y: number } | null = null;
  private dir: Dir = 'down';
  private vx = 0;
  private vy = 0;
  private posing = false;
  private seatTarget: { x: number; y: number; pose: 'sit' | 'lie' } | null = null;

  private editMode = false;
  private placeGhost?: Phaser.GameObjects.Image;
  private placeItemId?: string;
  private selectedId?: string;
  private selectRing?: Phaser.GameObjects.Graphics;
  private placementSprites = new Map<string, Phaser.GameObjects.Image>();
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private rain?: Phaser.GameObjects.Particles.ParticleEmitter;
  private petals?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflies?: Phaser.GameObjects.Particles.ParticleEmitter;

  // 펫 AI
  private petState: 'rest' | 'wander' | 'follow' | 'play' = 'rest';
  private petTarget: { x: number; y: number } | null = null;
  private petTimer = 0;
  /** 씬 부팅(create) 완료 여부 — React effect가 부팅 전 호출 시 크래시 방지 */
  private booted = false;

  // 카메라 줌/팬
  private follow = true;
  private downScreen?: { x: number; y: number };
  private downWorld?: { x: number; y: number };
  private panScroll = { x: 0, y: 0 };
  private dragged = false;
  private pinchStart = 0;
  private pinchZoom0 = 1;

  constructor() {
    super('Home');
  }

  configure(data: HomeSceneData, bridge: Phaser.Events.EventEmitter) {
    this.sceneData = data;
    this.bridge = bridge;
  }

  create() {
    this.booted = true;
    generateHomeTextures(this);
    if (this.sceneData.pet) generatePetTextures(this, this.sceneData.pet.species);

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.drawGround();
    this.drawHouseAndFence();
    this.createAnims();
    this.createPlayer();
    this.createPet();
    this.renderPlacements(this.sceneData.placements);

    // 낮/밤 오버레이
    this.nightOverlay = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x1a2348, 0).setDepth(50).setScrollFactor(1);
    this.applyTimeOfDay(this.sceneData.timeOfDay);

    this.setupCamera();
    this.setupInput();
    this.startAmbient();

    this.selectRing = this.add.graphics().setDepth(40);
    this.bridge.emit('ready');
  }

  // ── 맵 ──────────────────────────────────────────────
  private drawGround() {
    const variants = ['home-grass', 'home-grass-2', 'home-grass-3'];
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const isPath = tx === 8 || tx === 9; // 집 앞 세로 길
        const key = isPath ? 'home-path' : variants[(tx * 5 + ty * 7) % 3];
        this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, key).setDepth(0);
      }
    }
  }

  private drawHouseAndFence() {
    const place = (texKey: string, tx: number, ty: number, originY = 0.95, scale = 1) => {
      const wy = ty * TILE;
      this.add.image(tx * TILE, wy, texKey).setOrigin(0.5, originY).setDepth(this.depthFor(wy)).setScale(scale);
    };

    // 집 (상단 중앙)
    const house = this.add.image(MAP_W / 2, 2 * TILE + 8, 'home-house').setOrigin(0.5, 0.5).setDepth(this.depthFor(2 * TILE + 8 + 42));
    house.setInteractive({ useHandCursor: true });
    house.on('pointerdown', () => { if (!this.editMode) this.bridge.emit('house-tap'); });

    // 기본 정원(고정 장식) — 빈 마당이 아니라 아기자기한 첫인상
    place('decor-tree', 2.2, 3, 0.95, 1);
    place('decor-tree', MAP_COLS - 2.2, 3, 0.95, 1);
    place('decor-flowerbed', 6, 4.2, 0.9, 1);
    place('decor-flowerbed', MAP_COLS - 6, 4.2, 0.9, 1);
    place('decor-sunflower', 5, 3.2, 0.95, 1);
    place('decor-sunflower', MAP_COLS - 5, 3.2, 0.95, 1);
    place('decor-bush', 1.6, 6.5, 0.95, 1);
    place('decor-bush', MAP_COLS - 1.6, 6.5, 0.95, 1);
    place('decor-bush', 1.6, 9.5, 0.95, 1);
    place('decor-bush', MAP_COLS - 1.6, 9.5, 0.95, 1);

    // 외곽 울타리 — 좌/우/하단으로 마당을 감싸 '내 plot' 느낌
    for (let tx = 0; tx < MAP_COLS; tx++) place('decor-fence', tx + 0.5, MAP_ROWS - 0.15, 1, 0.95);
    for (let ty = 5; ty < MAP_ROWS - 1; ty += 1.4) {
      place('decor-fence', 0.5, ty, 1, 0.75);
      place('decor-fence', MAP_COLS - 0.5, ty, 1, 0.75);
    }
  }

  private depthFor(worldY: number) {
    // y-정렬 깊이 (아래일수록 앞)
    return 1 + worldY / 10000;
  }

  // ── 애니메이션 ──────────────────────────────────────
  private createAnims() {
    (['down', 'up', 'side'] as const).forEach((d) => {
      if (!this.anims.exists(`walk-${d}`))
        this.anims.create({ key: `walk-${d}`, frames: [{ key: `pc-${d}-a` }, { key: `pc-${d}-b` }], frameRate: 6, repeat: -1 });
      if (!this.anims.exists(`idle-${d}`))
        this.anims.create({ key: `idle-${d}`, frames: [{ key: `pc-${d}-a` }, { key: `pc-${d}-b` }], frameRate: 1.6, repeat: -1, yoyo: true });
    });
    if (this.sceneData.pet) {
      const sp = this.sceneData.pet.species;
      if (!this.anims.exists('pet-walk'))
        this.anims.create({ key: 'pet-walk', frames: [{ key: `pet-${sp}-a` }, { key: `pet-${sp}-b` }], frameRate: 6, repeat: -1 });
    }
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(MAP_W / 2, 8 * TILE, 'pc-down-a');
    this.player.setOrigin(0.5, 0.9);
    this.player.setDepth(this.depthFor(8 * TILE));
    this.player.body!.setSize(14, 10).setOffset(9, 32);
    this.player.setCollideWorldBounds(true);
  }

  private createPet() {
    if (!this.sceneData.pet) return;
    const sp = this.sceneData.pet.species;
    this.pet = this.physics.add.sprite(MAP_W / 2 + 30, 8 * TILE + 10, `pet-${sp}-sit`);
    this.pet.setOrigin(0.5, 0.9);
    this.pet.setDepth(this.depthFor(8 * TILE + 10));
    this.pet.setInteractive({ useHandCursor: true });
    this.pet.on('pointerdown', () => {
      if (this.editMode) return;
      this.spawnEmote(this.pet!.x, this.pet!.y - 24, 'heart');
      this.petState = 'play';
      this.petTimer = 1600;
      this.bridge.emit('pet-tap');
    });
  }

  // ── 배치 렌더 ───────────────────────────────────────
  setPlacements(list: PlacementView[]) {
    this.sceneData.placements = list;
    if (!this.booted) return;
    this.renderPlacements(list);
  }

  private renderPlacements(list: PlacementView[]) {
    // 제거된 것 정리
    for (const [id, spr] of this.placementSprites) {
      if (!list.find((p) => p.id === id)) { spr.destroy(); this.placementSprites.delete(id); }
    }
    list.forEach((p) => {
      const item = DECOR_BY_ID[p.itemId];
      if (!item) return;
      const wx = p.x * MAP_W;
      const wy = p.y * MAP_H;
      let spr = this.placementSprites.get(p.id);
      if (!spr) {
        spr = this.add.image(wx, wy, item.tex).setOrigin(0.5, item.flat ? 0.5 : 0.92);
        spr.setData('id', p.id);
        this.placementSprites.set(p.id, spr);
        spr.on('pointerdown', () => this.onPlacementTap(p.id));
      }
      spr.setTexture(item.tex);
      spr.setPosition(wx, wy);
      spr.setAngle(p.rotation);
      spr.setFlipX(p.flipX);
      spr.setDepth(item.flat ? 0.5 : this.depthFor(wy));
      spr.setInteractive({ useHandCursor: true });
    });
    if (this.selectedId) this.drawSelection();
  }

  private onPlacementTap(id: string) {
    if (this.editMode) {
      this.selectedId = id;
      this.drawSelection();
      this.bridge.emit('select', id);
    } else {
      // 가구 상호작용 (앉기/눕기)
      const p = this.sceneData.placements.find((x) => x.id === id);
      if (!p) return;
      const item = DECOR_BY_ID[p.itemId];
      if (item?.sit) {
        const wx = p.x * MAP_W;
        const wy = p.y * MAP_H;
        this.seatTarget = { x: wx, y: wy - 2, pose: item.sit };
        this.moveTarget = { x: wx, y: wy + 6 };
      }
    }
  }

  private drawSelection() {
    const ring = this.selectRing!;
    ring.clear();
    const spr = this.selectedId ? this.placementSprites.get(this.selectedId) : undefined;
    if (!spr || !this.editMode) return;
    const w = spr.displayWidth + 8;
    const h = spr.displayHeight + 8;
    ring.lineStyle(2, 0x4ade80, 1);
    ring.strokeRoundedRect(spr.x - w / 2, spr.y - spr.displayHeight * spr.originY - 4, w, h, 6);
  }

  // ── 편집 API (React에서 호출) ───────────────────────
  setEditMode(on: boolean) {
    this.editMode = on;
    if (!on) { this.selectedId = undefined; this.selectRing?.clear(); this.cancelPlacing(); }
    // 편집 중엔 드래그 가능하게
    this.placementSprites.forEach((spr) => {
      this.input.setDraggable(spr, on);
    });
  }

  startPlacing(itemId: string) {
    this.cancelPlacing();
    const item = DECOR_BY_ID[itemId];
    if (!item) return;
    this.placeItemId = itemId;
    this.placeGhost = this.add.image(this.player.x, this.player.y, item.tex).setOrigin(0.5, item.flat ? 0.5 : 0.92).setAlpha(0.7).setDepth(60);
  }

  cancelPlacing() {
    this.placeGhost?.destroy();
    this.placeGhost = undefined;
    this.placeItemId = undefined;
  }

  clearSelection() {
    this.selectedId = undefined;
    this.selectRing?.clear();
  }

  // ── 포즈 / 감정 (React에서 호출) ────────────────────
  setPose(pose: PoseType) {
    if (pose === 'idle') { this.posing = false; this.seatTarget = null; return; }
    this.posing = true;
    this.moveTarget = null;
    this.joy = { x: 0, y: 0 };
    const key = pose === 'sit' ? 'pc-sit' : pose === 'wave' ? 'pc-wave' : 'pc-cheer';
    this.player.anims.stop();
    this.player.setTexture(key);
    if (pose === 'wave') this.spawnEmote(this.player.x, this.player.y - 40, 'smile');
    if (pose !== 'sit') {
      this.time.delayedCall(2200, () => { this.posing = false; });
    }
  }

  playEmote(type: EmoteType) {
    this.spawnEmote(this.player.x, this.player.y - 40, type);
  }

  private spawnEmote(x: number, y: number, type: EmoteType) {
    const key = `emote-${type}`;
    const e = this.add.image(x, y, key).setDepth(70).setScale(0);
    this.tweens.add({ targets: e, scale: 1.4, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: e, y: y - 18, alpha: 0, delay: 700, duration: 700, onComplete: () => e.destroy() });
  }

  // ── 입력 ────────────────────────────────────────────
  setJoystick(x: number, y: number) {
    this.joy = { x, y };
    if (x !== 0 || y !== 0) { this.moveTarget = null; this.posing = false; this.seatTarget = null; }
  }

  private setupInput() {
    const cam = this.cameras.main;
    this.input.addPointer(1); // 핀치 줌용 2번째 포인터

    const ground = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0, 0).setDepth(-1).setInteractive();
    ground.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.editMode && this.placeGhost && this.placeItemId) {
        const xN = Phaser.Math.Clamp(pointer.worldX / MAP_W, 0.02, 0.98);
        const yN = Phaser.Math.Clamp(pointer.worldY / MAP_H, 0.08, 0.96);
        this.bridge.emit('place', { itemId: this.placeItemId, x: xN, y: yN });
        this.cancelPlacing();
        return;
      }
      if (this.editMode) { this.selectedId = undefined; this.selectRing?.clear(); this.bridge.emit('select', null); return; }
      // 플레이 모드: 탭(이동) vs 드래그(팬) 구분을 위해 시작점만 기록
      this.downScreen = { x: pointer.x, y: pointer.y };
      this.downWorld = { x: pointer.worldX, y: pointer.worldY };
      this.panScroll = { x: cam.scrollX, y: cam.scrollY };
      this.dragged = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.placeGhost) { this.placeGhost.setPosition(pointer.worldX, pointer.worldY); return; }
      if (this.editMode) return;
      // 핀치 줌
      const p1 = this.input.pointer1, p2 = this.input.pointer2;
      if (p1.isDown && p2.isDown) {
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.pinchStart === 0) { this.pinchStart = dist; this.pinchZoom0 = cam.zoom; }
        else if (dist > 0) this.setZoom(this.pinchZoom0 * (dist / this.pinchStart));
        this.dragged = true;
        return;
      }
      // 한 손가락 드래그 → 팬
      if (this.downScreen && pointer.isDown) {
        const dx = pointer.x - this.downScreen.x, dy = pointer.y - this.downScreen.y;
        if (this.dragged || Math.hypot(dx, dy) > 10) {
          this.dragged = true;
          this.setFollow(false);
          cam.setScroll(this.panScroll.x - dx / cam.zoom, this.panScroll.y - dy / cam.zoom);
        }
      }
    });

    this.input.on('pointerup', () => {
      this.pinchStart = 0;
      if (this.editMode) { this.downScreen = undefined; return; }
      if (this.downScreen && !this.dragged && this.downWorld) {
        // 탭 → 이동
        this.posing = false; this.seatTarget = null;
        this.moveTarget = { x: Phaser.Math.Clamp(this.downWorld.x, TILE, MAP_W - TILE), y: Phaser.Math.Clamp(this.downWorld.y, TILE, MAP_H - TILE) };
      }
      this.downScreen = undefined;
    });

    // 드래그로 배치 이동
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
      if (!this.editMode) return;
      obj.setPosition(Phaser.Math.Clamp(dx, 0, MAP_W), Phaser.Math.Clamp(dy, 0, MAP_H));
      this.selectedId = obj.getData('id');
      this.drawSelection();
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.editMode) return;
      const id = obj.getData('id') as string;
      this.bridge.emit('move', { id, x: Phaser.Math.Clamp(obj.x / MAP_W, 0, 1), y: Phaser.Math.Clamp(obj.y / MAP_H, 0, 1) });
    });
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.setZoom(1.25);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(60, 80);
  }

  // ── 카메라 줌/팬 API (React에서 호출) ───────────────
  private setFollow(on: boolean) {
    if (on === this.follow) return;
    this.follow = on;
    const cam = this.cameras.main;
    if (on) cam.startFollow(this.player, true, 0.1, 0.1);
    else cam.stopFollow();
    this.bridge.emit('freelook', !on);
  }

  setZoom(z: number) {
    if (!this.booted) return;
    this.cameras.main.setZoom(Phaser.Math.Clamp(z, 0.85, 2.6));
  }

  zoomBy(factor: number) {
    if (!this.booted) return;
    this.setZoom(this.cameras.main.zoom * factor);
  }

  recenter() {
    if (!this.booted) return;
    this.setFollow(true);
    this.moveTarget = null;
  }

  // ── 낮/밤 · 날씨 ────────────────────────────────────
  applyTimeOfDay(t: TimeOfDay) {
    this.sceneData.timeOfDay = t;
    // 화면 틴트는 HomeCanvas의 CSS 오버레이가 담당. 씬에서는 반딧불만 토글.
    if (!this.booted) return;
    this.updateFireflies(t);
  }

  private startAmbient() {
    // 꽃잎 흩날림 — 아늑한 분위기
    this.petals = this.add.particles(0, 0, 'p-petal', {
      x: { min: 0, max: MAP_W }, y: -6, lifespan: 7000,
      speedY: { min: 10, max: 22 }, speedX: { min: -10, max: 10 },
      scale: { min: 0.6, max: 1 }, alpha: { start: 0.85, end: 0.4 },
      rotate: { min: 0, max: 360 }, frequency: 650, quantity: 1,
    }).setDepth(46).setScrollFactor(1);
    this.updateFireflies(this.sceneData.timeOfDay);
  }

  private updateFireflies(t: TimeOfDay) {
    if (t === 'night') {
      if (!this.fireflies) {
        this.fireflies = this.add.particles(0, 0, 'p-firefly', {
          x: { min: 0, max: MAP_W }, y: { min: 2 * TILE, max: MAP_H }, lifespan: 2400,
          scale: { min: 0.6, max: 1.1 }, alpha: { start: 0.9, end: 0 },
          speed: { min: 4, max: 14 }, frequency: 300, quantity: 1,
        }).setDepth(51).setScrollFactor(1);
      }
    } else {
      this.fireflies?.destroy(); this.fireflies = undefined;
    }
  }

  setWeather(w: Weather) {
    if (!this.booted) return;
    if (w === 'rain') {
      if (this.rain) return;
      this.rain = this.add.particles(0, 0, 'p-rain', {
        x: { min: 0, max: MAP_W }, y: -10, lifespan: 900, speedY: { min: 320, max: 420 },
        speedX: { min: -30, max: -10 }, quantity: 2, frequency: 40, alpha: { start: 0.7, end: 0.3 },
      }).setDepth(55).setScrollFactor(1);
    } else {
      this.rain?.destroy(); this.rain = undefined;
    }
  }

  // ── 루프 ────────────────────────────────────────────
  update(_t: number, delta: number) {
    this.updatePlayer(delta);
    this.updatePet(delta);
  }

  private updatePlayer(delta: number) {
    const SPEED = 120;
    const ACCEL = 900;
    let tx = 0, ty = 0;

    if (!this.posing) {
      if (Math.abs(this.joy.x) > 0.05 || Math.abs(this.joy.y) > 0.05) {
        const len = Math.hypot(this.joy.x, this.joy.y) || 1;
        tx = (this.joy.x / len) * SPEED;
        ty = (this.joy.y / len) * SPEED;
      } else if (this.moveTarget) {
        const ddx = this.moveTarget.x - this.player.x;
        const ddy = this.moveTarget.y - this.player.y;
        const dist = Math.hypot(ddx, ddy);
        if (dist < 4) {
          this.moveTarget = null;
          if (this.seatTarget) { // 가구 도착 → 앉기/눕기
            this.player.setPosition(this.seatTarget.x, this.seatTarget.y);
            this.posing = true;
            this.player.anims.stop();
            this.player.setTexture('pc-sit');
            this.seatTarget = null;
          }
        } else {
          tx = (ddx / dist) * SPEED;
          ty = (ddy / dist) * SPEED;
        }
      }
    }

    // 가속/감속 (자연스러운 이동)
    const dt = delta / 1000;
    this.vx = Phaser.Math.Linear(this.vx, tx, Math.min(1, ACCEL * dt / SPEED));
    this.vy = Phaser.Math.Linear(this.vy, ty, Math.min(1, ACCEL * dt / SPEED));
    if (Math.abs(this.vx) < 2) this.vx = 0;
    if (Math.abs(this.vy) < 2) this.vy = 0;
    this.player.setVelocity(this.vx, this.vy);
    this.player.setDepth(this.depthFor(this.player.y));

    const moving = Math.abs(this.vx) > 6 || Math.abs(this.vy) > 6;
    if (this.posing) {
      // 포즈 유지
    } else if (moving) {
      if (Math.abs(this.vx) > Math.abs(this.vy)) { this.dir = 'side'; this.player.setFlipX(this.vx < 0); }
      else { this.dir = this.vy < 0 ? 'up' : 'down'; this.player.setFlipX(false); }
      this.player.anims.play(`walk-${this.dir}`, true);
      // 발밑 먼지
      if (Math.random() < 0.08) this.add.particles(this.player.x, this.player.y, 'p-dust', { lifespan: 300, speed: 8, scale: { start: 0.8, end: 0 }, quantity: 1, alpha: { start: 0.5, end: 0 } }).explode(1);
    } else {
      this.player.anims.play(`idle-${this.dir}`, true);
    }
  }

  private updatePet(delta: number) {
    if (!this.pet) return;
    const pet = this.pet;
    const SPEED = 60;
    this.petTimer -= delta;

    if (this.petTimer <= 0) {
      // 상태 전환
      const dx = this.player.x - pet.x, dy = this.player.y - pet.y;
      const distToPlayer = Math.hypot(dx, dy);
      const r = Math.random();
      if (distToPlayer > 120) { this.petState = 'follow'; }
      else if (r < 0.35) { this.petState = 'rest'; this.petTarget = null; }
      else if (r < 0.55) { this.petState = 'follow'; }
      else { this.petState = 'wander'; this.petTarget = { x: Phaser.Math.Clamp(pet.x + (Math.random() - 0.5) * 140, TILE, MAP_W - TILE), y: Phaser.Math.Clamp(pet.y + (Math.random() - 0.5) * 120, 3 * TILE, MAP_H - TILE) }; }
      this.petTimer = 1200 + Math.random() * 1800;
    }

    let target: { x: number; y: number } | null = null;
    if (this.petState === 'follow') {
      const ang = Math.atan2(this.player.y - pet.y, this.player.x - pet.x);
      target = { x: this.player.x - Math.cos(ang) * 34, y: this.player.y - Math.sin(ang) * 34 };
    } else if (this.petState === 'wander') {
      target = this.petTarget;
    }

    const sp = this.sceneData.pet!.species;
    if (target) {
      const ddx = target.x - pet.x, ddy = target.y - pet.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist > 6) {
        pet.setVelocity((ddx / dist) * SPEED, (ddy / dist) * SPEED);
        pet.setFlipX(ddx < 0);
        pet.anims.play('pet-walk', true);
      } else {
        pet.setVelocity(0, 0); pet.anims.stop(); pet.setTexture(`pet-${sp}-sit`);
        if (this.petState === 'wander') { this.petState = 'rest'; this.petTimer = 800 + Math.random() * 1200; }
      }
    } else {
      pet.setVelocity(0, 0); pet.anims.stop();
      if (this.petState === 'play') {
        // 장난 — 작게 점프
        pet.setTexture(`pet-${sp}-a`);
        pet.y += Math.sin(this.time.now / 80) * 0.6;
      } else {
        pet.setTexture(`pet-${sp}-sit`);
      }
    }
    pet.setDepth(this.depthFor(pet.y));
  }
}
