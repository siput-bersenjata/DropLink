'use client';

import { FileCategory, getFileExtension } from '../validation/file-validator';

export interface HistoryItemFile {
  filename: string;
  fileSize: number;
  category: FileCategory;
  extension: string;
}

export interface HistoryItem {
  id: string;
  publicUrl: string;
  deleteToken: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  totalSize: number;
  fileCount: number;
  files: HistoryItemFile[];
}

const STORAGE_KEY = 'droplink_history_v1';

function canAccessStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function getUploadHistory(): HistoryItem[] {
  if (!canAccessStorage()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Error reading upload history:', err);
    return [];
  }
}

export function saveToHistory(item: HistoryItem): void {
  if (!canAccessStorage()) return;
  try {
    const existing = getUploadHistory();
    // Filter out if item already exists
    const filtered = existing.filter((h) => h.id !== item.id);
    const updated = [item, ...filtered];
    // Keep up to 50 items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.error('Error saving upload history:', err);
  }
}

export function removeFromHistory(id: string): void {
  if (!canAccessStorage()) return;
  try {
    const existing = getUploadHistory();
    const filtered = existing.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing from upload history:', err);
  }
}

export function clearUploadHistory(): void {
  if (!canAccessStorage()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing upload history:', err);
  }
}

export function isItemExpired(item: HistoryItem): boolean {
  const expiry = new Date(item.expiresAt).getTime();
  const now = Date.now();
  return now >= expiry;
}

export function getDaysRemaining(expiresAt: string): number {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffMs = expiry - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
