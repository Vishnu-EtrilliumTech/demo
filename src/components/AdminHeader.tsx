import { AppBar, Box, Divider, IconButton, MenuItem, Toolbar, Drawer, ListItem, Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";

export default function AdminHeader() {

    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
      };
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

    return (
        <AppBar position="static" color="inherit" sx={{ paddingX: isMobile ? 2 : 10 }} >
        <Toolbar sx={{ justifyContent: "space-between", paddingX: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Link href="/">
                    <Image src="/logo.png" alt="Lawsome Logo" width={120} height={40} />
                </Link>
            </Box>
            {isMobile ? (
                 <>
                 <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
                <MenuIcon />
               </IconButton>
               
               <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                  <Box sx={{ width: 250, padding: 2 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)} >
                  <>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/admin-dashboard/"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight: pathname === "/admin-dashboard/" ? 600 : 400,
                    }}
                  >
                    My Dashboard
                  </Button>
                </Link>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/admin-dashboard/legal-experts" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/admin-dashboard/legal-experts"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight:
                        pathname === "/admin-dashboard/legal-experts" ? 600 : 400,
                    }}
                  >
                    Legal Experts
                  </Button>
                </Link>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/admin-dashboard/client-list" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/admin-dashboard/client-list"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight: pathname === "/admin-dashboard/client-list" ? 600 : 400,
                    }}
                  >
                    Clients
                  </Button>
                </Link>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/admin-dashboard/appointment-list" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/admin-dashboard/appointment-list"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight:
                        pathname === "/admin-dashboard/appointment-list" ? 600 : 400,
                    }}
                  >
                    Appointments
                  </Button>
                </Link>
              </ListItem>
              <ListItem sx={{ paddingLeft: 0 }}>
                <Link href="/admin-dashboard/payment-list" style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    sx={{
                      textTransform: "none",
                      justifyContent: "flex-start",
                      color:
                        pathname === "/admin-dashboard/payment-list"
                          ? "primary.main"
                          : "primary.dark",
                      "&:hover": { color: "primary.main" },
                      fontWeight:
                        pathname === "/admin-dashboard/payment-list" ? 600 : 400,
                    }}
                  >
                    Payments
                  </Button>
                </Link>
              </ListItem>
             
            </>
                      </Box>
              
                </Drawer>
                   </>
            ) : (
                <Box sx={{ marginLeft: 8, display: "flex" }}>
                <Link href="">
                  <MenuItem
                    sx={{
                      fontWeight:
                        pathname === "/admin-dashboard/"
                          ? "bold"
                          : "normal",
                    }}
                    
                  >
                   My Dashboard 
                  </MenuItem>
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderRightWidth: 2, height: "20px", marginY: 1 }}
                />
                <Link
                  href="/admin-dashboard/legal-experts"
                  style={{ textDecoration: "none" }}
                >
                  <MenuItem
                    sx={{
                      fontWeight:
                        pathname === "/admin-dashboard/legal-experts" ? "bold" : "normal",
                    }}
                   
                  >
                    
                    Legal Experts
                  </MenuItem>
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderRightWidth: 2, height: "20px", marginY: 1 }}
                />
                <Link
                  href="/admin-dashboard/client-list"
                  style={{ textDecoration: "none" }}
                >
                  <MenuItem
                    sx={{
                      fontWeight:
                        pathname === "/admin-dashboard/client-list" ? "bold" : "normal",
                    }}
                   
                  >
                    
                    Clients
                  </MenuItem>
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderRightWidth: 2, height: "20px", marginY: 1 }}
                />
                <Link
                  href="/admin-dashboard/appointment-list"
                  style={{ textDecoration: "none" }}
                >
                  <MenuItem
                    sx={{
                      fontWeight:
                        pathname === "/admin-dashboard/appointment-list" ? "bold" : "normal",
                    }}
                   
                  >
                    
                    Appointments
                  </MenuItem>
                </Link>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderRightWidth: 2, height: "20px", marginY: 1 }}
                />
                <Link
                  href="/admin-dashboard/payment-list"
                  style={{ textDecoration: "none" }}
                >
                  <MenuItem
                    sx={{
                      fontWeight:
                        pathname === "/admin-dashboard/payment-list" ? "bold" : "normal",
                    }}
                   
                  >
                    
                    Payments
                  </MenuItem>
                </Link>
              </Box>
            )}

           


            
        </Toolbar>
           

        
        </AppBar>
    );
}