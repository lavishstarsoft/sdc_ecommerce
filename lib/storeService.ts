export type {
  Banner,
  Carousel,
  CategoryGrid,
  DeliverySlab,
  Product,
  Setting,
  SidebarFilter,
} from './store-types';

export { getDeliveryChargeForQuantity, isPrismaConfigured } from './store-types';

import type { Banner, Carousel, CategoryGrid, Product, Setting, SidebarFilter } from './store-types';

export const getBanners = async (): Promise<Banner[]> => {
  const res = await fetch('/api/banners', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch banners');
  return res.json();
};

export const saveBanner = async (banner: Omit<Banner, 'id'> & { id?: string }): Promise<Banner> => {
  const res = await fetch('/api/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(banner),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save banner');
  }
  return res.json();
};

export const deleteBanner = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/banners?id=${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete banner');
  }
  return true;
};

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch('/api/products', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save product');
  }
  return res.json();
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/products?id=${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete product');
  }
  return true;
};

export const getCategoryGrids = async (): Promise<CategoryGrid[]> => {
  const res = await fetch('/api/category-grids', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch category grids');
  return res.json();
};

export const saveCategoryGrid = async (
  grid: Omit<CategoryGrid, 'id'> & { id?: string }
): Promise<CategoryGrid> => {
  const res = await fetch('/api/category-grids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grid),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save category grid');
  }
  return res.json();
};

export const deleteCategoryGrid = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/category-grids?id=${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete category grid');
  }
  return true;
};

export const getSidebarFilters = async (): Promise<SidebarFilter[]> => {
  const res = await fetch('/api/sidebar-filters?enabledOnly=true', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sidebar filters');
  return res.json();
};

export const saveSidebarFilter = async (
  filter: Omit<SidebarFilter, 'id'> & { id?: string }
): Promise<SidebarFilter> => {
  const res = await fetch('/api/sidebar-filters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save sidebar filter');
  }
  return res.json();
};

export const deleteSidebarFilter = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/sidebar-filters?id=${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete sidebar filter');
  }
  return true;
};

export const getCarousels = async (): Promise<Carousel[]> => {
  const res = await fetch('/api/carousels', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch carousels');
  return res.json();
};

export const saveCarousel = async (
  carousel: Omit<Carousel, 'id'> & { id?: string }
): Promise<Carousel> => {
  const res = await fetch('/api/carousels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carousel),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save carousel');
  }
  return res.json();
};

export const deleteCarousel = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/carousels?id=${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete carousel');
  }
  return true;
};

export const getSettings = async (): Promise<Setting> => {
  const res = await fetch('/api/settings', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const saveSettings = async (settings: Omit<Setting, 'id'>): Promise<Setting> => {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save settings');
  }
  return res.json();
};
