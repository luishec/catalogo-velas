export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          priority: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          priority?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          code: string;
          name: string;
          is_bestseller: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          code: string;
          name: string;
          is_bestseller?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          code?: string;
          name?: string;
          is_bestseller?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
