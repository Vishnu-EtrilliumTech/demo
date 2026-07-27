"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCase, updateCase, fetchSiteUsers } from "@/app/organization/services/api";
import { CaseStatus } from "@/app/organization/types";
import type { User } from "@/app/organization/types";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FieldError } from "@/components/FieldError";
import { RequiredIndicator } from "@/components/RequiredIndicator";
import { useFormValidation } from "@/hooks/useFormValidation";
import { required, maxLength } from "@/utils/validation";
import { extractApiErrors } from "@/utils/errorHandler";
import { useToast } from "@/contexts/ToastContext";

const EditCasePage: React.FC<{
  params: Promise<{ id: string; siteId: string; caseId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}> = ({ params, searchParams: searchParamsPromise }) => {
  const router = useRouter();
  const searchParams = searchParamsPromise ? React.use(searchParamsPromise) : {};
  const resolvedParams = React.use(params);
  const organizationId = resolvedParams.id as string;
  const siteId = resolvedParams.siteId as string;
  const caseId = resolvedParams.caseId as string;
  const returnTo = searchParams?.returnTo;

  const [form, setForm] = useState({
    title: "",
    description: "",
    caseNumber: "",
    cnrNumber: "",
    assignedToId: "",
    status: CaseStatus.Open,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  // Validation schema for update - Note: Title is optional in update
  const validationSchema = {
    title: {
      rules: [maxLength('Title', 200)], // Optional but has max length
    },
    caseNumber: {
      rules: [required('Case Number')], // Required in update
    },
    description: {
      rules: [maxLength('Description', 500)],
    },
    status: {
      rules: [required('Status')], // Required
    },
  };

  const { errors, validate, clearFieldError } = useFormValidation(validationSchema);
  const { showSuccess } = useToast();

  useEffect(() => {
    const loadCase = async () => {
      setLoading(true);
      setApiErrors(null);
      try {
        const data = await fetchCase(organizationId, siteId, caseId);
        setForm({
          title: data.title || "",
          description: data.description || "",
          caseNumber: data.caseNumber || "",
          cnrNumber: data.cnrNumber || "",
          assignedToId: data.assignedToId?.toString() || "",
          status: data.status || CaseStatus.Open,
        });
      } catch (err: unknown) {
        const errorMessages = extractApiErrors(err);
        setApiErrors(errorMessages);
      } finally {
        setLoading(false);
      }
    };
    if (organizationId && siteId && caseId) loadCase();
  }, [organizationId, siteId, caseId]);

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const data = (await fetchSiteUsers(organizationId, siteId)).items;
        setUsers(data);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [organizationId, siteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear field error when user types
    clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors(null);

    // Validate form
    if (!validate(form)) {
      return;
    }

    setSaving(true);

    try {
      await updateCase(organizationId, siteId, caseId, {
        ...form,
        assignedToId: form.assignedToId,
      });

      // Show success message before navigation
      showSuccess('Case updated successfully');
      window.dispatchEvent(new CustomEvent('ecourts-quota-refresh'));

      // Navigate to returnTo URL if provided, otherwise go to case detail page
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push(`/organization/${organizationId}/sites/${siteId}/cases/${caseId}`);
      }
    } catch (err: unknown) {
      const errorMessages = extractApiErrors(err);
      setApiErrors(errorMessages);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/reg form bg.svg")' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl w-full mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary-600 hover:text-primary-800 mb-6 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Cases
        </button>
        <div className="bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Case</h2>
          <p className="text-lg text-gray-600 mb-8">Update case details below</p>

          <ErrorAlert errors={apiErrors} onClose={() => setApiErrors(null)} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base text-gray-700 font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-full ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter case title"
              />
              <FieldError error={errors.title} />
            </div>
            <div>
              <label className="block text-base text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`w-full p-3 border rounded-2xl ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter case description"
                rows={3}
              />
              <FieldError error={errors.description} />
            </div>
            <div>
              <label className="block text-base text-gray-700 font-medium mb-2">
                Case Number
                <RequiredIndicator />
              </label>
              <input
                type="text"
                name="caseNumber"
                value={form.caseNumber}
                onChange={handleChange}
                className={`w-full p-3 border rounded-full ${errors.caseNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter case number"
              />
              <FieldError error={errors.caseNumber} />
            </div>
            <div>
              <label className="block text-base text-gray-700 font-medium mb-2">
                Status
                <RequiredIndicator />
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={`w-full p-3 border rounded-full mb-4 ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
              >
                {Object.values(CaseStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <FieldError error={errors.status} />
            </div>

            <div>
              <label className="block text-base text-gray-700 font-medium mb-2">
                Assigned To<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="assignedToId"
                value={form.assignedToId}
                onChange={handleChange}
                className="w-full p-3 border rounded-full border-gray-300"
                required
                disabled={loadingUsers}
              >
                {loadingUsers ? (
                  <option value="" disabled>Loading users...</option>
                ) : users.length === 0 ? (
                  <option value="" disabled>No users found</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id || user.userId} value={user.id || user.userId}>
                      {user.fullName}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="mt-4 w-[123px] bg-[#EA4234] text-white p-2 rounded-full flex items-center justify-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  'Update Case'
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditCasePage;
