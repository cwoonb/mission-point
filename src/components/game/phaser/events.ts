import Phaser from 'phaser';

/** Phaser 씬 ↔ React 사이의 이벤트 브릿지 타입 */
export interface VillageSceneEvents {
  ready: () => void;
  navigate: (target: 'shop' | 'inventory' | 'decorate' | 'house') => void;
  'resident-tap': (residentId: string) => void;
}

export function createVillageBridge(): Phaser.Events.EventEmitter {
  return new Phaser.Events.EventEmitter();
}
