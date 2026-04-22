import type { RxDatabase, RxCollection } from 'rxdb';
import { createRxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

addRxPlugin(RxDBQueryBuilderPlugin);

export type UserDocType = {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'staff';
};

export type ProductDocType = {
  id: string;
  name: string;
  category: string;
};

export type SaleItemType = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
};


export type SaleDocType = {
  id: string;
  timestamp: string;
  customer_name: string;
  customer_phone: string;
  items: SaleItemType[];
  subtotal: number;
  tax: number;
  grand_total: number;
  payment_mode: 'Cash' | 'UPI';
  created_by: string;
};

const userSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    username: { type: 'string' },
    password_hash: { type: 'string' },
    role: { type: 'string' }
  },
  required: ['id', 'username', 'password_hash', 'role']
};

const productSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    category: { type: 'string' }
  },
  required: ['id', 'name', 'category']
};

const saleSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    timestamp: { type: 'string', format: 'date-time' },
    customer_name: { type: 'string' },
    customer_phone: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          quantity: { type: 'number' },
          total: { type: 'number' }
        }
      }
    },
    subtotal: { type: 'number' },
    tax: { type: 'number' },
    grand_total: { type: 'number' },
    payment_mode: { type: 'string' },
    created_by: { type: 'string' }
  },
  required: ['id', 'timestamp', 'customer_name', 'items', 'subtotal', 'tax', 'grand_total', 'payment_mode', 'created_by']
};

export type DatabaseCollections = {
  users: RxCollection<UserDocType>;
  products: RxCollection<ProductDocType>;
  sales: RxCollection<SaleDocType>;
};

export type ParthDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<ParthDatabase> | null = null;

export const getDatabase = (): Promise<ParthDatabase> => {
  if (!dbPromise) {
    dbPromise = createRxDatabase<DatabaseCollections>({
      name: 'parthdb',
      storage: getRxStorageDexie(),
    }).then(async (db) => {
      await db.addCollections({
        users: { schema: userSchema },
        products: { schema: productSchema },
        sales: { schema: saleSchema },
      });
      return db;
    });
  }
  return dbPromise;
};
