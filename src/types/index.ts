export interface Product {
  id: string;
  code: string;
  name: string;
  category_id: string;
  is_bestseller: boolean;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  image_url_5: string | null;
  image_url_6: string | null;
  image_url_7: string | null;
  subcategory: string | null;
  subcategory_2: string | null;
  subcategory_3: string | null;
  subcategory_4: string | null;
  subcategory_5: string | null;
  subcategory_6: string | null;
  subcategory_7: string | null;
}

export interface Category {
  id: string;
  name: string;
  priority: number;
}

export interface ProductVariant {
  product: Product;
  variantName: string;
  imageUrl: string | null;
}

export interface ProductGroup {
  mainName: string;
  code: string;
  is_bestseller: boolean;
  mainImage: string | null;
  variants: ProductVariant[];
}
