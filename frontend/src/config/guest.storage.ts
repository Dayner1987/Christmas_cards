// src/config/guest.storage.ts
const KEY = 'christmas_guest_';
export const guestStorage = {
  save(groupId: string, token: string) { localStorage.setItem(KEY + groupId, token); },
  get(groupId: string): string | null { return localStorage.getItem(KEY + groupId); },
  clear(groupId: string) { localStorage.removeItem(KEY + groupId); },
};
