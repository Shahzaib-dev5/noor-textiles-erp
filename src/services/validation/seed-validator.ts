import { validateDomainState } from '@/domain/validators/state';
import { selectReconciliationReport } from '@/store/selectors/business';
/** Returns evidence; does not fix, reseed, or write an invalid input. */
export function validateSeed(input: unknown) {
  const result = validateDomainState(input);
  if (!result.ok) return { ok: false as const, issues: [{ code: result.error.code, recordId: 'snapshot', message: result.error.message }] };
  const data = result.state;
  const counts = Object.fromEntries(Object.entries(data).filter(([key]) => !['history','procurement'].includes(key)).map(([key, records]) => [key, Object.keys(records).length]));
  if (data.history) for (const [key, records] of Object.entries(data.history)) if (typeof records === 'object') counts['history.' + key] = Object.keys(records).length;
  if (data.procurement) for (const [key,records] of Object.entries(data.procurement)) if(typeof records==='object') counts['procurement.'+key]=Object.keys(records).length;
  return { ok: true as const, issues: [], counts, reconciliation: selectReconciliationReport(data) };
}
