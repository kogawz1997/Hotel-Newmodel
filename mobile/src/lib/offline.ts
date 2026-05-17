import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';

export interface OfflineAction {
  id: string;
  endpoint: string;
  method: string;
  body?: string;
  created_at: string;
  status?: 'pending' | 'conflict' | 'done';
}

const QUEUE_KEY = 'offline_queue';
const CONFLICTS_KEY = 'offline_conflicts';

async function readQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OfflineAction[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    if (__DEV__) console.warn('[offline] Failed to persist queue:', e);
  }
}

export async function addToQueue(action: OfflineAction): Promise<void> {
  const queue = await readQueue();
  queue.push(action);
  await writeQueue(queue);
  if (__DEV__) console.log('[offline] Queued action:', action.id, action.method, action.endpoint);
}

async function readConflicts(): Promise<OfflineAction[]> {
  try {
    const raw = await SecureStore.getItemAsync(CONFLICTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

async function writeConflicts(conflicts: OfflineAction[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(CONFLICTS_KEY, JSON.stringify(conflicts));
  } catch (e) {
    if (__DEV__) console.warn('[offline] Failed to persist conflicts:', e);
  }
}

export async function processQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  if (__DEV__) console.log('[offline] Processing', queue.length, 'queued actions');

  const remaining: OfflineAction[] = [];

  for (const action of queue) {
    try {
      const response = await apiFetch(action.endpoint, {
        method: action.method,
        body: action.body,
      });
      if (__DEV__) console.log('[offline] Replayed:', action.id);
    } catch (e: any) {
      if (e?.status === 409 || e?.statusCode === 409) {
        if (__DEV__) console.warn('[offline] Conflict detected for:', action.id);
        const conflicts = await readConflicts();
        conflicts.push({ ...action, status: 'conflict' });
        await writeConflicts(conflicts);
      } else {
        if (__DEV__) console.warn('[offline] Failed to replay:', action.id, e);
        remaining.push(action);
      }
    }
  }

  await writeQueue(remaining);
}

export async function getConflicts(): Promise<OfflineAction[]> {
  return readConflicts();
}

export async function resolveConflict(id: string): Promise<void> {
  const conflicts = await readConflicts();
  await writeConflicts(conflicts.filter(c => c.id !== id));
  if (__DEV__) console.log('[offline] Resolved conflict:', id);
}
