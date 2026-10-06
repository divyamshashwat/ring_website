import type { Configuration } from '@/lib/data/types';

/**
 * Order, consultation and enquiry persistence.
 *
 * The in-memory store keeps the flows working end-to-end in development.
 * Production replaces `store` with a database adapter (orders, customers,
 * consultation_requests, certificates) — the API routes do not change.
 */
export interface OrderLine {
  productSlug?: string;
  configuration: Configuration;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: 'received' | 'stone-selected' | 'in-workshop' | 'certified' | 'dispatched' | 'delivered';
  email: string;
  name: string;
  lines: OrderLine[];
  total: number;
  shipping: { address: string; city: string; postcode: string; country: string };
}

export interface ConsultationRequest {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  mode: 'video' | 'boutique' | 'phone';
  message?: string;
  birthDetails?: string;
}

interface Store {
  orders: Map<string, Order>;
  consultations: Map<string, ConsultationRequest>;
  enquiries: { id: string; name: string; email: string; message: string; createdAt: string }[];
}

const globalStore = globalThis as unknown as { __vyomaStore?: Store };
const store: Store = (globalStore.__vyomaStore ??= { orders: new Map(), consultations: new Map(), enquiries: [] });

const id = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export async function createOrder(input: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
  const order: Order = { ...input, id: id('VY'), createdAt: new Date().toISOString(), status: 'received' };
  store.orders.set(order.id, order);
  return order;
}

export async function getOrder(orderId: string, email: string): Promise<Order | null> {
  const order = store.orders.get(orderId.toUpperCase());
  return order && order.email.toLowerCase() === email.toLowerCase() ? order : null;
}

export async function createConsultation(input: Omit<ConsultationRequest, 'id' | 'createdAt'>) {
  const request: ConsultationRequest = { ...input, id: id('CN'), createdAt: new Date().toISOString() };
  store.consultations.set(request.id, request);
  return request;
}

export async function createEnquiry(input: { name: string; email: string; message: string }) {
  const enquiry = { ...input, id: id('EN'), createdAt: new Date().toISOString() };
  store.enquiries.push(enquiry);
  return enquiry;
}
