import { Box, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EmptyState } from './EmptyState';

// Thin wrapper around MUI X DataGrid pre-wired for our server-side pagination
// shape ({items, meta:{page,limit,total}}) so list pages don't repeat the
// page/pageSize <-> 1-indexed backend `page` conversion each time.
export function DataTable({
  rows,
  columns,
  loading,
  meta,
  onPageModelChange,
  emptyTitle = 'No records found',
  emptyDescription,
  getRowId,
  autoHeight = true,
  disableRowSelectionOnClick = true,
  onRowClick,
  ...rest
}) {
  if (!loading && rows.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId || ((row) => row._id)}
        autoHeight={autoHeight}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        onRowClick={onRowClick}
        paginationMode={meta ? 'server' : 'client'}
        rowCount={meta?.total ?? undefined}
        paginationModel={meta ? { page: (meta.page || 1) - 1, pageSize: meta.limit || 10 } : undefined}
        onPaginationModelChange={
          meta && onPageModelChange
            ? (model) => onPageModelChange({ page: model.page + 1, limit: model.pageSize })
            : undefined
        }
        pageSizeOptions={[10, 20, 50]}
        sx={{ border: 'none', minWidth: 640 }}
        {...rest}
      />
    </Box>
  );
}
