export interface Theme {
  id: string | number;
  name: string;
}

export interface SubThematicArea {
  id: string | number;
  name: string;
  thematic_area?: string | number;
}
