import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUploadHistory,
  saveToHistory,
  removeFromHistory,
  clearUploadHistory,
  isItemExpired,
  getDaysRemaining,
  HistoryItem,
} from '@/lib/storage/history-store';

describe('History Store', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    });
  });

  it('should return empty array initially', () => {
    expect(getUploadHistory()).toEqual([]);
  });

  it('should save and retrieve upload history items', () => {
    const item: HistoryItem = {
      id: 'abc12345',
      publicUrl: '/f/abc12345',
      deleteToken: 'token_secret',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalSize: 5000,
      fileCount: 2,
      files: [
        { filename: 'img.jpg', fileSize: 2000, category: 'image', extension: 'jpg' },
        { filename: 'doc.pdf', fileSize: 3000, category: 'document', extension: 'pdf' },
      ],
    };

    saveToHistory(item);
    const history = getUploadHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('abc12345');
    expect(history[0].files.length).toBe(2);
  });

  it('should remove an item by id', () => {
    const item1: HistoryItem = {
      id: 'item1',
      publicUrl: '/f/item1',
      deleteToken: 'token1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10000).toISOString(),
      totalSize: 1000,
      fileCount: 1,
      files: [{ filename: '1.png', fileSize: 1000, category: 'image', extension: 'png' }],
    };
    const item2: HistoryItem = {
      id: 'item2',
      publicUrl: '/f/item2',
      deleteToken: 'token2',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10000).toISOString(),
      totalSize: 2000,
      fileCount: 1,
      files: [{ filename: '2.png', fileSize: 2000, category: 'image', extension: 'png' }],
    };

    saveToHistory(item1);
    saveToHistory(item2);
    expect(getUploadHistory().length).toBe(2);

    removeFromHistory('item1');
    const remaining = getUploadHistory();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('item2');
  });

  it('should correctly detect expired vs active items', () => {
    const activeItem: HistoryItem = {
      id: 'active',
      publicUrl: '/f/active',
      deleteToken: 't1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      totalSize: 100,
      fileCount: 1,
      files: [],
    };

    const expiredItem: HistoryItem = {
      id: 'expired',
      publicUrl: '/f/expired',
      deleteToken: 't2',
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      expiresAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      totalSize: 100,
      fileCount: 1,
      files: [],
    };

    expect(isItemExpired(activeItem)).toBe(false);
    expect(isItemExpired(expiredItem)).toBe(true);
    expect(getDaysRemaining(activeItem.expiresAt)).toBeGreaterThan(0);
    expect(getDaysRemaining(expiredItem.expiresAt)).toBe(0);
  });
});
