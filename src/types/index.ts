import { Id } from "../../convex/_generated/dataModel";

export interface Product {
  _id: Id<"products">;
  _creationTime: number;
  code: string;
  name: string;
  categoryId?: Id<"categories">;
  isBestseller: boolean;
  imageUrls?: string[];
  imageStorageIds?: string[];
  subcategories?: string[];
}

export interface Category {
  _id: Id<"categories">;
  _creationTime: number;
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
  isBestseller: boolean;
  mainImage: string | null;
  variants: ProductVariant[];
}
