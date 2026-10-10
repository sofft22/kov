export const BRAND = {
  name: 'KOVA',
  nameStrong: 'KOVA',
  nameLight: '',
  suffix: '',
  established: '2026',
  city: 'Lagos',
  whatsappNumber: '2348000000000',       // placeholder
  whatsappDisplay: '+234 800 000 0000',
  tiktok: 'https://tiktok.com/@kova',
  instagram: 'https://instagram.com/kova',
  email: 'hello@kova.ng',
};

export const BANK = {
  name: 'Access Bank',
  accountName: 'KOVA',
  accountNumber: '0000000000',
};

export function formatPrice(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KV-${n}`;
}