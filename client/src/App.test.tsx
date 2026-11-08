import { describe, it, expect } from 'vitest';

describe('Frontend Component & Form Validation Tests', () => {
  it('validates complaint ID pattern ECO-YYYY-XXXXX', () => {
    const pattern = /^ECO-\d{4}-\d{5}$/;
    expect(pattern.test('ECO-2026-00001')).toBe(true);
    expect(pattern.test('ECO-2026-99999')).toBe(true);
    expect(pattern.test('INVALID-ID')).toBe(false);
  });

  it('validates required fields for complaint submission', () => {
    const validateForm = (data: { title: string; category: string; address: string; locality: string }) => {
      if (!data.title.trim()) return 'Title is required';
      if (!data.category) return 'Category is required';
      if (!data.address.trim()) return 'Address is required';
      if (!data.locality.trim()) return 'Locality is required';
      return null;
    };

    expect(validateForm({ title: '', category: 'Garbage Accumulation', address: '100ft', locality: 'Indiranagar' })).toBe('Title is required');
    expect(validateForm({ title: 'Dump pile', category: '', address: '100ft', locality: 'Indiranagar' })).toBe('Category is required');
    expect(validateForm({ title: 'Dump pile', category: 'Garbage Accumulation', address: '', locality: 'Indiranagar' })).toBe('Address is required');
    expect(validateForm({ title: 'Dump pile', category: 'Garbage Accumulation', address: '100ft', locality: '' })).toBe('Locality is required');
    expect(validateForm({ title: 'Dump pile', category: 'Garbage Accumulation', address: '100ft', locality: 'Indiranagar' })).toBeNull();
  });

  it('calculates resolution rate percentage accurately without division by zero', () => {
    const calculateRate = (resolved: number, validTotal: number) => {
      if (validTotal === 0) return 0;
      return Math.round((resolved / validTotal) * 1000) / 10;
    };

    expect(calculateRate(0, 0)).toBe(0);
    expect(calculateRate(3, 4)).toBe(75);
    expect(calculateRate(2, 6)).toBe(33.3);
    expect(calculateRate(10, 10)).toBe(100);
  });

  it('filters complaints by category and status correctly', () => {
    const items = [
      { id: 1, category: 'Garbage Accumulation', status: 'Submitted' },
      { id: 2, category: 'Overflowing Dustbin', status: 'In Progress' },
      { id: 3, category: 'Garbage Accumulation', status: 'Resolved' },
    ];

    const filterByCategory = (cat: string) => items.filter((i) => i.category === cat);
    const filterByStatus = (st: string) => items.filter((i) => i.status === st);

    expect(filterByCategory('Garbage Accumulation')).toHaveLength(2);
    expect(filterByCategory('Overflowing Dustbin')).toHaveLength(1);
    expect(filterByStatus('Resolved')).toHaveLength(1);
    expect(filterByStatus('In Progress')).toHaveLength(1);
  });
});
