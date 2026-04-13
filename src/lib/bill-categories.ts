// Single source of truth for bill expense categories
export const BILL_CATEGORIES = [
  { id: 'an_uong', emoji: '🍽️', label: 'Ăn uống', keywords: ['an', 'com', 'bun', 'pho', 'lau', 'bbq', 'cafe', 'tra sua', 'bia', 'nhau', 'nuoc'] },
  { id: 'di_lai', emoji: '🚗', label: 'Đi lại', keywords: ['xe', 'taxi', 'grab', 'xang', 'may bay', 've'] },
  { id: 'luu_tru', emoji: '🏠', label: 'Lưu trú', keywords: ['khach san', 'homestay', 'airbnb', 'phong', 'nha nghi'] },
  { id: 'mua_sam', emoji: '🛒', label: 'Mua sắm', keywords: ['mua', 'do', 'quan ao', 'sieu thi', 'cho'] },
  { id: 'giai_tri', emoji: '🎮', label: 'Giải trí', keywords: ['karaoke', 'game', 'phim', 'rap', 'bar'] },
  { id: 'khac', emoji: '📋', label: 'Khác', keywords: [] },
] as const;

export type BillCategoryId = typeof BILL_CATEGORIES[number]['id'];

/** Infer category from description keywords. Returns 'khac' if no match. */
export function inferCategory(description: string): BillCategoryId {
  const lower = description.toLowerCase();
  for (const cat of BILL_CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) return cat.id;
  }
  return 'khac';
}

export function getCategoryById(id: string) {
  return BILL_CATEGORIES.find(c => c.id === id) ?? BILL_CATEGORIES[BILL_CATEGORIES.length - 1];
}
