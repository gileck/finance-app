import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import type { FileInfo } from '@/apis/fileManagement/types';

interface FileListProps {
  files: FileInfo[];
  loading: boolean;
  onNavigateToFolder: (prefix: string, folderName: string) => void;
  onDeleteItem: (file: FileInfo) => void;
  onEditFile: (file: FileInfo) => void;
  onViewFile: (file: FileInfo) => void;
}

export const FileList = ({
  files,
  loading,
  onNavigateToFolder,
  onDeleteItem,
  onEditFile,
  onViewFile
}: FileListProps) => {
  if (loading) {
    return <CircularProgress />;
  }

  if (files.length === 0) {
    return <div>No files found in this directory.</div>;
  }

  return (
    <List>
      {files.map((file) => {
        // Extract filename from the key
        const keyParts = file.key.split('/');
        const fileName = keyParts[keyParts.length - 1] || file.key;
        // Extract prefix (directory path) from the key
        const prefix = file.key.substring(0, file.key.length - fileName.length);
        
        return (
          <ListItem
            key={file.key}
            sx={{
              borderBottom: '1px solid #eee',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            <ListItemIcon>
              {file.isFolder ? <FolderIcon color="primary" /> : <FileIcon color="info" />}
            </ListItemIcon>
            
            <ListItemText
              primary={fileName}
              secondary={file.isFolder ? 'Folder' : `File - ${file.size} bytes`}
              sx={{ cursor: file.isFolder ? 'pointer' : 'default' }}
              onClick={() => {
                if (file.isFolder) {
                  onNavigateToFolder(prefix, fileName);
                }
              }}
            />
            
            <div>
              {!file.isFolder && (
                <>
                  <Tooltip title="View">
                    <IconButton onClick={() => onViewFile(file)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEditFile(file)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              <Tooltip title="Delete">
                <IconButton onClick={() => onDeleteItem(file)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </div>
          </ListItem>
        );
      })}
    </List>
  );
};
