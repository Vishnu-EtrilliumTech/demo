/* eslint-disable */

"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOrganizationByUserEmail, fetchOrganizationUserSites } from "@/app/organization/services/api";
import { Box, CircularProgress } from "@mui/material";
import apiClient from "@/services/httpServices";
import { getToken, clearToken } from "@/services/authServices";
import { jwtDecode } from "jwt-decode";
import { useAppDispatch } from "../redux/store/hook";
import { fetchClientSuccess } from "../redux/client/clientSlice";

const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

interface JwtPayload {
  [key: string]: unknown;
}

const AuthPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<string | null>(null);
  useEffect(() => {
    const userRole = searchParams.get("role")
    setRole(userRole);
    if(userRole){
      localStorage.setItem('role', userRole)
    }
    setRedirect(searchParams.get("redirect"));
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const handleAuth = async () => {
      try {
        if (!mounted) return;
        setLoading(true);

        const token = getToken();
        console.log('[auth] token from localStorage:', token?.substring(0, 30));
        if (!token) {
          router.push('/');
          return;
        }

        const decoded = jwtDecode<JwtPayload>(token);
        console.log('[auth] decoded JWT keys:', Object.keys(decoded));
        const email = decoded[EMAIL_CLAIM] as string | undefined;
        if (!email) {
          clearToken();
          router.push('/');
          return;
        }

        try {
          if (role === "client") {
            const response = await apiClient.get(
              `/api/v1/clients/email/${email}`,
              {
                validateStatus: (status) => status === 200 || status === 404,
              }
            );

            if (!mounted) return;

            if (response.status === 200 || response.status === 201) {
              localStorage.setItem("userData", JSON.stringify(response.data));
              dispatch(fetchClientSuccess(response.data.data));
              console.log(response.data.data);
              const redirectUrl = new URL(
                redirect || "/",
                window.location.origin
              );
              const id = redirectUrl.searchParams.get("id");

              if (redirect) {
                router.push(
                  id ? `${redirectUrl.pathname}?id=${id}` : redirectUrl.pathname
                );
                return;
              }
              router.push("/");
            } else if (response.status === 404) {
              router.push(`/register?role=client`);
            }
          } else if (role === "legalexpert") {
            const response = await apiClient.get(
              `/api/v1/legalexperts/email/${email}`,
              {
                validateStatus: (status) => status === 200 || status === 404,
              }
            );

            if (!mounted) return;

            if (response.status === 200) {
              console.log("responseData", response.data);
              localStorage.setItem("userData", JSON.stringify(response.data));
              localStorage.setItem("userName", response?.data?.data?.fullName);
              const legalExpertId = response.data.data.id;
              const registrationStage = await apiClient.get(
                `/api/v1/legalexperts/${legalExpertId}/registrationstage`,
                { headers: { "Content-Type": "application/json" } }
              );
              if (registrationStage.data.data.stage === "Schedule") {
                router.push("/dashboard");
              }else{

                router.push("/dashboard");
              }
            } else if (response.status === 404) {
              router.push(`/register?role=legalexpert`);
            }
          } else if (role === "organizationuser") {
            const orgData = await fetchOrganizationByUserEmail(email);
            
            if (!mounted) return;

            if (!orgData?.id) {
              router.push('/register?role=organizationuser');
              return;
            }

            console.log("orgData", orgData);
            localStorage.setItem("orgData", JSON.stringify(orgData));
            const userRoles = orgData.currentUser?.roles || [];
            const userId = orgData.currentUser?.id;

            if (userRoles.some(role => role.toLowerCase().includes('organization'))) {
              router.push(`/organization/${orgData.id}`);
              return;
            }

            const siteData = await fetchOrganizationUserSites(String(orgData.id), userId);
            const siteId = siteData.items?.[0]?.id;

            if ((userRoles.includes('SiteAdmin') || userRoles.includes('SiteClerk')) && siteId) {
              router.push(`/organization/${orgData.id}/sites/${siteId}`);
            } else if (userId && siteId) {
              router.push(`/organization/${orgData.id}/sites/${siteId}/users/${userId}`);
            } else {
              router.push(`/register?role=organizationuser`);
            }
          }
        } catch (error) {
          console.error("Error in API operations:", error);
          setError("Failed to process user registration/login");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setError("Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    if (!role) return;
    handleAuth();

    return () => {
      mounted = false;
    };
  }, [role]);

  if (error) {
    return (
      <Box className="h-[100vh] flex flex-col justify-center items-center gap-4">
        <p style={{ color: '#ef4444', fontSize: '1rem' }}>{error}</p>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          style={{ padding: '8px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Back to Home
        </button>
      </Box>
    );
  }

  return (
    <>
      <Box className="h-[100vh] flex justify-center items-center">
        <CircularProgress />
      </Box>
    </>
  );
};

const AuthPageWrapper = () => (
  <Suspense
    fallback={
      <Box className="h-[100vh] flex justify-center items-center">
        <CircularProgress />
      </Box>
    }
  >
    <AuthPage />
  </Suspense>
);

export default AuthPageWrapper;
