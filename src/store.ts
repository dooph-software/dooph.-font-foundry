import type { Project } from './types';

export const CHAR_SET: string[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'abcdefghijklmnopqrstuvwxyz',
  ...'0123456789',
  ...'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
  ' ',
];

export const WEIGHT_PRESETS = [
  { name: 'Thin', value: 100 },
  { name: 'ExtraLight', value: 200 },
  { name: 'Light', value: 300 },
  { name: 'Regular', value: 400 },
  { name: 'Medium', value: 500 },
  { name: 'SemiBold', value: 600 },
  { name: 'Bold', value: 700 },
  { name: 'ExtraBold', value: 800 },
  { name: 'Black', value: 900 },
];

export function createInitialProject(): Project {
  return {
    familyName: 'My Font',
    metadata: {
      familyName: 'My Font',
      copyright: '',
      licenseDescription: '',
      licenseURL: '',
      version: 'Version 1.0',
    },
    weights: {
      Regular: {
        def: { name: 'Regular', value: 400 },
        glyphs: {},
        kerningPairs: {},
      },
    },
    activeWeight: 'Regular',
    activeChar: null,
  };
}
