import type { MammalSpecies } from './AnimalResident';
import type { BirdSpecies } from './BirdResident';

export type ResidentSpeciesInfo =
  | { kind: 'mammal'; species: MammalSpecies }
  | { kind: 'bird'; species: BirdSpecies };

/** VillageResident.emoji → SVG 동물 컴포넌트 매핑 (이모지 대체용) */
export const RESIDENT_SPECIES: Record<string, ResidentSpeciesInfo> = {
  '🐰': { kind: 'mammal', species: 'rabbit' },
  '🐿️': { kind: 'mammal', species: 'squirrel' },
  '🦫': { kind: 'mammal', species: 'beaver' },
  '🦊': { kind: 'mammal', species: 'fox' },
  '🐱': { kind: 'mammal', species: 'cat' },
  '🐶': { kind: 'mammal', species: 'dog' },
  '🐻': { kind: 'mammal', species: 'bear' },
  '🐼': { kind: 'mammal', species: 'panda' },
  '🐧': { kind: 'bird', species: 'penguin' },
  '🦉': { kind: 'bird', species: 'owl' },
};
