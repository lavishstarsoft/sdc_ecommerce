import { Metadata, ResolvingMetadata } from 'next';
import ProductDetailsClient from './ProductDetailsClient';
import { getProducts, isPrismaConfigured } from '@/lib/storeService.server';
import prisma from '@/lib/prisma';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  let product = null;
  
  try {
      if (isPrismaConfigured()) {
        product = await prisma.product.findUnique({
          where: { id }
        });
      }
      
      if (!product) {
        const products = await getProducts();
        product = products.find(p => p.id === id) || null;
      }
  } catch (error) {
    console.error("Failed to fetch product for metadata:", error);
  }

  if (!product) {
    return {
      title: 'Product Not Found - SDC Store',
    };
  }

  // Handle varying field names from DB vs memory
  const p = product as any;
  const title = p.title;
  const description = p.description || `Buy ${p.title} at SDC Store. Best prices and quality.`;
  const imageUrl = p.imageUrl || p.image_url || null;

  return {
    title: `${title} | SDC Store`,
    description,
    openGraph: {
      title,
      description,
      url: `/products/${id}`,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function Page() {
  return <ProductDetailsClient />;
}
