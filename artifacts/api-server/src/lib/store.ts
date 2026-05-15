export interface StoredImage {
  id: string;
  sourceUrl: string | null;
  status: string;
  contentType: string | null;
  multiSize: boolean;
  width: number | null;
  height: number | null;
  added: Date;
  processed: Date | null;
}

export interface InsertImageData {
  id: string;
  sourceUrl?: string | null;
  status: string;
  contentType?: string | null;
  multiSize: boolean;
  width?: number | null;
  height?: number | null;
  processed?: Date | null;
}

export interface StatRow {
  status: string;
  count: number;
}

const mem: StoredImage[] = [];

export const store = {
  listImages(): StoredImage[] {
    return [...mem].sort((a, b) => +a.added - +b.added);
  },

  getStats(): StatRow[] {
    const counts: Record<string, number> = {};
    for (const img of mem) counts[img.status] = (counts[img.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  insertImage(data: InsertImageData): void {
    mem.push({
      id: data.id,
      sourceUrl: data.sourceUrl ?? null,
      status: data.status,
      contentType: data.contentType ?? null,
      multiSize: data.multiSize,
      width: data.width ?? null,
      height: data.height ?? null,
      added: new Date(),
      processed: data.processed ?? null,
    });
  },

  upsertImage(data: InsertImageData): void {
    if (mem.some(img => img.id === data.id)) return;
    store.insertImage(data);
  },

  deleteImage(id: string): void {
    const idx = mem.findIndex(img => img.id === id);
    if (idx >= 0) mem.splice(idx, 1);
  },

  updateImage(id: string, data: Partial<StoredImage>): void {
    const img = mem.find(img => img.id === id);
    if (img) Object.assign(img, data);
  },

  findImageById(id: string): { sourceUrl: string | null } | undefined {
    const img = mem.find(img => img.id === id);
    return img !== undefined ? { sourceUrl: img.sourceUrl } : undefined;
  },
};
