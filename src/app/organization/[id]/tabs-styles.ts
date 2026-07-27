export const tabStyles = {
  tabs: {
    minWidth: { xs: '100%', md: 'auto' },
    width: '100%',
    '& .MuiTabs-flexContainer': {
      gap: { xs: '2px', md: '4px' },
      width: '100%',
      '& > *:first-of-type': {
        marginLeft: '0',
      },
      '& > *:last-child': {
        marginRight: '0',
      },
    },
    '& .MuiTabs-indicator': {
      height: '3px',
      borderRadius: '3px 3px 0 0',
      backgroundColor: 'primary.main',
      bottom: 0,
      top: 'auto',
      left: 0,
      right: 0,
      transform: 'none',
      transition: 'all 0.2s ease-in-out',
    },
    '& .MuiTabs-scroller': {
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '4px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: '2px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '2px',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    },
    '& .MuiTabs-scrollButtons': {
      width: { xs: '32px', md: '40px' },
      '&.Mui-disabled': {
        opacity: 0.3,
      },
    },
    '& .MuiTab-root': {
      minHeight: { xs: '52px', md: '48px' },
      height: { xs: '52px', md: '48px' },
      padding: { xs: '8px 12px', md: '0 24px' },
      margin: { xs: '0 1px', md: '0 2px' },
      minWidth: { xs: '80px', md: 'auto' },
      color: 'text.secondary',
      textTransform: 'none',
      fontSize: { xs: '0.8125rem', md: '0.9375rem' },
      fontWeight: 500,
      letterSpacing: '0.01em',
      position: 'relative',
      overflow: 'visible',
      borderRadius: '8px 8px 0 0',
      transition: 'all 0.2s ease-in-out',
      // Ensure proper touch targets on mobile
      '@media (pointer: coarse)': {
        minHeight: '56px',
        height: '56px',
        padding: '12px 16px',
      },
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.06)',
        color: 'primary.main',
      },
      '&.Mui-selected': {
        color: 'primary.main',
        backgroundColor: 'rgba(25, 118, 210, 0.12)',
      },
      '&:active': {
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
      },
      '& .MuiTab-iconWrapper': {
        marginRight: { xs: '4px', md: '8px' },
        marginBottom: '0',
        '& > *': {
          fontSize: { xs: '1.1rem', md: '1.25rem' },
        },
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        width: '0',
        height: '3px',
        background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
        borderRadius: '3px 3px 0 0',
        transition: 'all 0.2s ease-in-out',
        transform: 'translateX(-50%)',
      },
      '&.Mui-selected::after': {
        width: { xs: 'calc(100% - 16px)', md: 'calc(100% - 32px)' },
      },
      '&:hover::after': {
        width: { xs: 'calc(100% - 16px)', md: 'calc(100% - 32px)' },
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
      },
      '&.Mui-selected:hover::after': {
        background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
        opacity: 0.9,
      },
      '& .MuiTab-wrapper': {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '&.MuiTab-labelIcon': {
        minHeight: { xs: '52px', md: '48px' },
        '& .MuiTab-wrapper': {
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: '2px', sm: '0' },
        },
        '& .MuiTab-iconWrapper': {
          marginRight: { xs: '0', sm: '4px', md: '8px' },
          marginBottom: { xs: '2px', sm: '0' },
        },
        // Hide text labels on very small screens to save space
        '@media (max-width: 480px)': {
          '& .MuiTab-labelContainer': {
            display: 'none',
          },
          '& .MuiTab-iconWrapper': {
            marginRight: '0',
            marginBottom: '0',
          },
        },
      },
    },
  },
  tab: {
    minHeight: { xs: '52px', md: '48px' },
    height: { xs: '52px', md: '48px' },
    padding: { xs: '8px 12px', md: '0 24px' },
    margin: { xs: '0 1px', md: '0 2px' },
    minWidth: { xs: '80px', md: 'auto' },
    color: 'text.secondary',
    textTransform: 'none',
    fontSize: { xs: '0.8125rem', md: '0.9375rem' },
    fontWeight: 500,
    letterSpacing: '0.01em',
    position: 'relative',
    overflow: 'visible',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s ease-in-out',
    // Ensure proper touch targets on mobile
    '@media (pointer: coarse)': {
      minHeight: '56px',
      height: '56px',
      padding: '12px 16px',
    },
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.06)',
      color: 'primary.main',
    },
    '&.Mui-selected': {
      color: 'primary.main',
      backgroundColor: 'rgba(25, 118, 210, 0.12)',
    },
    '&:active': {
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
    },
    '& .MuiTab-iconWrapper': {
      marginRight: { xs: '4px', md: '8px' },
      marginBottom: '0',
      '& > *': {
        fontSize: { xs: '1.1rem', md: '1.25rem' },
      },
    },
    '& .MuiTab-wrapper': {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      flex: '1 1 auto',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '&.MuiTab-labelIcon': {
      minHeight: { xs: '52px', md: '48px' },
      '& .MuiTab-wrapper': {
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: '2px', sm: '0' },
      },
      '& .MuiTab-iconWrapper': {
        marginRight: { xs: '0', sm: '4px', md: '8px' },
        marginBottom: { xs: '2px', sm: '0' },
      },
      // Hide text labels on very small screens to save space
      '@media (max-width: 480px)': {
        '& .MuiTab-labelContainer': {
          display: 'none',
        },
        '& .MuiTab-iconWrapper': {
          marginRight: '0',
          marginBottom: '0',
        },
      },
    },
  },
  indicator: {
    height: '3px',
    borderRadius: '3px 3px 0 0',
    backgroundColor: 'primary.main',
    bottom: 0,
    top: 'auto',
    left: 0,
    right: 0,
    transform: 'none',
    transition: 'all 0.2s ease-in-out',
  },
};
