import { describe, it, expect } from 'vitest';
import cs from '../../src/i18n/cs';
import en from '../../src/i18n/en';
import sk from '../../src/i18n/sk';

const csKeys = Object.keys(cs) as (keyof typeof cs)[];

describe('i18n completeness', () => {
  it('en has all keys defined in cs', () => {
    const missing = csKeys.filter((k) => !(k in en));
    expect(missing, `Missing keys in en: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('sk has all keys defined in cs', () => {
    const missing = csKeys.filter((k) => !(k in sk));
    expect(missing, `Missing keys in sk: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('en has no extra keys not present in cs', () => {
    const extra = Object.keys(en).filter((k) => !(k in cs));
    expect(extra, `Extra keys in en: ${extra.join(', ')}`).toHaveLength(0);
  });

  it('sk has no extra keys not present in cs', () => {
    const extra = Object.keys(sk).filter((k) => !(k in cs));
    expect(extra, `Extra keys in sk: ${extra.join(', ')}`).toHaveLength(0);
  });

  it('en string values are non-empty', () => {
    const empty = csKeys.filter((k) => {
      const v = en[k as keyof typeof en];
      return typeof v === 'string' && v.trim() === '';
    });
    expect(empty, `Empty string values in en: ${empty.join(', ')}`).toHaveLength(0);
  });

  it('sk string values are non-empty', () => {
    const empty = csKeys.filter((k) => {
      const v = sk[k as keyof typeof sk];
      return typeof v === 'string' && v.trim() === '';
    });
    expect(empty, `Empty string values in sk: ${empty.join(', ')}`).toHaveLength(0);
  });
});
