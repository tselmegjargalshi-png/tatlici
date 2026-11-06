// 14 үндсэн харшил үүсгэгч (EU 1169/2011). Дүрс бүр 24x24 цагаан SVG.
export const ALLERGENS = [
  {
    key: 'peanuts', color: '#F2B84B', mn: 'Газрын самар', tr: 'Yer fıstığı',
    svg: '<path fill="#fff" d="M12 2.5c-2.5 0-4.2 1.9-4.2 4.3 0 1.5.7 2.5 1.3 3.3-.7.9-1.6 2-1.6 3.9 0 2.9 2 5.5 4.5 5.5s4.5-2.6 4.5-5.5c0-1.9-.9-3-1.6-3.9.6-.8 1.3-1.8 1.3-3.3 0-2.4-1.7-4.3-4.2-4.3z"/><circle cx="10.6" cy="6.6" r=".9" fill="#F2B84B"/><circle cx="13.3" cy="8.4" r=".9" fill="#F2B84B"/><circle cx="11" cy="14" r=".9" fill="#F2B84B"/><circle cx="13.4" cy="16" r=".9" fill="#F2B84B"/>'
  },
  {
    key: 'treenuts', color: '#E98F35', mn: 'Модны самар', tr: 'Sert kabuklu yemişler',
    svg: '<rect x="11.1" y="2" width="1.8" height="3" rx=".9" fill="#fff"/><path fill="#fff" d="M4.5 10c0-3.3 3.4-5.5 7.5-5.5s7.5 2.2 7.5 5.5z"/><path fill="#fff" d="M6.4 11.2h11.2c0 5-2.6 8.8-5.6 10.6-3-1.8-5.6-5.6-5.6-10.6z"/>'
  },
  {
    key: 'crustaceans', color: '#2F7FD6', mn: 'Хавч хэлбэртэн', tr: 'Kabuklular',
    svg: '<ellipse cx="12" cy="14.5" rx="5.2" ry="3.6" fill="#fff"/><path fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M7 13.5 3.5 12M7 16l-3.3 1.6M17 13.5l3.5-1.5M17 16l3.3 1.6M8.6 11.5 6.2 8.4M15.4 11.5l2.4-3.1"/><path fill="#fff" d="M3.6 5.2a2.8 2.8 0 0 1 4.6 1.2L6 7.6l.9 1.4a2.8 2.8 0 0 1-3.3-3.8zM20.4 5.2a2.8 2.8 0 0 0-4.6 1.2L18 7.6l-.9 1.4a2.8 2.8 0 0 0 3.3-3.8z"/>'
  },
  {
    key: 'molluscs', color: '#2FA89B', mn: 'Нялцгай биетэн', tr: 'Yumuşakçalar',
    svg: '<path fill="#fff" d="M12 20.5 3.6 10.8A8.6 8.6 0 0 1 12 3.5a8.6 8.6 0 0 1 8.4 7.3z"/><path fill="none" stroke="#2FA89B" stroke-width="1.3" stroke-linecap="round" d="M12 19.5V5M12 19.5 7.3 6.4M12 19.5l4.7-13.1M12 19.5 4.8 9.6M12 19.5l7.2-9.9"/><rect x="9.5" y="19.3" width="5" height="2.2" rx="1" fill="#fff"/>'
  },
  {
    key: 'fish', color: '#1E9ED8', mn: 'Загас', tr: 'Balık',
    svg: '<path fill="#fff" d="M6 12c2.4-3.4 5.6-5.3 9-5.3 3.6 0 6 2.6 7 5.3-1 2.7-3.4 5.3-7 5.3-3.4 0-6.6-1.9-9-5.3z"/><path fill="#fff" d="M1.8 7.2 6.8 12l-5 4.8z"/><circle cx="17.6" cy="11" r="1.2" fill="#1E9ED8"/>'
  },
  {
    key: 'eggs', color: '#E2BC0B', mn: 'Өндөг', tr: 'Yumurta',
    svg: '<path fill="#fff" d="M12 3c3 0 4.4 2 6.4 3.4S21.2 10 21.2 13c0 4.2-3.6 7.6-8.6 7.6S2.8 18.1 2.8 13.6 5 8 7 6.5 9 3 12 3z"/><circle cx="12" cy="12.4" r="3.6" fill="#F4A100"/>'
  },
  {
    key: 'milk', color: '#D08CCB', mn: 'Сүү', tr: 'Süt',
    svg: '<path fill="#fff" d="M5.6 2.5h4.6v2.3l1.6 2.6V21.5H4V7.4l1.6-2.6z"/><rect x="5.4" y="11" width="5" height="5.5" rx=".6" fill="#D08CCB"/><path fill="#fff" d="M13.4 9.5h6.8l-.9 12h-5z"/><path fill="#D08CCB" d="M14 12.3h5.6l-.1 1.3H14.1z"/>'
  },
  {
    key: 'gluten', color: '#9C4F2A', mn: 'Цавуулаг', tr: 'Gluten',
    svg: '<path fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M12 22V5.5"/><g fill="#fff"><ellipse cx="12" cy="4.2" rx="1.5" ry="2.4"/><ellipse cx="9.4" cy="8.4" rx="1.4" ry="2.5" transform="rotate(-35 9.4 8.4)"/><ellipse cx="14.6" cy="8.4" rx="1.4" ry="2.5" transform="rotate(35 14.6 8.4)"/><ellipse cx="9.4" cy="12.6" rx="1.4" ry="2.5" transform="rotate(-35 9.4 12.6)"/><ellipse cx="14.6" cy="12.6" rx="1.4" ry="2.5" transform="rotate(35 14.6 12.6)"/><ellipse cx="9.4" cy="16.8" rx="1.4" ry="2.5" transform="rotate(-35 9.4 16.8)"/><ellipse cx="14.6" cy="16.8" rx="1.4" ry="2.5" transform="rotate(35 14.6 16.8)"/></g>'
  },
  {
    key: 'soy', color: '#2E9447', mn: 'Шар буурцаг', tr: 'Soya',
    svg: '<rect x="2.5" y="8.2" width="19" height="7.6" rx="3.8" fill="#fff" transform="rotate(-35 12 12)"/><g fill="#2E9447"><circle cx="8" cy="14.8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="16" cy="9.2" r="1.6"/></g>'
  },
  {
    key: 'sesame', color: '#EE832B', mn: 'Кунжут', tr: 'Susam',
    svg: '<g fill="#fff"><ellipse cx="12" cy="5.5" rx="1.9" ry="3"/><ellipse cx="5.6" cy="10.4" rx="1.9" ry="3" transform="rotate(-70 5.6 10.4)"/><ellipse cx="18.4" cy="10.4" rx="1.9" ry="3" transform="rotate(70 18.4 10.4)"/><ellipse cx="8" cy="18" rx="1.9" ry="3" transform="rotate(-35 8 18)"/><ellipse cx="16" cy="18" rx="1.9" ry="3" transform="rotate(35 16 18)"/><circle cx="12" cy="12.6" r="1.5"/></g>'
  },
  {
    key: 'celery', color: '#7FBE69', mn: 'Селдерей', tr: 'Kereviz',
    svg: '<path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" d="M6 21 15 6M9.5 21l8-12.5M13 21l6.5-9.5"/><path fill="#fff" d="M15.5 2.5c2 0 3.5 1.3 3.8 3-1.6.6-3.6.2-4.7-1.2zM19.8 6.3c1.4.9 2 2.6 1.5 4.1-1.6-.2-2.9-1.6-3-3.2z"/>'
  },
  {
    key: 'mustard', color: '#C38E35', mn: 'Гич', tr: 'Hardal',
    svg: '<path fill="#fff" d="M10.6 1.8h2.8V4h-2.8z"/><path fill="#fff" d="M9.6 4.5h4.8l1.8 3V22H7.8V7.5z"/><rect x="9.6" y="11" width="4.8" height="6" rx="1" fill="#C38E35"/><circle cx="18.6" cy="19.5" r="1.6" fill="#fff"/>'
  },
  {
    key: 'lupin', color: '#977BCB', mn: 'Люпин', tr: 'Acı bakla',
    svg: '<path fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M12 22v-8M12 18.5l-3.5-2M12 18.5l3.5-2"/><g fill="#fff"><ellipse cx="12" cy="3.6" rx="1.4" ry="1.6"/><ellipse cx="9.8" cy="6.4" rx="1.6" ry="1.3"/><ellipse cx="14.2" cy="6.4" rx="1.6" ry="1.3"/><ellipse cx="9.4" cy="9.2" rx="1.9" ry="1.4"/><ellipse cx="14.6" cy="9.2" rx="1.9" ry="1.4"/><ellipse cx="9.2" cy="12.2" rx="2.1" ry="1.5"/><ellipse cx="14.8" cy="12.2" rx="2.1" ry="1.5"/><rect x="11.2" y="3.6" width="1.6" height="11" rx=".8"/></g>'
  },
  {
    key: 'sulphites', color: '#8C1D2A', mn: 'Сульфит', tr: 'Sülfitler',
    svg: '<path fill="#fff" d="M6.5 2.5h11c0 5.4-2.2 9-5.5 9s-5.5-3.6-5.5-9z"/><path fill="#8C1D2A" d="M7.7 4.2h8.6c-.2.9-.3 1.4-.6 2.1H8.3c-.3-.7-.5-1.2-.6-2.1z" opacity=".55"/><rect x="11.1" y="11" width="1.8" height="7.5" fill="#fff"/><rect x="7.5" y="18.5" width="9" height="2.6" rx="1.3" fill="#fff"/>'
  }
];

export const ALLERGEN_MAP = Object.fromEntries(ALLERGENS.map((a) => [a.key, a]));

export function allergenIcon(key, size = 26) {
  const a = ALLERGEN_MAP[key];
  if (!a) return '';
  return `<svg class="alg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="background:${a.color}">${a.svg}</svg>`;
}

export const BADGES = {
  signature: { mn: 'Онцлох', tr: 'İmza' },
  new: { mn: 'Шинэ', tr: 'Yeni' },
  seasonal: { mn: 'Улирлын', tr: 'Mevsimlik' },
  sharing: { mn: 'Хуваалцах', tr: 'Paylaşımlık' }
};
