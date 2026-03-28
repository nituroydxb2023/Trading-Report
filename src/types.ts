import { Timestamp } from 'firebase/firestore';

export type TradeType = 'Long' | 'Short';
export type TradeStatus = 'Open' | 'Closed';

export interface Trade {
  id?: string;
  symbol: string;
  type: TradeType;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  profit: number;
  percentage?: number;
  status: TradeStatus;
  timestamp: Timestamp;
  notes?: string;
}

export interface Profile {
  id?: string;
  name: string;
  totalProfit: number;
  winRate?: number;
  totalTrades?: number;
  avgProfit?: number;
  lastUpdated?: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
