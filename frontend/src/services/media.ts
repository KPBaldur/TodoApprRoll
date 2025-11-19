import axios from "axios";
import { API_URL } from "./tasks";
import { getToken } from "./auth";
import type { Media } from "../types/media.types";

const client = axios.create({
  baseURL: `${API_URL}/media`,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (config.headers) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    } else {
      config.headers = { Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

export async function getMedia(): Promise<Media[]> {
  const { data } = await client.get<Media[]>("/");
  return data;
}

export async function uploadMedia(formData: FormData): Promise<Media> {
  const { data } = await client.post<Media>("/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteMedia(id: string): Promise<void> {
  await client.delete(`/${id}`);
}