export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp?: number;
  image_url: string;
  category: string;
  created_at?: string;
  brand?: string;
  warranty?: string;
  dimensions?: string;
  weight?: string;
  specs_layout?: string;
  specs_content?: string;
  image_url_2?: string;
  image_url_3?: string;
  gallery_images?: string[];
  offers?: any;
  free_delivery?: boolean;
  delivery_charge?: number;
  delivery_slabs?: DeliverySlab[];
  return_policy?: string;
  allow_cod?: boolean;
  allow_online?: boolean;
}

export interface DeliverySlab {
  min_qty: number;
  max_qty?: number | null;
  charge: number;
}

export interface Banner {
  id: string;
  image_url: string;
  title?: string;
  link_url?: string;
  display_order?: number;
}

export interface CategoryGrid {
  id: string;
  title: string;
  link_text: string;
  items: { name: string; image: string; link?: string }[];
  display_order?: number;
}

export interface Carousel {
  id: string;
  title: string;
  product_ids: string[];
  display_order?: number;
  layout?: string;
  source_type?: string;
  source_value?: string;
}

export interface SidebarFilter {
  id: string;
  filterType: string;
  label: string;
  config?: Record<string, any> | null;
  isEnabled: boolean;
  display_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Setting {
  id: string;
  siteName: string;
  logoUrl?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
  googleSearchConsoleId?: string;
  googleAdsId?: string;
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  newsletterUnsubscribe?: string;
  newsletterPrivacyText?: string;
}

export const isPrismaConfigured = (): boolean => {
  if (typeof process === 'undefined') return false;
  const url = process.env.DATABASE_URL;
  return !!url && url !== 'postgresql://postgres:postgres@localhost:5432/postgres';
};

const normalizeDeliverySlab = (slab: any): DeliverySlab => ({
  min_qty: Number(slab.min_qty ?? slab.minQty ?? 0),
  max_qty:
    slab.max_qty === null || slab.max_qty === undefined || slab.max_qty === ''
      ? null
      : Number(slab.max_qty ?? slab.maxQty),
  charge: Number(slab.charge ?? 0),
});

const normalizeDeliverySlabs = (slabs: any): DeliverySlab[] => {
  if (!Array.isArray(slabs)) return [];
  return slabs
    .map(normalizeDeliverySlab)
    .filter(
      (slab) =>
        Number.isFinite(slab.min_qty) && slab.min_qty > 0 && Number.isFinite(slab.charge)
    );
};

export const getDeliveryChargeForQuantity = (
  product: {
    free_delivery?: boolean;
    delivery_charge?: number;
    delivery_slabs?: DeliverySlab[];
    freeDelivery?: boolean;
    deliveryCharge?: number;
    deliverySlabs?: DeliverySlab[];
  },
  quantity: number
): number => {
  if ((product.free_delivery ?? product.freeDelivery ?? true) === true) {
    return 0;
  }

  const slabs = normalizeDeliverySlabs(product.delivery_slabs ?? product.deliverySlabs);
  if (slabs.length > 0) {
    const orderedSlabs = [...slabs].sort((a, b) => a.min_qty - b.min_qty);
    const match = orderedSlabs.find((slab) => {
      if (quantity < slab.min_qty) return false;
      if (slab.max_qty === null || slab.max_qty === undefined) return true;
      return quantity <= slab.max_qty;
    });

    if (match) {
      return match.charge;
    }

    const applicable = [...orderedSlabs].filter((slab) => slab.min_qty <= quantity).pop();
    if (applicable) {
      return applicable.charge;
    }

    return Number(product.delivery_charge ?? product.deliveryCharge ?? 0);
  }

  return Number(product.delivery_charge ?? product.deliveryCharge ?? 0);
};
