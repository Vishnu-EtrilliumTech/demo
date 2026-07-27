'use client'

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle'; 

export default function PopupPage() {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };
  
    return (
      <React.Fragment>
       <div className="p-20">
       <div  className="p-20">
       <Button variant="outlined" onClick={handleClickOpen}
          sx={{
            borderRadius: "24px",
            textTransform: "none",
            backgroundColor: "#EA4234",
            border:"1px solid #EA4234",
            width: "139px",
            height: "46px",
            fontWeight: "bold",
            color:"#ffff",
            fontSize:"14px",
            "&:hover": {
              backgroundColor: "#D0372E",
            },
          }}>
        De Activate
        </Button>
       </div>
       
       <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          fullWidth
          
        >
          <DialogTitle 
          
           sx={{
            fontWeight: "bold",
            fontSize:"24px",
            textAlign:"center",
          }}
          >
            De Activate
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description"
             sx={{
                fontWeight: "medium",
                fontSize:"16px",
                textAlign:"center",
                color:"#00000"
              }}>
            Do You Really Want To De Activate !
            </DialogContentText>
            <DialogContentText id="alert-dialog-description"
            sx={{
                fontWeight: "normal",
                fontSize:"16px",
                textAlign:"center",
                color:"#00000"
              }}>
            Are you sure?
            </DialogContentText>
            <div className="pt-5">
                <textarea className="w-full p-2 border rounded-3xl h-[119px]" />
            </div>
          </DialogContent>
          <div>
          <DialogActions 
          sx={{
            justifyContent:"center"

          }}>
            <Button onClick={handleClose}
             sx={{
                borderRadius: "24px",
                textTransform: "none",
                backgroundColor: "#ffff",
                border:"1px solid #003995",
                width: "102px",
                height: "46px",
                fontWeight: "bold",
                color:"#003995",
                fontSize:"14px",
                "&:hover": {
                  backgroundColor: "#003995",
                },
              }}>OK</Button>
            <Button onClick={handleClose} autoFocus
            sx={{
                borderRadius: "24px",
                textTransform: "none",
                backgroundColor: "#EA4234",
                border:"1px solid #EA4234",
                width: "118px",
                height: "46px",
                fontWeight: "bold",
                color:"#ffff",
                fontSize:"14px",
                "&:hover": {
                  backgroundColor: "#D0372E",
                },
              }}>
            CANCEL
            </Button>
          </DialogActions>
          </div>
        </Dialog>
       
       </div>
      </React.Fragment>
    );
}