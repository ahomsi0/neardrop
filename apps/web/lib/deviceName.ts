const ADJECTIVES = [
  'Swift', 'Bold', 'Calm', 'Bright', 'Brave', 'Keen', 'Wise', 'Warm',
  'Agile', 'Crisp', 'Deft', 'Eager', 'Fair', 'Glad', 'Kind', 'Lively',
  'Noble', 'Proud', 'Quick', 'Sharp', 'Smart', 'Vivid', 'Zesty', 'Fierce',
];

const ANIMALS: { name: string; emoji: string }[] = [
  { name: 'Fox',     emoji: '🦊' }, { name: 'Penguin', emoji: '🐧' },
  { name: 'Otter',   emoji: '🦦' }, { name: 'Panda',   emoji: '🐼' },
  { name: 'Wolf',    emoji: '🐺' }, { name: 'Eagle',   emoji: '🦅' },
  { name: 'Dolphin', emoji: '🐬' }, { name: 'Tiger',   emoji: '🐯' },
  { name: 'Bear',    emoji: '🐻' }, { name: 'Owl',     emoji: '🦉' },
  { name: 'Lynx',    emoji: '🐱' }, { name: 'Hawk',    emoji: '🦅' },
];

export function generateDeviceName(): { displayName: string; emoji: string } {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return { displayName: `${adj} ${animal.name}`, emoji: animal.emoji };
}

export function detectDeviceType(): 'mobile' | 'desktop' {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    ? 'mobile' : 'desktop';
}

export interface DeviceIdentity {
  id: string;
  displayName: string;
  emoji: string;
  deviceType: 'mobile' | 'desktop';
}

const KEY = 'neardrop-identity';

export function getOrCreateIdentity(): DeviceIdentity {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DeviceIdentity;
  } catch { /* private mode or parse error — generate fresh */ }
  const { displayName, emoji } = generateDeviceName();
  const identity: DeviceIdentity = {
    id: crypto.randomUUID(),
    displayName,
    emoji,
    deviceType: detectDeviceType(),
  };
  try { localStorage.setItem(KEY, JSON.stringify(identity)); } catch { /* ignore */ }
  return identity;
}

export function updateDisplayName(displayName: string): DeviceIdentity {
  const current = getOrCreateIdentity();
  const updated = { ...current, displayName };
  try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return updated;
}
