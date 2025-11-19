export type MediaType = "image" | "audio";

export interface Media {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  publicId: string;
  // opcional: size, mimeType si backend lo envía
  size?: number;
  mimeType?: string;
}