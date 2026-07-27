/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { isLoggedIn as checkIsLoggedIn, getToken, clearToken, storeToken } from "@/services/authServices";
import { fetchOrganizationByUserEmail, fetchOrganizationUserSites, fetchCurrentUser } from "@/app/organization/services/api";
import { jwtDecode } from "jwt-decode";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useSearchParams } from "next/navigation";

interface JwtPayload { email: string; }
import { User } from "@/app/organization/types";

interface UserInfo {
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  firstName?: string;
  lastName?: string;
  attributes?: {
    fullName?: string[];
  };
}

const Header = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginAnchorEl, setLoginAnchorEl] = useState<null | HTMLElement>(null);
  const [orgMenuAnchorEl, setOrgMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDataReady, setMenuDataReady] = useState<boolean>(false);
  const [orgMobileOpen, setOrgMobileOpen] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrationEmail = pathname === '/register' ? (searchParams.get('email') || '') : '';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initials, setInitials] = useState<string>("");
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Changed from 980 to 768 for better mobile breakpoint
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  useEffect(() => {
    const checkAuthStatus = async () => {
      if (typeof window !== "undefined") {
        try {
          if (!checkIsLoggedIn()) {
            clearUserData();
            return;
          }

          // Try to fetch current user from API
          const storedCurrentUser = localStorage.getItem("currentUser");
          if (storedCurrentUser) {
            const parsedCurrentUser = JSON.parse(storedCurrentUser);
            setCurrentUser(parsedCurrentUser);

            const name = parsedCurrentUser.fullName;
            if (name) {
              const capitalizeFirstLetterOfEachWord = (string: string) => {
                return string.replace(/\b\w/g, (char) => char.toUpperCase());
              };
              const capitalizedUserName = capitalizeFirstLetterOfEachWord(name);
              setUserName(capitalizedUserName);

              const nameParts = capitalizedUserName
                .split(" ")
                .filter((part) => part.length > 0);
              const initials = nameParts.map((part) => part.charAt(0)).join("");
              setInitials(initials);
            }
            setIsLoggedIn(true);
          } else {
            // Fetch from API
            const apiUser = await fetchCurrentUser();
            if (apiUser) {
              setCurrentUser(apiUser);
              localStorage.setItem("currentUser", JSON.stringify(apiUser));

              const name = apiUser.fullName;
              if (name) {
                const capitalizeFirstLetterOfEachWord = (string: string) => {
                  return string.replace(/\b\w/g, (char) => char.toUpperCase());
                };
                const capitalizedUserName = capitalizeFirstLetterOfEachWord(name);
                setUserName(capitalizedUserName);

                const nameParts = capitalizedUserName
                  .split(" ")
                  .filter((part) => part.length > 0);
                const initials = nameParts.map((part) => part.charAt(0)).join("");
                setInitials(initials);
              }
              setIsLoggedIn(true);
            }
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
          clearUserData();
        }
      }
    };

    checkAuthStatus();
  }, []);

  const clearUserData = () => {
    setUserInfo(null);
    setCurrentUser(null);
    setUserName("");
    setInitials("");
    setIsLoggedIn(false);
    localStorage.removeItem("userInfo");
    localStorage.removeItem("currentUser");
  };

  const checkUserOrganization = async (navigate = true) => {
    const token = getToken();
    if (!token) {
      if (navigate) router.push("/");
      return null;
    }
    const decoded = jwtDecode<JwtPayload>(token);
    const email = decoded.email;
    if (!email) {
      if (navigate) router.push("/");
      return null;
    }

    try {
      const orgDataCached = localStorage.getItem("orgData");
      let orgData;
      let siteData = null;
      
      if (!orgDataCached) {
        orgData = await fetchOrganizationByUserEmail(email);
        if (orgData) {
          localStorage.setItem("orgData", JSON.stringify(orgData));
        }
      } else {
        orgData = JSON.parse(orgDataCached);
      }
      
      if (!orgData?.id) {
        if (navigate) router.push('/register?role=organizationuser');
        return null;
      }

      const roles = orgData.currentUser?.roles || [];
      const currentUserId = orgData.currentUser?.id;
      
      setOrgData(orgData);
      setUserRoles(roles);
      setUserId(currentUserId);
      siteData = await fetchOrganizationUserSites(orgData.id, currentUserId);
      const currentSiteId = siteData?.items?.[0]?.id;
      setSiteId(currentSiteId);

      if (!navigate) return { orgData, roles, userId: currentUserId, siteId: currentSiteId };
      
      if (roles.includes('OrganizationAdmin')) {
        router.push(`/organization/${orgData.id}`);
        return;
      }

      if (!currentSiteId) {
        router.push('/register?role=organizationuser');
        return;
      }

      if (roles.includes('SiteAdmin')) {
        router.push(`/organization/${orgData.id}/sites/${currentSiteId}`);
      } else {
        router.push(`/organization/${orgData.id}/sites/${currentSiteId}/users/${currentUserId}`);
      }

      return { orgData, roles, userId: currentUserId, siteId: currentSiteId };
    } catch (error) {
      console.error("Error in checkUserOrganization:", error);
      if (navigate) router.push("/");
      return null;
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOrgMenuOpen = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    
    setOrgMenuAnchorEl(event.currentTarget);
    
    setMenuDataReady(false);
    const orgResult = await checkUserOrganization(false);
    if (orgResult) {
      setOrgData(orgResult.orgData);
      setUserRoles(orgResult.roles);
      setUserId(orgResult.userId);
      setSiteId(orgResult.siteId);
      setMenuDataReady(true);
    }
  };

  const getPrimaryDashboard = () => {
    if (!orgData?.id || !userId) return null;
    
    if (userRoles.includes('OrganizationAdmin')) {
      return {
        name: 'Organization Dashboard',
        path: `/organization/${orgData.id}`,
        role: 'Organization Admin',
        available: true,
        uniqueId: `primary-org-${orgData.id}-organization-admin`
      };
    }
    
    if (userRoles.includes('OrganizationClerk')) {
      return {
        name: 'Organization Dashboard', 
        path: `/organization/${orgData.id}`,
        role: 'Organization Clerk',
        available: true,
        uniqueId: `primary-org-${orgData.id}-organization-clerk`
      };
    }
    
    if (userRoles.includes('SiteAdmin')) {
      if (siteId) {
        return {
          name: 'Site Dashboard',
          path: `/organization/${orgData.id}/sites/${siteId}`,
          role: 'Site Admin',
          available: true,
          uniqueId: `primary-site-${orgData.id}-${siteId}-site-admin`
        };
      } else {
        return {
          name: 'Site Dashboard',
          path: '#',
          role: 'No Site Available',
          available: false,
          message: 'No site has been assigned to your account',
          uniqueId: `primary-site-disabled-${orgData.id}-${userId}`
        };
      }
    }
    
    if (userRoles.some(role => role.startsWith('Site'))) {
      if (siteId) {
        const siteRole = getUserSiteRole();
        return {
          name: 'My Dashboard',
          path: `/organization/${orgData.id}/sites/${siteId}/users/${userId}`,
          role: siteRole,
          available: true,
          uniqueId: `primary-personal-site-${orgData.id}-${siteId}-${userId}`
        };
      } else {
        return {
          name: 'My Dashboard',
          path: '#',
          role: 'No Site Available',
          available: false,
          message: 'Personal dashboard requires site assignment',
          uniqueId: `primary-personal-disabled-${orgData.id}-${userId}`
        };
      }
    }
    
    return {
      name: 'My Dashboard',
      path: `/organization/${orgData.id}`,
      role: userRoles.join(', ') || 'User',
      available: true,
      uniqueId: `primary-fallback-${orgData.id}-${userId}`
    };
  };

  const getUserSiteRole = () => {
    const siteRoles = userRoles.filter(role => role.startsWith('Site'));
    if (siteRoles.length > 0) {
      return siteRoles.find(role => role === 'SiteAdmin') || siteRoles[0];
    }
    return 'Site User';
  };

  const getAvailableDashboards = () => {
    console.log('getAvailableDashboards called with:', { orgData: orgData?.id, userId, userRoles, siteId });
    if (!orgData?.id || !userId) {
      console.log('Missing required data for dashboards');
      return [];
    }
    
    const dashboards = [];
    
    if (userRoles.includes('OrganizationAdmin') || userRoles.includes('OrganizationClerk')) {
      const orgRole = userRoles.includes('OrganizationAdmin') ? 'Organization Admin' : 'Organization Clerk';
      dashboards.push({
        name: 'Organization Dashboard',
        path: `/organization/${orgData.id}`,
        icon: '🏢',
        role: orgRole,
        priority: 1,
        available: true,
        uniqueId: `org-${orgData.id}-${orgRole.replace(' ', '-').toLowerCase()}`
      });
    }
    
    const hasSiteAdminRole = userRoles.includes('SiteAdmin');
    const hasSiteClerkRole = userRoles.includes('SiteClerk');
    const hasSiteLegalExpertRole = userRoles.includes('SiteLegalExpert');
    const hasSiteSrLegalExpertRole = userRoles.includes('SiteSrLegalExpert');

    // Site Dashboard - for SiteAdmin, SiteClerk, SiteLegalExpert, SiteSrLegalExpert
    if (hasSiteAdminRole || hasSiteClerkRole || hasSiteLegalExpertRole || hasSiteSrLegalExpertRole) {
      const siteRole = hasSiteAdminRole ? 'Site Admin' :
                       hasSiteClerkRole ? 'Site Clerk' :
                       hasSiteSrLegalExpertRole ? 'Senior Legal Expert' : 'Legal Expert';

      if (siteId) {
        dashboards.push({
          name: 'Site Dashboard',
          path: `/organization/${orgData.id}/sites/${siteId}`,
          icon: '🏪',
          role: siteRole,
          priority: 2,
          available: true,
          uniqueId: `site-${orgData.id}-${siteId}-${siteRole.replace(/\s+/g, '-').toLowerCase()}`
        });
      } else {
        dashboards.push({
          name: 'Site Dashboard',
          path: '#',
          icon: '🏪',
          role: 'No Site Available',
          priority: 2,
          available: false,
          disabled: true,
          message: 'No site has been assigned to your account',
          uniqueId: `site-disabled-${orgData.id}-${userId}`
        });
      }
    }
    
    // Personal Dashboard - for site-level roles (SiteClerk, SiteLegalExpert, SiteSrLegalExpert)
    // Only show "Personal Dashboard" if user is NOT an OrganizationClerk
    // OrganizationClerk should not have access to personal dashboard
    const canSeePersonalDashboard = hasSiteClerkRole || hasSiteLegalExpertRole || hasSiteSrLegalExpertRole || hasSiteAdminRole && !userRoles.includes('OrganizationClerk') && !userRoles.includes('OrganizationAdmin');

    if (canSeePersonalDashboard) {
      if (siteId) {
        dashboards.push({
          name: 'Personal Dashboard',
          path: `/organization/${orgData.id}/sites/${siteId}/users/${userId}`,
          icon: '👤',
          role: 'Personal',
          priority: 3,
          available: true,
          uniqueId: `personal-site-${orgData.id}-${siteId}-${userId}`
        });
      }
    }

    return dashboards.sort((a, b) => a.priority - b.priority);
  };

  const handleOrgMenuClose = () => {
    setOrgMenuAnchorEl(null);
    setMenuDataReady(false);
  };

  const navigateTo = (path: string) => {
    handleClose();
    handleOrgMenuClose();
    router.push(path);
  };

  const handleLoginClick = (event: React.MouseEvent<HTMLElement>) => {
    setLoginAnchorEl(event.currentTarget);
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any, role: string) => {
    try {
      const googleIdToken = credentialResponse.credential;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleIdToken }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        storeToken(data.data.token);
        window.location.href = `/auth?role=${role}`;
      } else {
        const decoded = jwtDecode<{ email?: string }>(googleIdToken);
        const email = decoded.email ? `&email=${encodeURIComponent(decoded.email)}` : '';
        sessionStorage.setItem('pending_google_credential', googleIdToken);
        router.push(`/register?role=${role}${email}`);
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      handleClose();
      clearToken();
      localStorage.clear();
      setUserInfo(null);
      setCurrentUser(null);
      setOrgData(null);
      setSiteId(null);
      setUserId(null);
      setUserRoles([]);
      setIsLoggedIn(false);
      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLoginClose = () => {
    setLoginAnchorEl(null);
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event && event.type === 'keydown' && 
        ((event as React.KeyboardEvent).key === 'Tab' || 
         (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const navigationLinks = [
    { text: "Home", href: "/" },
    { text: "Pricing", href: "/pricing" },
    { text: "Contact", href: "/contact" },
    { text: "Support", href: "/support" },
  ];

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ paddingX: isMobile ? 2 : 10, boxShadow: "none" }}
    >
      <Toolbar sx={{ justifyContent: "space-between", paddingX: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link href="/">
            <Image src="/logo.png" alt="Lawsome Logo" width={120} height={40} />
          </Link>
        </Box>

        {isMobile ? (
          <>
            {isLoggedIn ? (
              <Box display="flex" alignItems="center" gap={1}>
                {/* Avatar with dropdown functionality */}
                <Avatar
                  sx={{
                    bgcolor: "#003399",
                    fontSize: "12px",
                    cursor: "pointer",
                    minWidth: 44,
                    minHeight: 44,
                  }}
                  onClick={handleClick}
                >
                  {initials}
                </Avatar>
                
                {/* Hamburger menu for navigation */}
                <IconButton 
                  edge="end" 
                  color="inherit" 
                  onClick={toggleDrawer(true)} 
                  sx={{ 
                    ml: 1,
                    minWidth: 44,
                    minHeight: 44,
                    p: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)'
                    }
                  }}
                  aria-label="Open navigation menu"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            ) : (
              <IconButton 
                edge="end" 
                color="inherit" 
                onClick={toggleDrawer(true)}
                sx={{ 
                  minWidth: 44,
                  minHeight: 44,
                  p: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </IconButton>
            )}

            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
            >
              <Box
                sx={{ width: 280, padding: 2 }}
                role="presentation"
                onClick={toggleDrawer(false)}
                onKeyDown={toggleDrawer(false)}
              >
                <List>
                  {isLoggedIn ? (
                    <>
                      <ListItem sx={{ pb: 2, borderBottom: 1, borderColor: 'divider', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Avatar
                            sx={{
                              bgcolor: "#003399",
                              fontSize: "12px",
                              width: 32,
                              height: 32,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <p className="text-[14px] font-medium">{userName}</p>
                        </Box>
                      </ListItem>
                      {navigationLinks.map((link) => (
                        <ListItem key={link.text} sx={{ paddingLeft: 0 }}>
                          <Link href={link.href}>
                            <Button
                              fullWidth
                              sx={{
                                textTransform: "none",
                                justifyContent: "flex-start",
                                color:
                                  pathname === link.href
                                    ? "primary.main"
                                    : "primary.dark",
                                "&:hover": { color: "primary.main" },
                                fontWeight: pathname === link.href ? 600 : 400,
                                minHeight: 48,
                                px: 2,
                                py: 1.5,
                              }}
                            >
                              {link.text}
                            </Button>
                          </Link>
                        </ListItem>
                      ))}
                      {/* Quick Access to Primary Dashboard */}
                      {(() => {
                        const primaryDashboard = getPrimaryDashboard();
                        if (primaryDashboard) {
                          return (
                            <ListItem sx={{ paddingLeft: 0 }}>
                              <Button
                                fullWidth
                                onClick={() => primaryDashboard.available ? navigateTo(primaryDashboard.path) : null}
                                disabled={!primaryDashboard.available}
                                sx={{
                                  textTransform: "none",
                                  justifyContent: "flex-start",
                                  color: !primaryDashboard.available ? 'text.disabled' : (pathname === primaryDashboard.path ? "primary.main" : "primary.dark"),
                                  "&:hover": { 
                                    color: !primaryDashboard.available ? 'text.disabled' : "primary.main" 
                                  },
                                  "&:disabled": {
                                    opacity: 0.6,
                                    color: 'text.disabled'
                                  },
                                  opacity: !primaryDashboard.available ? 0.6 : 1,
                                  cursor: !primaryDashboard.available ? 'not-allowed' : 'pointer',
                                  fontWeight: pathname === primaryDashboard.path ? 600 : 400,
                                  minHeight: 48,
                                  px: 2,
                                  py: 1.5,
                                  bgcolor: pathname === primaryDashboard.path ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                                  borderRadius: 1
                                }}
                                title={primaryDashboard.message || ''}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>
                                    {primaryDashboard.role.includes('Organization') ? '🏢' : 
                                     primaryDashboard.role.includes('Site') ? '🏪' : '👤'}
                                  </Box>
                                  <Box sx={{ textAlign: 'left' }}>
                                    <Box sx={{ fontSize: '14px', fontWeight: 500 }}>{primaryDashboard.name}</Box>
                                    <Box sx={{ 
                                      fontSize: '12px', 
                                      color: !primaryDashboard.available ? 'text.disabled' : 'text.secondary', 
                                      fontWeight: 400 
                                    }}>
                                      {primaryDashboard.role}
                                    </Box>
                                    {primaryDashboard.message && (
                                      <Box sx={{ 
                                        fontSize: '11px', 
                                        color: 'warning.main', 
                                        fontStyle: 'italic',
                                        mt: 0.5
                                      }}>
                                        {primaryDashboard.message}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Button>
                            </ListItem>
                          );
                        }
                        return null;
                      })()}
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <Link href={"/profile"} style={{ width: "100%" }}>
                          <Button
                            fullWidth
                            sx={{
                              textTransform: "none",
                              justifyContent: "flex-start",
                              color:
                                pathname === "/profile"
                                  ? "primary.main"
                                  : "primary.dark",
                              "&:hover": { color: "primary.main" },
                              fontWeight: pathname === "/profile" ? 600 : 400,
                              minHeight: 48,
                              px: 2,
                              py: 1.5,
                            }}
                          >
                            My Profile
                          </Button>
                        </Link>
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <Link href="#" style={{ width: '100%' }}>
                          <Button
                            fullWidth
                            sx={{
                              textTransform: 'none',
                              justifyContent: 'flex-start',
                              color: pathname.startsWith('/organization/') ? 'primary.main' : 'primary.dark',
                              '&:hover': { color: 'primary.main' },
                              fontWeight: 400,
                              minHeight: 56,
                            }}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const orgResult = await checkUserOrganization(false);
                              if (orgResult) {
                                setOrgData(orgResult.orgData);
                                setUserRoles(orgResult.roles);
                                setUserId(orgResult.userId);
                                setSiteId(orgResult.siteId);
                              }
                              setOrgMobileOpen((prev) => !prev);
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                                <Box sx={{ fontSize: '14px', fontWeight: 500 }}>My Organization</Box>
                                {orgData && (
                                  <Box sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
                                    {orgData.name}
                                  </Box>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
                                {orgMobileOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </Box>
                            </Box>
                          </Button>
                        </Link>
                      </ListItem>
                      <Collapse in={orgMobileOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItem sx={{ pl: 2, pb: 1 }}>
                            <Box sx={{ width: '100%', mb: 1 }}>
                              {(() => {
                                const availableDashboards = getAvailableDashboards();
                                
                                if (!orgData?.id || !userId) {
                                  return (
                                    <Box sx={{ px: 2, py: 2, textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>
                                      Loading dashboards...
                                    </Box>
                                  );
                                }
                                
                                if (availableDashboards.length === 0) {
                                  return (
                                    <Box sx={{ px: 2, py: 2, textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>
                                      No dashboards available
                                    </Box>
                                  );
                                }
                                
                                return availableDashboards.map((dashboard, index) => (
                                <Button
                                  key={`mobile-${dashboard.uniqueId}` || `mobile-${dashboard.name}-${dashboard.role}-${index}`}
                                  fullWidth
                                  onClick={() => dashboard.available ? navigateTo(dashboard.path) : null}
                                  disabled={dashboard.disabled || false}
                                  sx={{
                                    textTransform: "none",
                                    justifyContent: "flex-start",
                                    textAlign: 'left',
                                    px: 2,
                                    py: 1.5,
                                    mb: 0.5,
                                    color: dashboard.disabled ? 'text.disabled' : (pathname === dashboard.path ? 'primary.main' : 'primary.dark'),
                                    bgcolor: pathname === dashboard.path ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                                    opacity: dashboard.disabled ? 0.6 : 1,
                                    cursor: dashboard.disabled ? 'not-allowed' : 'pointer',
                                    "&:hover": { 
                                      color: dashboard.disabled ? 'text.disabled' : 'primary.main',
                                      bgcolor: dashboard.disabled ? 'transparent' : 'rgba(29, 78, 216, 0.04)'
                                    },
                                    "&:disabled": {
                                      opacity: 0.6,
                                      color: 'text.disabled'
                                    },
                                    fontWeight: pathname === dashboard.path ? 600 : 400,
                                    borderRadius: 1,
                                    border: pathname === dashboard.path ? '1px solid rgba(29, 78, 216, 0.2)' : '1px solid transparent'
                                  }}
                                  title={dashboard.message || ''}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                    <Box sx={{ flex: 1, textAlign: 'left' }}>
                                      <Box sx={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.2 }}>
                                        {dashboard.name}
                                      </Box>
                                      <Box sx={{ 
                                        fontSize: '12px', 
                                        color: dashboard.disabled ? 'text.disabled' : 'text.secondary', 
                                        fontWeight: 400, 
                                        lineHeight: 1.1 
                                      }}>
                                        {dashboard.role}
                                      </Box>
                                      {dashboard.message && (
                                        <Box sx={{ 
                                          fontSize: '11px', 
                                          color: 'warning.main', 
                                          fontStyle: 'italic',
                                          mt: 0.5,
                                          lineHeight: 1.1
                                        }}>
                                          {dashboard.message}
                                        </Box>
                                      )}
                                    </Box>
                                    {pathname === dashboard.path && (
                                      <Box sx={{ fontSize: '12px', color: 'primary.main' }}>●</Box>
                                    )}
                                  </Box>
                                </Button>
                                ));
                              })()}
                            </Box>
                          </ListItem>
                        </List>
                      </Collapse>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <Button
                          fullWidth
                          onClick={handleLogout}
                          sx={{
                            textTransform: "none",
                            justifyContent: "flex-start",
                            color: "primary.dark",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          Logout
                        </Button>
                      </ListItem>
                    </>
                  ) : (
                    <>
                      {navigationLinks.map((link) => (
                        <ListItem key={link.text} sx={{ paddingLeft: 0 }}>
                          <Link href={link.href}>
                            <Button
                              fullWidth
                              sx={{
                                textTransform: "none",
                                justifyContent: "flex-start",
                                color:
                                  pathname === link.href
                                    ? "primary.main"
                                    : "primary.dark",
                                "&:hover": { color: "primary.main" },
                                fontWeight: pathname === link.href ? 600 : 400,
                              }}
                            >
                              {link.text}
                            </Button>
                          </Link>
                        </ListItem>
                      ))}
                      <ListItem sx={{ paddingLeft: 0 }}>
                        {registrationEmail ? (
                          <Box sx={{
                            display: "flex", alignItems: "center", gap: 1,
                            border: "1px solid #d1d5db", borderRadius: "24px",
                            px: 2, py: 0.75, fontSize: "0.8rem", color: "#374151",
                          }}>
                            <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z"/>
                              <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.16l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"/>
                              <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
                              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                            </svg>
                            {registrationEmail}
                          </Box>
                        ) : (
                          <GoogleAuthButton
                            onSuccess={(cr) => handleGoogleLoginSuccess(cr, "organizationuser")}
                            onError={() => alert('Google Sign-In failed. Please try again.')}
                          />
                        )}
                      </ListItem>
                    </>
                  )}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 4 }}>
              {navigationLinks.map((link) => (
                <Link key={link.text} href={link.href}>
                  <p
                    className={`text-[16px] font-normal hover:text-[#3B82F6] ${
                      pathname === link.href
                        ? "text-[#3B82F6] font-semibold"
                        : "text-[#333333]"
                    }`}
                  >
                    {link.text}
                  </p>
                </Link>
              ))}
            </Box>

            {/* Buttons */}
            {isLoggedIn ? (
              <Box display="flex" alignItems="center">
                <Box
                  data-coach="profile-menu"
                  sx={{
                    textTransform: "none",
                    color: "black",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={handleClick}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#003399",
                      marginRight: 1,
                      fontSize: "12px",
                    }}
                  >
                    {initials}
                  </Avatar>
                  <p className="text-[14px] font-medium">
                    {userName}
                  </p>
                  <IconButton
                    aria-controls="avatar-menu"
                    aria-haspopup="true"
                    color="inherit"
                  >
                    {Boolean(anchorEl) ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>

                <Menu
                  id="avatar-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  sx={{
                    "& .MuiPaper-root": {
                      width: "271px",
                      height: "auto",
                      paddingY: "16px",
                      paddingX: "24px",
                      borderRadius: "16px",
                    },
                    "& .MuiList-root": {
                      padding: 0,
                    },
                    "& .MuiMenuItem-root": {
                      paddingX: 0,
                      color: "#626262",
                      fontSize: "14px",
                    },
                    left: "-94px",
                    top: "12px",
                  }}
                >
                  {/* <Link href="/dashboard" passHref>
                    <MenuItem onClick={handleClose}>My Dashboard</MenuItem>
                  </Link>
                  <hr /> */}
                  <Link href="/profile" passHref>
                    <MenuItem onClick={handleClose}>My Profile</MenuItem>
                  </Link>
                  <hr />                  
                  <MenuItem 
                    onClick={handleOrgMenuOpen}
                    onMouseEnter={async (e) => {
                      if (!orgMenuAnchorEl) {
                        await checkUserOrganization(false);
                        handleOrgMenuOpen(e);
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        await checkUserOrganization(false);
                        setOrgMenuAnchorEl(e.currentTarget);
                      }
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        await checkUserOrganization(false);
                        setOrgMenuAnchorEl(e.currentTarget);
                      }
                    }}
                    sx={{
                      '&:focus': {
                        backgroundColor: 'rgba(29, 78, 216, 0.08)',
                        color: 'primary.main'
                      }
                    }}
                  >
                    My Organization
                    <ChevronRightIcon sx={{ ml: 1 }} />
                  </MenuItem>
                  <Menu
                    anchorEl={orgMenuAnchorEl}
                    open={Boolean(orgMenuAnchorEl)}
                    onClose={handleOrgMenuClose}
                    disableAutoFocusItem={true}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiPaper-root': {
                        width: '300px',
                        minHeight: 'auto',
                        paddingY: '12px',
                        paddingX: '8px',
                        borderRadius: '12px',
                        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        right: '100%',
                        '& .MuiList-root': {
                          padding: 0,
                        }
                      },
                      '& .MuiList-root': {
                        padding: 0,
                      }
                    }}
                    onMouseLeave={handleOrgMenuClose}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleOrgMenuClose();
                        const parentMenuItem = document.querySelector('[aria-haspopup="true"]');
                        if (parentMenuItem) {
                          (parentMenuItem as HTMLElement).focus();
                        }
                      }
                    }}
                  >
                    {/* Header showing current context */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.06)', mb: 1 }}>
                      {orgData?.name || 'Loading...'}
                    </Box>

                    {/* Dashboard options */}
                    <Box sx={{ px: 1 }}>
                      {(() => {
                        const availableDashboards = getAvailableDashboards();
                        
                        if (!orgData?.id || !userId || userRoles.length === 0 || !menuDataReady) {
                          return (
                            <MenuItem disabled sx={{ px: 2, py: 2, textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>
                              Loading dashboards...
                            </MenuItem>
                          );
                        }
                        
                        if (availableDashboards.length === 0) {
                          return (
                            <MenuItem disabled sx={{ px: 2, py: 2, textAlign: 'center', color: 'text.secondary', fontSize: '14px' }}>
                              No dashboards available
                            </MenuItem>
                          );
                        }
                        
                        return availableDashboards.map((dashboard, index) => (
                        <MenuItem
                          key={dashboard.uniqueId || `${dashboard.name}-${dashboard.role}-${index}`}
                          onClick={() => dashboard.available ? navigateTo(dashboard.path) : null}
                          disabled={dashboard.disabled || false}
                          sx={{
                            px: 2,
                            py: 1.5,
                            mb: 0.5,
                            borderRadius: '8px',
                            color: dashboard.disabled ? 'text.disabled' : (pathname === dashboard.path ? 'primary.main' : 'text.primary'),
                            bgcolor: pathname === dashboard.path ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                            opacity: dashboard.disabled ? 0.6 : 1,
                            cursor: dashboard.disabled ? 'not-allowed' : 'pointer',
                            '&:hover': {
                              bgcolor: dashboard.disabled ? 'transparent' : (pathname === dashboard.path ? 'rgba(29, 78, 216, 0.12)' : 'rgba(0, 0, 0, 0.04)'),
                              color: dashboard.disabled ? 'text.disabled' : (pathname === dashboard.path ? 'primary.main' : 'text.primary')
                            },
                            '&.Mui-disabled': {
                              opacity: 0.6,
                              color: 'text.disabled'
                            },
                            border: pathname === dashboard.path ? '1px solid rgba(29, 78, 216, 0.2)' : '1px solid transparent',
                            transition: 'all 0.2s ease'
                          }}
                          title={dashboard.message || ''}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                            <Box sx={{ flex: 1, textAlign: 'left' }}>
                              <Box sx={{ 
                                fontSize: '14px', 
                                fontWeight: pathname === dashboard.path ? 600 : 500, 
                                lineHeight: 1.3 
                              }}>
                                {dashboard.name}
                              </Box>
                              <Box sx={{ 
                                fontSize: '12px', 
                                color: dashboard.disabled ? 'text.disabled' : (pathname === dashboard.path ? 'primary.main' : 'text.secondary'), 
                                fontWeight: 400, 
                                lineHeight: 1.2,
                                opacity: dashboard.disabled ? 0.7 : 0.8
                              }}>
                                {dashboard.role}
                              </Box>
                              {dashboard.message && (
                                <Box sx={{ 
                                  fontSize: '11px', 
                                  color: 'warning.main', 
                                  fontStyle: 'italic',
                                  mt: 0.5,
                                  lineHeight: 1.1
                                }}>
                                  {dashboard.message}
                                </Box>
                              )}
                            </Box>
                            {pathname === dashboard.path && (
                              <Box sx={{ 
                                fontSize: '8px', 
                                color: 'primary.main',
                                bgcolor: 'primary.main',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%'
                              }} />
                            )}
                          </Box>
                        </MenuItem>
                        ));
                      })()}
                    </Box>
                  </Menu>
                  <hr />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {registrationEmail ? (
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 1,
                    border: "1px solid #d1d5db", borderRadius: "24px",
                    px: 2, py: 0.75, fontSize: "0.8rem", color: "#374151",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.16l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                    </svg>
                    {registrationEmail}
                  </Box>
                ) : (
                  <GoogleAuthButton
                    onSuccess={(cr) => handleGoogleLoginSuccess(cr, "organizationuser")}
                    onError={() => alert('Google Sign-In failed. Please try again.')}
                  />
                )}
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
