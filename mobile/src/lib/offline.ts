import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';

export interface OfflineAction {
  id: string;
  endpoint: string;
  method: string;
  body?: string;
  created_at: string;
}

const QUEUE_KEY = 'offline_queue';

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

export async function processQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  if (__DEV__) console.log('[offline] Processing', queue.length, 'queued actions');

  const remaining: OfflineAction[] = [];

  for (const action of queue) {
    try {
      await apiFetch(action.endpoint, {
        method: action.method,
        body: action.body,
      });
      if (__DEV__) console.log('[offline] Replayed:', action.id);
    } catch (e) {
      if (__DEV__) console.warn('[offline] Failed to replay:', action.id, e);
      remaining.push(action);
    }
  }

  await writeQueue(remaining);
}
