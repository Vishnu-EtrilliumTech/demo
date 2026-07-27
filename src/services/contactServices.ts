import apiClient from "@/services/httpServices";

export interface ContactInquiryRequest {
  fullName: string;
  emailId: string;
  inquiry: string;
}

/**
 * Submits a contact inquiry. The API emails it to the Lawsome support inbox.
 * This endpoint is public - no authentication required.
 */
export const submitContactInquiry = async (
  request: ContactInquiryRequest
): Promise<void> => {
  await apiClient.post("/api/v1/contact", request);
};
