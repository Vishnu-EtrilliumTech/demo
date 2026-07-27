import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Collapse,
  IconButton,
  Box
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ExpandableRowProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  colSpan?: number;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  expandIconPosition?: 'start' | 'end';
  disabled?: boolean;
}

export const ExpandableRow: React.FC<ExpandableRowProps> = ({
  children,
  expandedContent,
  colSpan = 1,
  isExpanded: controlledExpanded,
  onToggle,
  expandIconPosition = 'end',
  disabled = false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    if (disabled) return;
    
    const newExpanded = !isExpanded;
    
    if (onToggle) {
      onToggle(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const ExpandIcon = isExpanded ? ExpandLessIcon : ExpandMoreIcon;

  return (
    <>
      <TableRow
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': disabled ? {} : {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleToggle}
      >
        {expandIconPosition === 'start' && (
          <TableCell sx={{ width: 48, p: 1 }}>
            <IconButton
              size="small"
              disabled={disabled}
              sx={{
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'
              }}
            >
              <ExpandIcon />
            </IconButton>
          </TableCell>
        )}
        
        {children}
        
        {expandIconPosition === 'end' && (
          <TableCell sx={{ width: 48, p: 1 }}>
            <IconButton
              size="small"
              disabled={disabled}
              sx={{
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'
              }}
            >
              <ExpandIcon />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={colSpan + (expandIconPosition ? 1 : 0)}
        >
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              {expandedContent}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// Utility component for expandable row content with consistent styling
export const ExpandableRowContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200'
      }}
    >
      {children}
    </Box>
  );
};