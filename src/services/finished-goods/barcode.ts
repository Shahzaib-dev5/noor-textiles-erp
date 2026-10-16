import JsBarcode from 'jsbarcode';
/** Offline Code128. Encoded identifiers are application SKUs/cartons, not registered GS1 keys. */
export function barcodeBits(value:string){if(!/^[A-Z0-9-]+$/.test(value))throw new Error('بارکوڈ کے لیے درست مستقل کوڈ ضروری ہے۔');const result:{encodings?:{data:string}[]}={};JsBarcode(result,value,{format:'CODE128',displayValue:false,margin:20});return result.encodings?.map(e=>e.data).join('')??'';}
export function drawBarcode(svg:SVGSVGElement,value:string){JsBarcode(svg,value,{format:'CODE128',width:value.length>28?1:2,height:60,margin:24,displayValue:false,font:'monospace',fontSize:14,lineColor:'#000000',background:'#ffffff'});}
