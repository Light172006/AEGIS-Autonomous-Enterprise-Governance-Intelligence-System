import { apiClient, withFallback } from "./apiClient";
import { mockDocumentService } from "./mock/mockService";
import type { Document } from "@/lib/types";

export const documentService = {
  list: (): Promise<Document[]> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<Document[]>("/documents");
        return data;
      },
      () => mockDocumentService.list()
    ),

  get: (id: string): Promise<Document> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<Document>(`/documents/${id}`);
        return data;
      },
      () => mockDocumentService.get(id)
    ),

  upload: (file: File): Promise<Document> =>
    withFallback(
      async () => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await apiClient.post<Document>("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return data;
      },
      () => mockDocumentService.upload(file)
    ),

  delete: (id: string): Promise<void> =>
    withFallback(
      async () => {
        await apiClient.delete(`/documents/${id}`);
      },
      () => mockDocumentService.delete(id)
    ),
};
