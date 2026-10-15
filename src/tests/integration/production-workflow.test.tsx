import { describe,it,expect } from 'vitest';
import { fireEvent,render,screen,waitFor,cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/router';
import { useERPStore,createERPStore } from '@/store';
import { productionFixture,orderFixture,productionContext } from '../fixtures/production';
import { executeProduction } from '@/services/transactions/production';
import { getInventorySummary } from '@/services/inventory';
import { useUIStore } from '@/store/ui-preferences';
import { encodeSnapshot,STORAGE_KEY } from '@/services/storage';
import '@/features/production/ProductionPage';

describe('Urdu production integration',()=>{
 it('creates a plan through the Urdu form without changing stock',async()=>{
  const f=productionFixture();useERPStore.setState({data:f.d,role:'owner'});
  const before=getInventorySummary(f.d);
  render(<MemoryRouter initialEntries={['/production/plans/new']}><AppRoutes/></MemoryRouter>);
  await screen.findByLabelText('منظور شدہ ڈیزائن');
  for(const [label,value] of [['منظور شدہ ڈیزائن',f.designId],['کلیکشن',f.collectionId],['رنگ',f.variantId],['منظور شدہ BOM نظرثانی',f.bomId]])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  fireEvent.click(screen.getByRole('button',{name:'ریکارڈ محفوظ کریں'}));
  await waitFor(()=>expect(Object.keys(useERPStore.getState().data.production?.plans??{})).toHaveLength(1));
  expect(getInventorySummary(useERPStore.getState().data)).toEqual(before);
  expect(document.documentElement).toHaveAttribute('dir','rtl');cleanup();
 },30000);
 it('persists one connected production snapshot while preserving UI preferences',()=>{
  const f=orderFixture(),encoded=encodeSnapshot(f.d);expect(encoded.ok).toBe(true);if(!encoded.ok)return;
  const memory=new Map([[STORAGE_KEY,encoded.value]]),storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};
  const store=createERPStore(storage);store.getState().setRole('owner');useUIStore.getState().updatePreferences({theme:'dark'});const preferences=structuredClone(useUIStore.getState().preferences);
  const result=store.getState().applyTransaction(d=>executeProduction(d,{kind:'reserveMaterial',orderId:f.orderId,bomLineKey:'line-0',lotId:f.source.lotId,locationId:f.source.locationId,quantityMeters:100,date:'2026-10-15',reason:'پیداواری مواد'},productionContext));
  expect(result.ok,result.message).toBe(true);const restored=createERPStore(storage);expect(restored.getState().data).toEqual(store.getState().data);expect(useUIStore.getState().preferences).toEqual(preferences);
  useUIStore.getState().updatePreferences({theme:'light'});
 });
});
