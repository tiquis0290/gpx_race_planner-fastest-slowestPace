import cs from './cs';
import sk from './sk';
import en from './en';

export type Lang = 'cs' | 'sk' | 'en';

export const translations = { cs, sk, en };

export type T = typeof cs;
