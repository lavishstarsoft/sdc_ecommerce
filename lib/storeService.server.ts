import 'server-only';

import prisma from './prisma';
import {
  type Banner,
  type Carousel,
  type CategoryGrid,
  type DeliverySlab,
  type Product,
  type Setting,
  type SidebarFilter,
  isPrismaConfigured,
} from './store-types';

export type { Banner, Carousel, CategoryGrid, DeliverySlab, Product, Setting, SidebarFilter };
export { isPrismaConfigured };

// Mappers to convert Prisma camelCase back to snake_case expected by UI
const mapBanner = (b: any): Banner => ({
  id: b.id,
  image_url: b.imageUrl,
  title: b.title || undefined,
  link_url: b.linkUrl || undefined,
  display_order: b.displayOrder,
});

const mapProduct = (p: any): Product => ({
  id: p.id,
  title: p.title,
  description: p.description || undefined,
  price: p.price,
  mrp: p.mrp || undefined,
  image_url: p.imageUrl,
  category: p.category,
  brand: p.brand || undefined,
  warranty: p.warranty || undefined,
  dimensions: p.dimensions || undefined,
  weight: p.weight || undefined,
  specs_layout: p.specsLayout || undefined,
  specs_content: p.specsContent || undefined,
  image_url_2: p.imageUrl2 || undefined,
  image_url_3: p.imageUrl3 || undefined,
  gallery_images: p.galleryImages || [],
  offers: p.offers || undefined,
  free_delivery: p.freeDelivery ?? true,
  delivery_charge: p.deliveryCharge ?? 0,
  delivery_slabs: p.deliverySlabs || p.delivery_slabs || [],
  return_policy: p.returnPolicy || undefined,
  allow_cod: p.allowCOD ?? true,
  allow_online: p.allowOnline ?? true,
});

const mapCategoryGrid = (g: any): CategoryGrid => ({
  id: g.id,
  title: g.title,
  link_text: g.linkText,
  items: typeof g.items === 'string' ? JSON.parse(g.items) : (g.items as any),
  display_order: g.displayOrder,
});

const mapCarousel = (c: any): Carousel => ({
  id: c.id,
  title: c.title,
  product_ids: c.productIds || [],
  display_order: c.displayOrder,
  layout: c.layout || "CAROUSEL",
  source_type: c.sourceType || "MANUAL",
  source_value: c.sourceValue || undefined,
});


// Default Banners
const DEFAULT_BANNERS: Banner[] = [];

// Default Category Grids
const DEFAULT_CATEGORY_GRIDS: CategoryGrid[] = [];

// Default Products
const DEFAULT_PRODUCTS: Product[] = [];

// Default Carousels
const DEFAULT_CAROUSELS: Carousel[] = [];

// Local Storage helpers (Safe for Next.js SSR)
const getLocal = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
};

const setLocal = <T>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* ==========================================================================
   BANNERS SERVICE
   ========================================================================== */

export const getBanners = async (): Promise<Banner[]> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch banners');
    return res.json();
  }
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.banner.findMany({
        orderBy: { displayOrder: 'asc' }
      });
      return data.map(mapBanner);
    } catch (e) {
      console.warn('Prisma banner fetch error, falling back:', e);
    }
  }
  return getLocal<Banner[]>('sdc_banners', DEFAULT_BANNERS);
};

export const saveBanner = async (banner: Omit<Banner, 'id'> & { id?: string }): Promise<Banner> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save banner');
    }
    return res.json();
  }
  const isNew = !banner.id;
  const id = banner.id || 'b_' + Math.random().toString(36).substr(2, 9);
  const finalBanner = { ...banner, id };

  if (isPrismaConfigured()) {
    try {
      const payload = {
        imageUrl: banner.image_url,
        title: banner.title || '',
        linkUrl: banner.link_url || '',
        displayOrder: banner.display_order || 0
      };
      let result;
      if (isNew) {
        result = await prisma.banner.create({ data: payload });
      } else {
        result = await prisma.banner.update({
          where: { id: banner.id },
          data: payload
        });
      }
      return mapBanner(result);
    } catch (e) {
      console.warn('Prisma banner save error, falling back:', e);
    }
  }

  const list = getLocal<Banner[]>('sdc_banners', DEFAULT_BANNERS);
  const idx = list.findIndex(b => b.id === id);
  if (idx > -1) {
    list[idx] = finalBanner;
  } else {
    list.push(finalBanner);
  }
  setLocal('sdc_banners', list);
  return finalBanner;
};

export const deleteBanner = async (id: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/banners?id=${id}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete banner');
    }
    return true;
  }
  if (isPrismaConfigured()) {
    try {
      await prisma.banner.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma banner delete error, falling back:', e);
    }
  }

  const list = getLocal<Banner[]>('sdc_banners', DEFAULT_BANNERS);
  const filtered = list.filter(b => b.id !== id);
  setLocal('sdc_banners', filtered);
  return true;
};

/* ==========================================================================
   PRODUCTS SERVICE
   ========================================================================== */

export const getProducts = async (): Promise<Product[]> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  }
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return data.map(mapProduct);
    } catch (e) {
      console.warn('Prisma products fetch error, falling back:', e);
    }
  }
  return getLocal<Product[]>('sdc_products', DEFAULT_PRODUCTS);
};

export const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save product');
    }
    return res.json();
  }
  const isNew = !product.id;
  const id = product.id || 'p_' + Math.random().toString(36).substr(2, 9);
    const finalProduct: Product = {
    ...product,
    id,
    mrp: product.mrp || undefined,
    brand: product.brand || 'Saidurga Premium',
    warranty: product.warranty || '1 Year SDC Store warranty card',
    dimensions: product.dimensions || '45 x 30 x 12 cm',
    weight: product.weight || '1.8 Kilograms',
    specs_layout: product.specs_layout || 'TABLE',
    specs_content: product.specs_content || '',
    image_url_2: product.image_url_2 || '',
    image_url_3: product.image_url_3 || '',
    gallery_images: product.gallery_images || [],
    offers: product.offers || null,
    free_delivery: product.free_delivery ?? true,
    delivery_charge: product.delivery_charge ?? 0,
    delivery_slabs: product.delivery_slabs || [],
    return_policy: product.return_policy || '',
    allow_cod: product.allow_cod ?? true,
    allow_online: product.allow_online ?? true,
  };

  if (isPrismaConfigured()) {
    try {
      const payload = {
        title: product.title,
        description: product.description || '',
        price: product.price,
        mrp: product.mrp || null,
        imageUrl: product.image_url,
        category: product.category,
        brand: product.brand || 'Saidurga Premium',
        warranty: product.warranty || '1 Year SDC Store warranty card',
        dimensions: product.dimensions || '45 x 30 x 12 cm',
        weight: product.weight || '1.8 Kilograms',
        specsLayout: product.specs_layout || 'TABLE',
        specsContent: product.specs_content || '',
        imageUrl2: product.image_url_2 || '',
        imageUrl3: product.image_url_3 || '',
        galleryImages: product.gallery_images || [],
        offers: product.offers || null,
        freeDelivery: product.free_delivery ?? true,
        deliveryCharge: product.delivery_charge ?? 0,
        deliverySlabs: product.delivery_slabs || [],
        returnPolicy: product.return_policy || null,
        allowCOD: product.allow_cod ?? true,
        allowOnline: product.allow_online ?? true,
      };
      let result;
      if (isNew) {
        result = await prisma.product.create({ data: payload as any });
      } else {
        result = await prisma.product.update({
          where: { id: product.id },
          data: payload as any
        });
      }
      return mapProduct(result);
    } catch (e) {
      console.warn('Prisma product save error, falling back:', e);
    }
  }

  const list = getLocal<Product[]>('sdc_products', DEFAULT_PRODUCTS);
  const idx = list.findIndex(p => p.id === id);
  if (idx > -1) {
    list[idx] = finalProduct;
  } else {
    list.push(finalProduct);
  }
  setLocal('sdc_products', list);
  return finalProduct;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/products?id=${id}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete product');
    }
    return true;
  }
  if (isPrismaConfigured()) {
    try {
      await prisma.product.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma product delete error, falling back:', e);
    }
  }

  const list = getLocal<Product[]>('sdc_products', DEFAULT_PRODUCTS);
  const filtered = list.filter(p => p.id !== id);
  setLocal('sdc_products', filtered);
  return true;
};

/* ==========================================================================
   CATEGORY GRIDS SERVICE
   ========================================================================== */

export const getCategoryGrids = async (): Promise<CategoryGrid[]> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/category-grids', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch category grids');
    return res.json();
  }
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.categoryGrid.findMany({
        orderBy: { displayOrder: 'asc' }
      });
      return data.map(mapCategoryGrid);
    } catch (e) {
      console.warn('Prisma category grids fetch error, falling back:', e);
    }
  }
  return getLocal<CategoryGrid[]>('sdc_grids', DEFAULT_CATEGORY_GRIDS);
};

export const saveCategoryGrid = async (grid: Omit<CategoryGrid, 'id'> & { id?: string }): Promise<CategoryGrid> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/category-grids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grid),
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save category grid');
    }
    return res.json();
  }
  const isNew = !grid.id;
  const id = grid.id || 'cg_' + Math.random().toString(36).substr(2, 9);
  const finalGrid = { ...grid, id };

  if (isPrismaConfigured()) {
    try {
      const payload = {
        title: grid.title,
        linkText: grid.link_text,
        items: grid.items as any, // Json type is compatible with any serializable object
        displayOrder: grid.display_order || 0
      };
      let result;
      if (isNew) {
        result = await prisma.categoryGrid.create({ data: payload });
      } else {
        result = await prisma.categoryGrid.update({
          where: { id: grid.id },
          data: payload
        });
      }
      return mapCategoryGrid(result);
    } catch (e) {
      console.warn('Prisma category grid save error, falling back:', e);
    }
  }

  const list = getLocal<CategoryGrid[]>('sdc_grids', DEFAULT_CATEGORY_GRIDS);
  const idx = list.findIndex(g => g.id === id);
  if (idx > -1) {
    list[idx] = finalGrid;
  } else {
    list.push(finalGrid);
  }
  setLocal('sdc_grids', list);
  return finalGrid;
};

export const deleteCategoryGrid = async (id: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/category-grids?id=${id}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete category grid');
    }
    return true;
  }
  if (isPrismaConfigured()) {
    try {
      await prisma.categoryGrid.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma grid delete error, falling back:', e);
    }
  }

  const list = getLocal<CategoryGrid[]>('sdc_grids', DEFAULT_CATEGORY_GRIDS);
  const filtered = list.filter(g => g.id !== id);
  setLocal('sdc_grids', filtered);
  return true;
};

/* ==========================================================================
   SIDEBAR FILTERS SERVICE
   ========================================================================== */

export const getSidebarFilters = async (): Promise<SidebarFilter[]> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/sidebar-filters?enabledOnly=true', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch sidebar filters');
    return res.json();
  }
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.sidebarFilter.findMany({
        where: { isEnabled: true },
        orderBy: { displayOrder: 'asc' }
      });
      return data.map((f: any) => ({
        id: f.id,
        filterType: f.filterType,
        label: f.label,
        config: f.config ?? undefined,
        isEnabled: f.isEnabled,
        display_order: f.displayOrder,
        createdAt: f.createdAt?.toISOString?.(),
        updatedAt: f.updatedAt?.toISOString?.()
      }));
    } catch (e) {
      console.warn('Prisma sidebar filters fetch error, falling back:', e);
    }
  }
  return getLocal<SidebarFilter[]>('sdc_sidebar_filters', []);
};

export const saveSidebarFilter = async (filter: Omit<SidebarFilter, 'id'> & { id?: string }): Promise<SidebarFilter> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/sidebar-filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter),
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save sidebar filter');
    }
    return res.json();
  }
  const isNew = !filter.id;
  const id = filter.id || 'sf_' + Math.random().toString(36).substr(2, 9);
  const finalFilter: SidebarFilter = {
    ...filter,
    id,
    config: filter.config ?? null,
    isEnabled: filter.isEnabled ?? true
  };

  if (isPrismaConfigured()) {
    try {
      const payload = {
        filterType: filter.filterType,
        label: filter.label,
        config: (filter.config ?? null) as any,
        isEnabled: filter.isEnabled ?? true,
        displayOrder: filter.display_order ?? 0
      };
      let result;
      if (isNew) {
        result = await prisma.sidebarFilter.create({ data: payload });
      } else {
        result = await prisma.sidebarFilter.update({
          where: { id: filter.id },
          data: payload
        });
      }
      return {
        id: result.id,
        filterType: result.filterType,
        label: result.label,
        config: result.config ? (typeof result.config === 'object' ? result.config as Record<string, any> : undefined) : undefined,
        isEnabled: result.isEnabled,
        display_order: result.displayOrder,
        createdAt: result.createdAt?.toISOString?.(),
        updatedAt: result.updatedAt?.toISOString?.()
      };
    } catch (e) {
      console.warn('Prisma sidebar filter save error, falling back:', e);
    }
  }

  const list = getLocal<SidebarFilter[]>('sdc_sidebar_filters', []);
  const idx = list.findIndex(f => f.id === id);
  if (idx > -1) {
    list[idx] = finalFilter as SidebarFilter;
  } else {
    list.push(finalFilter as SidebarFilter);
  }
  setLocal('sdc_sidebar_filters', list);
  return finalFilter as SidebarFilter;
};

export const deleteSidebarFilter = async (id: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/sidebar-filters?id=${id}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete sidebar filter');
    }
    return true;
  }
  if (isPrismaConfigured()) {
    try {
      await prisma.sidebarFilter.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma sidebar filter delete error, falling back:', e);
    }
  }

  const list = getLocal<SidebarFilter[]>('sdc_sidebar_filters', []);
  const filtered = list.filter(f => f.id !== id);
  setLocal('sdc_sidebar_filters', filtered);
  return true;
};

/* ==========================================================================
   CAROUSELS SERVICE
   ========================================================================== */

export const getCarousels = async (): Promise<Carousel[]> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/carousels', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch carousels');
    return res.json();
  }
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.carousel.findMany({
        orderBy: { displayOrder: 'asc' }
      });
      return data.map(mapCarousel);
    } catch (e) {
      console.warn('Prisma carousels fetch error, falling back:', e);
    }
  }
  return getLocal<Carousel[]>('sdc_carousels', DEFAULT_CAROUSELS);
};

export const saveCarousel = async (carousel: Omit<Carousel, 'id'> & { id?: string }): Promise<Carousel> => {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/carousels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carousel),
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save carousel');
    }
    return res.json();
  }
  const isNew = !carousel.id;
  const id = carousel.id || 'c_' + Math.random().toString(36).substr(2, 9);
  const finalCarousel = { ...carousel, id };

  if (isPrismaConfigured()) {
    try {
      const payload = {
        title: carousel.title,
        productIds: carousel.product_ids || [],
        displayOrder: carousel.display_order || 0,
        layout: carousel.layout || "CAROUSEL",
        sourceType: carousel.source_type || "MANUAL",
        sourceValue: carousel.source_value || ""
      };
      let result;
      if (isNew) {
        result = await prisma.carousel.create({ data: payload });
      } else {
        result = await prisma.carousel.update({
          where: { id: carousel.id },
          data: payload
        });
      }
      return mapCarousel(result);
    } catch (e) {
      console.warn('Prisma carousel save error, falling back:', e);
    }
  }

  const list = getLocal<Carousel[]>('sdc_carousels', DEFAULT_CAROUSELS);
  const idx = list.findIndex(c => c.id === id);
  if (idx > -1) {
    list[idx] = finalCarousel;
  } else {
    list.push(finalCarousel);
  }
  setLocal('sdc_carousels', list);
  return finalCarousel;
};

export const deleteCarousel = async (id: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/carousels?id=${id}`, {
      method: 'DELETE',
      cache: 'no-store'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete carousel');
    }
    return true;
  }
  if (isPrismaConfigured()) {
    try {
      await prisma.carousel.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('Prisma carousel delete error, falling back:', e);
    }
  }

  const list = getLocal<Carousel[]>('sdc_carousels', DEFAULT_CAROUSELS);
  const filtered = list.filter(c => c.id !== id);
  setLocal('sdc_carousels', filtered);
  return true;
};

/* ==========================================================================
   SETTINGS SERVICE
   ========================================================================== */

const DEFAULT_SETTINGS: Setting = {
  id: 'default',
  siteName: 'Saidurga Computers',
  logoUrl: '',
  metaDescription: 'Your trusted partner for all computer sales, services, and accessories. Providing premium tech solutions with dedicated support for over a decade.',
  googleAnalyticsId: '',
  googleSearchConsoleId: '',
  googleAdsId: '',
  newsletterTitle: 'Subscribe to our newsletter to get updates to our latest collections',
  newsletterSubtitle: 'Get 20% off on your first order just by subscribing to our newsletter',
  newsletterPlaceholder: 'Enter your email',
  newsletterButtonText: 'Subscribe',
  newsletterUnsubscribe: 'You will be able to unsubscribe at any time.',
  newsletterPrivacyText: 'Read our privacy policy here'
};

export const getSettings = async (): Promise<Setting> => {
  if (isPrismaConfigured()) {
    try {
      const data = await prisma.setting.findUnique({
        where: { id: 'default' }
      });
      if (data) {
        return {
          id: data.id,
          siteName: data.siteName,
          logoUrl: data.logoUrl || undefined,
          metaDescription: data.metaDescription || undefined,
          googleAnalyticsId: data.googleAnalyticsId || undefined,
          googleSearchConsoleId: data.googleSearchConsoleId || undefined,
          googleAdsId: data.googleAdsId || undefined,
          newsletterTitle: data.newsletterTitle || undefined,
          newsletterSubtitle: data.newsletterSubtitle || undefined,
          newsletterPlaceholder: data.newsletterPlaceholder || undefined,
          newsletterButtonText: data.newsletterButtonText || undefined,
          newsletterUnsubscribe: data.newsletterUnsubscribe || undefined,
          newsletterPrivacyText: data.newsletterPrivacyText || undefined
        };
      }
      // Seed default settings row if it doesn't exist
      const seeded = await prisma.setting.create({
        data: {
          id: 'default',
          siteName: 'Saidurga Computers',
          logoUrl: '',
          metaDescription: 'Your trusted partner for all computer sales, services, and accessories. Providing premium tech solutions with dedicated support for over a decade.',
          googleAnalyticsId: '',
          googleSearchConsoleId: '',
          googleAdsId: '',
          newsletterTitle: 'Subscribe to our newsletter to get updates to our latest collections',
          newsletterSubtitle: 'Get 20% off on your first order just by subscribing to our newsletter',
          newsletterPlaceholder: 'Enter your email',
          newsletterButtonText: 'Subscribe',
          newsletterUnsubscribe: 'You will be able to unsubscribe at any time.',
          newsletterPrivacyText: 'Read our privacy policy here'
        }
      });
      return {
        id: seeded.id,
        siteName: seeded.siteName,
        logoUrl: seeded.logoUrl || undefined,
        metaDescription: seeded.metaDescription || undefined,
        googleAnalyticsId: seeded.googleAnalyticsId || undefined,
        googleSearchConsoleId: seeded.googleSearchConsoleId || undefined,
        googleAdsId: seeded.googleAdsId || undefined,
        newsletterTitle: seeded.newsletterTitle || undefined,
        newsletterSubtitle: seeded.newsletterSubtitle || undefined,
        newsletterPlaceholder: seeded.newsletterPlaceholder || undefined,
        newsletterButtonText: seeded.newsletterButtonText || undefined,
        newsletterUnsubscribe: seeded.newsletterUnsubscribe || undefined,
        newsletterPrivacyText: seeded.newsletterPrivacyText || undefined
      };
    } catch (e) {
      console.warn('Prisma settings fetch error, falling back:', e);
    }
  }
  return getLocal<Setting>('sdc_settings', DEFAULT_SETTINGS);
};

export const saveSettings = async (settings: Omit<Setting, 'id'>): Promise<Setting> => {
  const finalSettings: Setting = {
    id: 'default',
    siteName: settings.siteName,
    logoUrl: settings.logoUrl || '',
    metaDescription: settings.metaDescription || '',
    googleAnalyticsId: settings.googleAnalyticsId || '',
    googleSearchConsoleId: settings.googleSearchConsoleId || '',
    googleAdsId: settings.googleAdsId || '',
    newsletterTitle: settings.newsletterTitle || '',
    newsletterSubtitle: settings.newsletterSubtitle || '',
    newsletterPlaceholder: settings.newsletterPlaceholder || '',
    newsletterButtonText: settings.newsletterButtonText || '',
    newsletterUnsubscribe: settings.newsletterUnsubscribe || '',
    newsletterPrivacyText: settings.newsletterPrivacyText || ''
  };

  if (isPrismaConfigured()) {
    try {
      const result = await prisma.setting.upsert({
        where: { id: 'default' },
        update: {
          siteName: settings.siteName,
          logoUrl: settings.logoUrl || '',
          metaDescription: settings.metaDescription || '',
          googleAnalyticsId: settings.googleAnalyticsId || '',
          googleSearchConsoleId: settings.googleSearchConsoleId || '',
          googleAdsId: settings.googleAdsId || '',
          newsletterTitle: settings.newsletterTitle || '',
          newsletterSubtitle: settings.newsletterSubtitle || '',
          newsletterPlaceholder: settings.newsletterPlaceholder || '',
          newsletterButtonText: settings.newsletterButtonText || '',
          newsletterUnsubscribe: settings.newsletterUnsubscribe || '',
          newsletterPrivacyText: settings.newsletterPrivacyText || ''
        },
        create: {
          id: 'default',
          siteName: settings.siteName,
          logoUrl: settings.logoUrl || '',
          metaDescription: settings.metaDescription || '',
          googleAnalyticsId: settings.googleAnalyticsId || '',
          googleSearchConsoleId: settings.googleSearchConsoleId || '',
          googleAdsId: settings.googleAdsId || '',
          newsletterTitle: settings.newsletterTitle || '',
          newsletterSubtitle: settings.newsletterSubtitle || '',
          newsletterPlaceholder: settings.newsletterPlaceholder || '',
          newsletterButtonText: settings.newsletterButtonText || '',
          newsletterUnsubscribe: settings.newsletterUnsubscribe || '',
          newsletterPrivacyText: settings.newsletterPrivacyText || ''
        }
      });
      return {
        id: result.id,
        siteName: result.siteName,
        logoUrl: result.logoUrl || undefined,
        metaDescription: result.metaDescription || undefined,
        googleAnalyticsId: result.googleAnalyticsId || undefined,
        googleSearchConsoleId: result.googleSearchConsoleId || undefined,
        googleAdsId: result.googleAdsId || undefined,
        newsletterTitle: result.newsletterTitle || undefined,
        newsletterSubtitle: result.newsletterSubtitle || undefined,
        newsletterPlaceholder: result.newsletterPlaceholder || undefined,
        newsletterButtonText: result.newsletterButtonText || undefined,
        newsletterUnsubscribe: result.newsletterUnsubscribe || undefined,
        newsletterPrivacyText: result.newsletterPrivacyText || undefined
      };
    } catch (e) {
      console.warn('Prisma settings save error, falling back:', e);
    }
  }

  setLocal('sdc_settings', finalSettings);
  return finalSettings;
};
