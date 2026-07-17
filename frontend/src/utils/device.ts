/** Anonymous device ID utility using localStorage. */

const DEVICE_ID_KEY = 'vanguard_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `vol-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function resetDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
