import { describe, it, expect } from 'vitest';
import { validateContent, wordCount, contentPreview } from '../schemas';

describe('per-ritual content validation (5 configs)', () => {
  it('accepts a valid brain dump and rejects an empty one', () => {
    expect(
      validateContent('brain_dump', { kind: 'brain_dump', text: 'call mom\nfix sink', sorts: { '0': 'do' } }).ok
    ).toBe(true);
    expect(validateContent('brain_dump', { kind: 'brain_dump', text: '', sorts: {} }).ok).toBe(false);
    expect(
      validateContent('brain_dump', { kind: 'brain_dump', text: 'x', sorts: { '0': 'someday' } }).ok
    ).toBe(false);
  });

  it('gratitude requires exactly 3 slots with at least one filled', () => {
    expect(validateContent('gratitude', { kind: 'gratitude', items: ['sun', '', ''] }).ok).toBe(true);
    expect(validateContent('gratitude', { kind: 'gratitude', items: ['', '', ''] }).ok).toBe(false);
    expect(validateContent('gratitude', { kind: 'gratitude', items: ['a', 'b'] }).ok).toBe(false);
    expect(validateContent('gratitude', { kind: 'gratitude', items: ['a', 'b', 'c', 'd'] }).ok).toBe(false);
  });

  it('expressive and retrieval require non-empty text', () => {
    expect(validateContent('expressive', { kind: 'expressive', text: 'raw feeling' }).ok).toBe(true);
    expect(validateContent('expressive', { kind: 'expressive', text: '' }).ok).toBe(false);
    expect(validateContent('retrieval', { kind: 'retrieval', text: 'spacing effect' }).ok).toBe(true);
    expect(validateContent('retrieval', { kind: 'retrieval', text: '' }).ok).toBe(false);
  });

  it('intention requires exactly 3 plans with at least one non-empty', () => {
    const plans = [
      { if: '9am', then: 'write' },
      { if: '', then: '' },
      { if: '', then: '' },
    ];
    expect(validateContent('intention', { kind: 'intention', plans }).ok).toBe(true);
    expect(
      validateContent('intention', {
        kind: 'intention',
        plans: [
          { if: '', then: '' },
          { if: '', then: '' },
          { if: '', then: '' },
        ],
      }).ok
    ).toBe(false);
  });

  it('rejects cross-type content (wrong kind literal)', () => {
    expect(validateContent('gratitude', { kind: 'expressive', text: 'hi' }).ok).toBe(false);
  });

  it('word count and previews', () => {
    expect(wordCount({ kind: 'expressive', text: 'three little words' })).toBe(3);
    expect(contentPreview({ kind: 'gratitude', items: ['a', 'b', ''] })).toBe('2 ITEMS');
    expect(
      contentPreview({
        kind: 'intention',
        plans: [
          { if: 'x', then: 'y' },
          { if: '', then: '' },
          { if: '', then: '' },
        ],
      })
    ).toBe('1 PLAN');
  });
});
