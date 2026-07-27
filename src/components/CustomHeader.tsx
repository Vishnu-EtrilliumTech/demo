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
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  getAuthClient,
  getUserInfo,
  logout,
} from "@/services/authServices";

interface UserProfile {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  firstName?: string;
  lastName?: string;
}

const Header = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginAnchorEl, setLoginAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initials, setInitials] = useState<string>("");
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 980);
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
            const storedUser = localStorage.getItem("userInfo");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setUserInfo(parsedUser);
  
              const name =
                parsedUser.attributes?.fullName?.[0] || parsedUser.name;
  
              if (name) {
                const capitalizeFirstLetterOfEachWord = (string: string) => {
                  return string.replace(/\b\w/g, (char) => char.toUpperCase());
                };
                const capitalizedUserName = capitalizeFirstLetterOfEachWord(name);
                setUserName(capitalizedUserName);
  
                // Set initials
                const nameParts = capitalizedUserName
                  .split(" ")
                  .filter((part) => part.length > 0);
                const initials = nameParts.map((part) => part.charAt(0)).join("");
                setInitials(initials);
              }
  
              setIsLoggedIn(true);
            } else {
              const userDetail = await getUserInfo();
              if (userDetail) {
                setUser(userDetail);
                setUserInfo(userDetail);
  
                const name =
                  userDetail.attributes?.fullName?.[0] || userDetail.name;
  
                if (name) {
                  const capitalizeFirstLetterOfEachWord = (string: string) => {
                    return string.replace(/\b\w/g, (char) => char.toUpperCase());
                  };
                  const capitalizedUserName =
                    capitalizeFirstLetterOfEachWord(name);
                  setUserName(capitalizedUserName);
  
                  const nameParts = capitalizedUserName
                    .split(" ")
                    .filter((part) => part.length > 0);
                  const initials = nameParts
                    .map((part) => part.charAt(0))
                    .join("");
                  setInitials(initials);
                }
  
                setIsLoggedIn(true);
                localStorage.setItem("userInfo", JSON.stringify(userDetail));
              } else {
                clearUserData();
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
      setUser(null);
      setUserInfo(null);
      setUserName("");
      setInitials("");
      setIsLoggedIn(false);
      localStorage.removeItem("userInfo");
    };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = (event: React.MouseEvent<HTMLElement>) => {
    setLoginAnchorEl(event.currentTarget);
  };

  const handleLogin = async (role: string) => {
    try {
      const redirectUri = `${
        window.location.origin
      }/auth?role=${encodeURIComponent(role)}`;
      const authClient = getAuthClient();
      await authClient.login({
        redirectUri,
        prompt: "login",
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      handleClose();
      await logout();
      setUser(null);
      setUserInfo(null);
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

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      sx={{ paddingX: isMobile ? 2 : 10 }}
    >
      <Toolbar sx={{ justifyContent: "space-between", paddingX: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link href="/">
            <Image src="/logo.png" alt="Lawsome Logo" width={120} height={40} />
          </Link>
        </Box>

        {isMobile ? (
          <>
            <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
              {isLoggedIn ? (
                <Avatar
                  sx={{
                    bgcolor: "#003399",
                    marginRight: 1,
                    fontSize: "12px",
                  }}
                >
                  {initials}
                </Avatar>
              ) : (
                <MenuIcon />
              )}
            </IconButton>

            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={toggleDrawer(false)}
                onKeyDown={toggleDrawer(false)}
              >
                <List>
                {isMobile ? (
  <>
    <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
      {isLoggedIn ? (
        <Avatar
          sx={{
            bgcolor: "#003399",
            marginRight: 1,
            fontSize: "12px",
          }}
        >
          {initials}
        </Avatar>
      ) : (
        <MenuIcon />
      )}
    </IconButton>

    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
    >
      <Box
        sx={{ width: 250, padding: 2 }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List>
          {isLoggedIn ? (
            <ListItem>
              <p className="text-[14px] font-medium">{userName}</p>
            </ListItem>
          ) : null}

          {isLoggedIn ? (
            <>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/dashboard" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/dashboard"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight: pathname === "/dashboard" ? 600 : 400,
                    }}
                  >
                    My Dashboard
                  </Button>
                </Link>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/profile" style={{ width: '100%' }}>
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
                    }}
                  >
                    My Profile
                  </Button>
                </Link>
              </ListItem>
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
              <ListItem sx={{ paddingLeft: 0 }}>
                <Button
                  fullWidth
                  onClick={() => handleLogin("client")}
                  sx={{
                    textTransform: "none",
                    justifyContent: "flex-start",
                    color: "primary.dark",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Login as Client
                </Button>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Button
                  fullWidth
                  onClick={() => handleLogin("legalexpert")}
                  sx={{
                    textTransform: "none",
                    justifyContent: "flex-start",
                    color: "primary.dark",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Login as Legal Expert
                </Button>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Button
                  fullWidth
                  onClick={() => handleLogin("organizationuser")}
                  sx={{
                    textTransform: "none",
                    justifyContent: "flex-start",
                    color: "primary.dark",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Login as Organization User
                </Button>
              </ListItem>
            </>
          )}
        </List>
        {!isLoggedIn && (
          <Box sx={{ paddingX: 1, marginTop: 2 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                borderRadius: "24px",
                textTransform: "none",
                backgroundColor: "#003995",
                "&:hover": {
                  backgroundColor: "#2563EB",
                },
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  </>
) : null}

                  <ListItem>
                    <Link href={"/dashboard/my-billing"}>
                      <Button
                        sx={{
                          textTransform: "none",
                          color:
                            pathname === "/dashboard/my-billing"
                              ? "primary.main"
                              : "primary.dark",
                          "&:hover": { color: "primary.main" },
                          fontWeight:
                            pathname === "/dashboard/my-billing" ? 600 : 400,
                        }}
                      >
                        Billing
                      </Button>
                    </Link>
                  </ListItem>
                  {isLoggedIn ? (
                    <List>
                      <ListItem>
                        <Link href={"/dashboard"}>
                          <Button
                            sx={{
                              textTransform: "none",
                              color:
                                pathname === "/dashboard"
                                  ? "primary.main"
                                  : "primary.dark",
                              "&:hover": { color: "primary.main" },
                              fontWeight:
                                pathname === "/dashboard"
                                  ? 600
                                  : 400,
                            }}
                          >
                            My Dashboard
                          </Button>
                        </Link>
                      </ListItem>
                      <ListItem>
                        <Link href={"/profile"}>
                          <Button
                            sx={{
                              textTransform: "none",
                              color:
                                pathname === "/profile"
                                  ? "primary.main"
                                  : "primary.dark",
                              "&:hover": { color: "primary.main" },
                              fontWeight: pathname === "/profile" ? 600 : 400,
                            }}
                          >
                            My Profile
                          </Button>
                        </Link>
                      </ListItem>
                      <ListItem>
                        <Button
                          onClick={handleLogout}
                          sx={{
                            textTransform: "none",
                            color:
                              pathname === "/change-password"
                                ? "primary.main"
                                : "primary.dark",
                            "&:hover": { color: "primary.main" },
                            fontWeight:
                              pathname === "/change-password" ? 600 : 400,
                          }}
                        >
                          Logout
                        </Button>
                      </ListItem>
                    </List>
                  ) : null}
                </List>
                {isLoggedIn ? null : (
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => handleLogin("client")}
                      sx={{
                        borderRadius: "24px",
                        textTransform: "none",
                        color: "#1D4ED8",
                        borderColor: "#1D4ED8",
                        "&:hover": {
                          backgroundColor: "rgba(29, 78, 216, 0.1)",
                        },
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: "24px",
                        textTransform: "none",
                        backgroundColor: "#003995",
                        "&:hover": {
                          backgroundColor: "#2563EB",
                        },
                      }}
                    >
                      Register
                    </Button>
                  </Box>
                )}
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            <Box sx={{ marginLeft: 8, display: "flex" }}>
            </Box>

            {/* Buttons */}
            {isLoggedIn ? (
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    textTransform: "none",
                    color: "black",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#003399",
                      marginRight: 1,
                      fontSize: "12px",
                    }}
                    onClick={handleClick}
                  >
                    {initials}
                  </Avatar>
                  <p onClick={handleClick} className="text-[14px] font-medium">{userName}</p>
                  <IconButton
                    aria-controls="avatar-menu"
                    aria-haspopup="true"
                    onClick={handleClick}
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
                  {/* <Link href="/dashboard/my-appointments" passHref>
                    <MenuItem onClick={handleClose}>My Dashboard</MenuItem>
                  </Link>
                  <hr /> */}
                  <Link href="/profile" passHref>
                    <MenuItem onClick={handleClose}>My Profile</MenuItem>
                  </Link>
                  <hr />

                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoginClick}
                  sx={{
                    borderRadius: "24px",
                    textTransform: "none",
                    color: "#1D4ED8",
                    borderColor: "#1D4ED8",
                    "&:hover": {
                      backgroundColor: "#003995",
                      color: "#ffffff",
                    },
                  }}
                >
                  Login / Register
                  {Boolean(loginAnchorEl) ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </Button>
                <Menu
                  anchorEl={loginAnchorEl}
                  open={Boolean(loginAnchorEl)}
                  onClose={handleLoginClose}
                  sx={{
                    "& .MuiPaper-root": {
                      width: "200px",
                      height: "90",
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
                    left: "-39px",
                    top: "4px",
                  }}
                >
                  <MenuItem onClick={() => handleLogin("client")}>
                    As Client
                  </MenuItem>
                  <hr />
                  <MenuItem onClick={() => handleLogin("organizationuser")}>
                    As Organization User
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
