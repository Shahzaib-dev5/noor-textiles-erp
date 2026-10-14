import type { DomainState } from '@/domain/entities';
import { warehouseSummary } from '@/services/inventory/warehouse';
export function selectWarehouseAlerts(data:DomainState,asOf:string){
 if(!data.warehouse)return[];
 const rows:{id:string;title:string;description:string;path:string;tone:'warning'|'info'}[]=[];
 const add=(id:string,title:string,description:string,path:string)=>rows.push({id:'warehouse:'+id,title,description,path,tone:'warning'});
 for(const f of warehouseSummary(data).low)add(f.id,'گودام: دوبارہ خریداری کا جائزہ',f.name+' · دستیاب '+f.available+' / حد '+f.threshold+' میٹر','/fabrics/'+encodeURIComponent(f.id));
 for(const p of Object.values(data.warehouse.reservationProfiles))if(data.reservations[p.reservationId].status==='ACTIVE'&&p.expiresOn&&p.expiresOn<asOf)add(p.id,'رزرو کی مدت مکمل',p.number+' · دستی رہائی کا جائزہ','/inventory/reservations/'+encodeURIComponent(p.id));
 for(const s of Object.values(data.warehouse.stocktakes))if(['SUBMITTED','REVIEWED','APPROVED'].includes(s.status))add(s.id,'جسمانی گنتی کی جانچ / پوسٹنگ باقی',s.number,'/inventory/stocktakes/'+encodeURIComponent(s.id));
 return rows;
}
