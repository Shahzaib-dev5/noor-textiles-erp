import type { CompanyID, EntityID, EntityMeta } from '@/types/common';

export interface Company extends EntityMeta<'ACTIVE'> { name: string; city: string; address: string; currency: 'PKR'; locale: 'ur-PK' }
export interface Warehouse extends EntityMeta<'ACTIVE' | 'INACTIVE'> { companyId: CompanyID; name: string }
export interface WarehouseLocation extends EntityMeta<'ACTIVE' | 'INACTIVE'> { warehouseId: EntityID; name: string; code: string }
export interface Department extends EntityMeta<'ACTIVE' | 'INACTIVE'> { companyId: CompanyID; name: string }
export interface Employee extends EntityMeta<'ACTIVE' | 'INACTIVE'> { companyId: CompanyID; name: string; roleId: EntityID; departmentId?: EntityID }
export interface DemoPermission extends EntityMeta<'ACTIVE' | 'INACTIVE'> { key: string; label: string }
export interface DemoRole extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; permissionKeys: string[] }
export interface ActivityLog extends EntityMeta<'ACTIVE'> { actorId: EntityID; action: string; documentId: EntityID; detail: string }
