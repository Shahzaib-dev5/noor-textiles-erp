export const statusPresentation = {
  DRAFT: ['مسودہ', 'neutral'], PENDING: ['زیرِ انتظار', 'warning'], APPROVED: ['منظور شدہ', 'success'],
  POSTED: ['پوسٹ شدہ', 'success'], IN_PROGRESS: ['جاری', 'info'], PARTIALLY_RECEIVED: ['جزوی وصولی', 'warning'],
  COMPLETED: ['مکمل', 'success'], CANCELLED: ['منسوخ', 'neutral'], REVERSED: ['واپس کیا گیا', 'neutral'],
  REJECTED: ['مسترد', 'error'], PAID: ['ادا شدہ', 'success'], PARTIALLY_PAID: ['جزوی ادائیگی', 'warning'],
  OVERDUE: ['مقررہ تاریخ گزر چکی', 'error'], ACTIVE: ['فعال', 'success'], INACTIVE: ['غیر فعال', 'neutral'],
  PLANNED: ['منصوبہ بند', 'neutral'], CUTTING: ['کٹنگ', 'info'], PACKING: ['پیکنگ', 'info'],
  CONFIRMED: ['تصدیق شدہ', 'success'], PARTIALLY_DISPATCHED: ['جزوی ڈسپیچ', 'warning'], UNPAID: ['غیر ادا شدہ', 'warning'],
  SUBMITTED: ['جمع شدہ', 'info'], CONVERTED: ['آرڈر میں تبدیل', 'success'], CLOSED: ['بند', 'neutral'],
  ACCEPTED: ['منظور شدہ', 'success'], QUARANTINED: ['قرنطینہ', 'warning'], RETURNED_TO_SUPPLIER: ['سپلائر کو واپس', 'neutral'],
  INSPECTION_HOLD:['معائنہ ہولڈ','warning'],DAMAGED:['خراب','error'],LEGACY:['تاریخی / غیر مختص','neutral'],MIXED:['مختلف حصے','info'],REVIEWED:['جانچ شدہ','info'],PARTIALLY_CONSUMED:['جزوی استعمال','warning'],CONSUMED:['استعمال شدہ','success'],RELEASED:['رہا شدہ','neutral'],
  EMPTY:['خالی / ختم','neutral'],
} as const;
export type DisplayStatus = keyof typeof statusPresentation;
