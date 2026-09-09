import { apiClient, withFallback } from "./apiClient";
import { mockQAService } from "./mock/mockService";
import type { Conversation, QAResponse } from "@/lib/types";

export const qaService = {
  listConversations: (): Promise<Conversation[]> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<Conversation[]>("/qa/conversations");
        return data;
      },
      () => mockQAService.listConversations()
    ),

  getConversation: (id: string): Promise<Conversation> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<Conversation>(`/qa/conversations/${id}`);
        return data;
      },
      () => mockQAService.getConversation(id)
    ),

  ask: (question: string, conversationId?: string): Promise<QAResponse> =>
    withFallback(
      async () => {
        const { data } = await apiClient.post<QAResponse>("/qa", {
          question,
          conversation_id: conversationId,
        });
        return data;
      },
      () => mockQAService.ask(question, conversationId)
    ),
};
