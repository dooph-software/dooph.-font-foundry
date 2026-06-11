export type WeightDef = {
  name: string;
  value: number;
};

export type FontMetadata = {
  familyName: string;
  copyright: string;
  licenseDescription: string;
  licenseURL: string;
  version: string;
};

export type GlyphData = {
  svgPathData: string;
  advanceWidth: number;
  svgSource?: string;
};

export type WeightEntry = {
  def: WeightDef;
  glyphs: Record<string, GlyphData>;
  kerningPairs: Record<string, number>;
};

export type Project = {
  familyName: string;
  metadata: FontMetadata;
  weights: Record<string, WeightEntry>;
  activeWeight: string;
  activeChar: string | null;
};
