import { Area, AreaChart as ReAreaChart, Bar, BarChart as ReBarChart, CartesianGrid, Cell, Legend, Line, LineChart as ReLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { EmptyState, LoadingOverlay } from '@/components/feedback/states';
import { formatPKR, formatQuantity } from '@/lib/formatters';

export interface ChartDatum { label: string; value: number }
export interface ChartProps { title: string; description?: string; data: readonly ChartDatum[]; valueLabel?: string; money?: boolean; loading?: boolean; emptyMessage?: string }
const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
function StandardChart({ kind, title, description, data, valueLabel = 'مقدار', money, loading, emptyMessage }: ChartProps & { kind: 'line' | 'bar' | 'area' | 'donut' | 'progress' }) {
  const format = money ? formatPKR : formatQuantity;
  const horizontal = kind === 'progress';
  const grid = <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />;
  const axes = <><XAxis type={horizontal ? 'number' : 'category'} dataKey={horizontal ? undefined : 'label'} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={horizontal ? format : undefined} /><YAxis type={horizontal ? 'category' : 'number'} dataKey={horizontal ? 'label' : undefined} width={horizontal ? 110 : 75} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={horizontal ? undefined : format} /></>;
  const tooltip = <Tooltip formatter={(value) => [format(Number(value)), valueLabel]} contentStyle={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)', borderRadius: 10 }} />;
  const common = { data: [...data], margin: { top: 12, right: 14, left: 0, bottom: 8 } };
  const chart = kind === 'donut' ? <PieChart><Pie data={[...data]} dataKey="value" nameKey="label" cx="50%" cy="45%" innerRadius="48%" outerRadius="72%" paddingAngle={2} stroke="var(--card)" isAnimationActive={false}>{data.map((row, i) => <Cell key={row.label} fill={colors[i % colors.length]} />)}</Pie>{tooltip}<Legend verticalAlign="bottom" formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>} /></PieChart>
    : kind === 'line' ? <ReLineChart {...common}>{grid}{axes}{tooltip}<Line type="monotone" dataKey="value" name={valueLabel} stroke={colors[0]} strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} /></ReLineChart>
    : kind === 'area' ? <ReAreaChart {...common}>{grid}{axes}{tooltip}<Area type="monotone" dataKey="value" name={valueLabel} stroke={colors[1]} fill={colors[1]} fillOpacity={.15} isAnimationActive={false} /></ReAreaChart>
    : <ReBarChart {...common} layout={horizontal ? 'vertical' : 'horizontal'}>{grid}{axes}{tooltip}<Bar dataKey="value" name={valueLabel} fill={colors[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} /></ReBarChart>;
  return <Card className="min-w-0 p-5"><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="mb-3 text-sm leading-7 text-muted-foreground">{description}</p>}{loading ? <LoadingOverlay /> : !data.length || data.every((row) => row.value === 0) ? <EmptyState title={emptyMessage ?? 'ابھی قابلِ نمایش ڈیٹا نہیں'} description="متعلقہ ریکارڈ دستیاب ہونے پر یہ چارٹ اصل ڈیٹا دکھائے گا۔" /> : <div className="chart-container" role="img" aria-label={`${title}: ${data.map((row) => `${row.label} ${format(row.value)}`).join('، ')}`} dir="ltr"><ResponsiveContainer width="100%" height={250}>{chart}</ResponsiveContainer></div>}</Card>;
}
export function LineChart(props: ChartProps) { return <StandardChart {...props} kind="line" />; }
export function BarChart(props: ChartProps) { return <StandardChart {...props} kind="bar" />; }
export function AreaChart(props: ChartProps) { return <StandardChart {...props} kind="area" />; }
export function DonutChart(props: ChartProps) { return <StandardChart {...props} kind="donut" />; }
export function ProgressChart(props: ChartProps) { return <StandardChart {...props} kind="progress" />; }
