export interface SpeciesPalette {
  body: string;
  belly: string;
  accent: string;
  /** 갈기/날개/장식에 쓰이는 보조 색상 (유니콘, 드래곤, 피닉스 등) */
  extra?: string[];
}

export interface Proportions {
  scale: number;
  headR: number;
  bodyRx: number;
  bodyRy: number;
  bodyCy: number;
  headCy: number;
}

export interface ShapeProps {
  p: Proportions;
  palette: SpeciesPalette;
  dark: string;
  light: string;
}
