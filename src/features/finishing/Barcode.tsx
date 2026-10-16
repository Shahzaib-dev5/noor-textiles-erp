import { useEffect,useRef } from 'react';
import { drawBarcode } from '@/services/finished-goods/barcode';
export function Barcode({value}:{value:string}){const ref=useRef<SVGSVGElement>(null);useEffect(()=>{if(ref.current)drawBarcode(ref.current,value);},[value]);return <div className="max-w-full overflow-x-auto rounded bg-white p-2 text-black" dir="ltr"><svg ref={ref} role="img" aria-label={'Code 128 '+value} data-barcode-value={value}/><p className="text-center font-mono text-sm">{value}</p></div>;}
