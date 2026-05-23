import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface ContactUsMessage {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  attachment?: string | null;
  created_at: string;
  responded: boolean;
  responded_at?: string | null;
  responded_by?: number | null;
}

export interface ContactUsFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachment?: File | null;
  responded?: boolean;
}

type ContactUsListResponse = {
  data?: ContactUsMessage[];
  results?: ContactUsMessage[];
};

function unwrapContactData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function buildContactUsFormData(input: ContactUsFormInput): FormData {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("email", input.email);
  formData.append("subject", input.subject);
  formData.append("message", input.message);

  if (input.phone) {
    formData.append("phone", input.phone);
  }

  if (input.attachment) {
    formData.append("attachment", input.attachment);
  }

  if (typeof input.responded === "boolean") {
    formData.append("responded", String(input.responded));
  }

  return formData;
}

export async function getContactUsMessages(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ContactUsListResponse>(
    API_ENDPOINTS.CONTACT_US.LIST,
    { params },
  );

  const payload = unwrapContactData<ContactUsMessage[] | ContactUsListResponse>(
    data,
  );

  return Array.isArray(payload)
    ? payload
    : payload.data ?? payload.results ?? [];
}

export async function getContactUsMessage(id: string | number) {
  const { data } = await apiClient.get<ContactUsMessage>(
    API_ENDPOINTS.CONTACT_US.DETAIL(id),
  );

  return unwrapContactData<ContactUsMessage>(data);
}

export async function createContactUsMessage(input: ContactUsFormInput) {
  const { data } = await apiClient.post(
    API_ENDPOINTS.CONTACT_US.CREATE,
    buildContactUsFormData(input),
  );

  return unwrapContactData<ContactUsMessage>(data);
}

export async function updateContactUsMessage(
  id: string | number,
  input: Partial<ContactUsFormInput>,
) {
  const formData = new FormData();

  if (input.name) formData.append("name", input.name);
  if (input.email) formData.append("email", input.email);
  if (input.phone !== undefined && input.phone !== null) {
    formData.append("phone", input.phone);
  }
  if (input.subject) formData.append("subject", input.subject);
  if (input.message) formData.append("message", input.message);
  if (input.attachment) formData.append("attachment", input.attachment);
  if (typeof input.responded === "boolean") {
    formData.append("responded", String(input.responded));
  }

  const { data } = await apiClient.patch(
    API_ENDPOINTS.CONTACT_US.UPDATE(id),
    formData,
  );

  return unwrapContactData<ContactUsMessage>(data);
}

export async function deleteContactUsMessage(id: string | number) {
  const { data } = await apiClient.delete(API_ENDPOINTS.CONTACT_US.DELETE(id));

  return unwrapContactData<void>(data);
}