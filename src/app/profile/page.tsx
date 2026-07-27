/* eslint-disable */
"use client";
import { Suspense, useEffect, useState } from "react";
import ProfileContent from "./ProfileContent";
import { CircularProgress } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { initAuth } from "@/services/authServices";
import { fetchCurrentUser, fetchOrganizationUserSites, fetchSiteUser, fetchUser } from "@/app/organization/services/api";
import { User, Site } from "@/app/organization/types";
import { formatDisplayDate } from "@/utils";
import EditUserModal from "@/components/modals/EditUserModal";
import { Pencil } from "lucide-react";

interface LegalExpertAddress {
  id: string;
  addressName: string;
  fullAddress: string;
}

interface UserData {
  id: string;
  fullName: string;
  expertTypeId?: any;
  legalExpertPersonalDetails?: {
    aboutMe?: string;
    photoBinary?: string;
    phoneNumber?: string;
  };
  legalExpertProfessionalDetails?: {
    registrationNumber?: string;
    yearsOfExperience?: string;
    portfolios?: string[];
  };
  legalExpertSchedule?: {
    feesPerSession?: string;
  };
  emailId?: string;
  legalExpertAddress?: LegalExpertAddress[];
}

function ProfilePage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const targetOrgId = searchParams.get("organizationId");
  const targetSiteId = searchParams.get("siteId");
  const paramName = searchParams.get("name");
  const paramEmail = searchParams.get("email");

  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userSites, setUserSites] = useState<Site[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      const isAuthenticated = await initAuth();
      setAuthenticated(isAuthenticated);
      setAuthChecked(true);
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!authChecked) return;

      setLoading(true);

      try {
        if (authenticated) {
          try {
            let user: User;
            if (targetUserId && targetOrgId) {
              try {
                user = targetSiteId
                  ? await fetchSiteUser(targetOrgId, targetSiteId, targetUserId)
                  : await fetchUser(targetOrgId, targetUserId);
              } catch {
                // API call failed — build a minimal display-only user from URL params
                user = {
                  id: targetUserId,
                  userId: targetUserId,
                  fullName: paramName ?? "Unknown User",
                  emailId: paramEmail ?? "",
                  phoneNumber: "",
                  roles: [],
                  organizationId: targetOrgId,
                  registeredDate: "",
                  lastLoginDate: "",
                  enabled: true,
                } as User;
              }
            } else {
              user = await fetchCurrentUser();

              // /users/me does not reliably return siteId for site-level users
              // (SiteAdmin/SiteClerk/etc). Resolve it via the sites-for-user API
              // so the Edit modal calls the site-scoped user API, not the
              // org-scoped one (which 403s for site-level accounts).
              const isSiteRole = user.roles?.some((role: string) => role.includes('Site'));
              if (isSiteRole && !user.siteId && user.organizationId) {
                try {
                  const sitesPage = await fetchOrganizationUserSites(user.organizationId, user.id);
                  setUserSites(sitesPage.items);
                  const mySite = sitesPage.items[0];
                  if (mySite) {
                    user = { ...user, siteId: mySite.id, siteName: mySite.name };
                  }
                } catch (siteError) {
                  console.error("Error resolving site for current user:", siteError);
                }
              }
            }
            setCurrentUser(user);

            setUserData({
              id: user.id,
              fullName: user.fullName,
              emailId: user.emailId,
              legalExpertPersonalDetails: {
                phoneNumber: String(user.phoneNumber),
              },
            });

          } catch (error) {
            console.error("Error fetching profile data:", error);
            setUserData(null);
            setCurrentUser(null);
          }
        } else {
          setUserData(null);
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [pathname, authenticated, authChecked, targetUserId, targetOrgId, targetSiteId, refreshTrigger]);

  if (loading) {
    return (
      <div style={{
        height: '60vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: "center"
      }}>
        <CircularProgress size={80} style={{ color: "#003399" }} />
      </div>
    );
  }

  // If we have currentUser data, display simple user profile
  if (currentUser) {
    const isSiteClerk = currentUser.roles?.includes('SiteClerk');
    const isSiteLegalExpert = currentUser.roles?.includes('SiteLegalExpert');
    const isSiteSrLegalExpert = currentUser.roles?.includes('SiteSrLegalExpert');
    const hasSiteAccess = currentUser.roles?.some((role: string) => role.includes('Site'));
    const canSeeDashboards = isSiteClerk || isSiteLegalExpert || isSiteSrLegalExpert;

    return (
      <div
        className="py-6 px-4 md:px-20 min-h-screen"
        style={{
          backgroundImage: 'url("/hero section background.svg")',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* My Profile Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[32px] font-bold text-[#222222]">
                {targetUserId ? "User Profile" : "My Profile"}
              </h1>
              {!targetUserId && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  aria-label="Edit Profile"
                  title="Edit Profile"
                  className="flex items-center justify-center w-9 h-9 rounded-full text-[#003399] hover:bg-[#003399]/10 transition-colors flex-shrink-0"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex border-b pb-4">
                <div className="w-1/3 text-[#666666] font-medium">Full Name:</div>
                <div className="w-2/3 text-[#222222] font-normal">{currentUser.fullName}</div>
              </div>

              <div className="flex border-b pb-4">
                <div className="w-1/3 text-[#666666] font-medium">Email:</div>
                <div className="w-2/3 text-[#222222] font-normal">{currentUser.emailId}</div>
              </div>

              <div className="flex border-b pb-4">
                <div className="w-1/3 text-[#666666] font-medium">Phone Number:</div>
                <div className="w-2/3 text-[#222222] font-normal">{currentUser.phoneNumber}</div>
              </div>

              {currentUser.gender && (
                <div className="flex border-b pb-4">
                  <div className="w-1/3 text-[#666666] font-medium">Gender:</div>
                  <div className="w-2/3 text-[#222222] font-normal">
                    {currentUser.gender === 'Transgender' ? 'Non-Binary' : currentUser.gender}
                  </div>
                </div>
              )}

              {currentUser.roles?.length > 0 && (
                <div className="flex border-b pb-4">
                  <div className="w-1/3 text-[#666666] font-medium">Roles:</div>
                  <div className="w-2/3 text-[#222222] font-normal">
                    {currentUser.roles.join(", ")}
                  </div>
                </div>
              )}

              {currentUser.registeredDate && (
                <div className="flex border-b pb-4">
                  <div className="w-1/3 text-[#666666] font-medium">Registered Date:</div>
                  <div className="w-2/3 text-[#222222] font-normal">
                    {formatDisplayDate(currentUser.registeredDate)}
                  </div>
                </div>
              )}

              <div className="flex pb-4">
                <div className="w-1/3 text-[#666666] font-medium">Status:</div>
                <div className="w-2/3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    currentUser.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentUser.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* My Organization Card - hidden per request, only Profile card should show on this page
          {!targetUserId && canSeeDashboards && hasSiteAccess && userSites.length > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="p-8"
            >
              <h2 className="text-[32px] font-bold text-[#222222] mb-6">
                My Organization
              </h2>

              <div className="space-y-6">
                {userSites.map((site) => (
                  <div key={site.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="mb-4">
                      <div className="text-[#666666] font-medium mb-2">Site Name:</div>
                      <div className="text-[#222222] font-semibold text-lg">{site.name}</div>
                      {site.description && (
                        <div className="text-[#666666] text-sm mt-2">{site.description}</div>
                      )}
                    </div>

                    <div className="flex gap-4 flex-wrap">
                      <button
                        onClick={() => router.push(`/organization/${site.organizationId}/sites/${site.id}/cases?userId=${currentUser.id}`)}
                        style={{
                          background: 'linear-gradient(135deg, #2FBD59 0%, #27A84E 100%)',
                        }}
                        className="px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg active:scale-95 flex-shrink-0"
                      >
                        Personal Dashboard
                      </button>

                      <button
                        onClick={() => router.push(`/organization/${site.organizationId}/sites/${site.id}`)}
                        style={{
                          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)',
                        }}
                        className="px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg active:scale-95 flex-shrink-0"
                      >
                        Site Dashboard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          */}
        </div>

        {!targetUserId && (
          <EditUserModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => {
              setEditModalOpen(false);
              setRefreshTrigger((v) => v + 1);
            }}
            organizationId={currentUser.organizationId}
            userId={currentUser.id}
            siteId={currentUser.siteId ?? null}
            isSiteMode={!!currentUser.siteId}
            userSiteId={currentUser.siteId ?? null}
            isOrgMode={!currentUser.siteId}
            siteName={currentUser.siteName || (!currentUser.siteId ? 'Head Office' : '')}
          />
        )}
      </div>
    );
  }

  // When coming from user search, never fall through to the legal-expert view
  if (targetUserId) {
    return (
      <div
        className="py-6 px-4 md:px-20 min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url("/hero section background.svg")',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <p className="text-slate-500 text-sm">Unable to load user profile.</p>
      </div>
    );
  }

  // Fallback to ProfileContent for legal experts
  return (
    <div>
      <Suspense fallback={
        <div style={{
          height: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: "center"
        }}>
          <CircularProgress size={80} style={{ color: "#003399" }} />
        </div>
      }>
        <ProfileContent userData={userData} />
      </Suspense>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={80} style={{ color: "#003399" }} />
      </div>
    }>
      <ProfilePage />
    </Suspense>
  );
}