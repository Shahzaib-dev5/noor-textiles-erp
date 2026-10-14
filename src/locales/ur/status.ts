export const statusPresentation = {
  DRAFT: ['مسودہ', 'neutral'], PENDING: ['زیرِ انتظار', 'warning'], APPROVED: ['منظور شدہ', 'success'],
  POSTED: ['پوسٹ شدہ', 'success'], IN_PROGRESS: ['جاری', 'info'], PARTIALLY_RECEIVED: ['جزوی وصولی', 'warning'],
  COMPLETED: ['مکمل', 'success'], CANCELLED: ['منسوخ', 'neutral'], REVERSED: ['واپس کیا گیا', 'neutral'],
  REJECTED: ['مسترد', 'error'], PAID: ['ادا شدہ', 'success'], PARTIALLY_PAID: ['جزوی ادائیگی', 'warning'],
  OVERDUE: ['مقررہ تاریخ گزر چکی', 'error'], ACTIVE: ['فعال', 'success'], INACTIVE: ['غیر فعال', 'neutral'],
} as const;
export type DisplayStatus = keyof typeof statusPresentation;
