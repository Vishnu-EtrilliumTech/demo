import React, { useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import {
  Button,
  DataTable,
  Pagination,
  LoadingState,
  EmptyState,
  Input,
  Select,
  type Column,
} from "@/design-system";
import { CaseClient } from "@/app/organization/types/caseindex";
import { useCaseClients } from "../../hooks/useCaseClients";
import { useListQuery } from "@/hooks/useListQuery";
import AddClientModal from "@/components/modals/AddClientModal";
import EditClientModal from "@/components/modals/EditClientModal";

// Container props interface
interface ClientsTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  /** Show add/edit controls (resource ≥ Edit). Defaults to true. */
  canCreateOrEditResource?: boolean;
  /** Show delete controls (resource === Full). Defaults to true. */
  canDeleteResource?: boolean;
}

interface ClientsTabProps {
  clients: CaseClient[];
  loadingClients: boolean;
  clientSearchQuery: string;

  // Modal states
  addClientModalOpen: boolean;
  editClientModalOpen: boolean;
  clientToEdit: CaseClient | null;

  sortValue: string;
  onSortChange: (value: string) => void;

  onSetClientSearchQuery: (query: string) => void;
  onClientRowClick: (client: CaseClient) => void;

  onOpenAddClientModal: () => void;
  onCloseAddClientModal: () => void;
  onCloseEditClientModal: () => void;
  onRefreshClients: () => Promise<void>;

  organizationId: string;
  siteId: string;
  caseId: string;
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
}

// Presentation component
const ClientsTabPresentation: React.FC<ClientsTabProps> = ({
  clients,
  loadingClients,
  clientSearchQuery,
  addClientModalOpen,
  editClientModalOpen,
  clientToEdit,
  sortValue,
  onSortChange,
  onSetClientSearchQuery,
  onClientRowClick,
  onOpenAddClientModal,
  onCloseAddClientModal,
  onCloseEditClientModal,
  onRefreshClients,
  organizationId,
  siteId,
  caseId,
  canCreateOrEditResource,
  canDeleteResource,
}) => {
  // Filter clients based on search query (client-side)
  const filteredClients = clients.filter((client) => {
    const searchLower = clientSearchQuery.toLowerCase();
    return (
      client.fullName.toLowerCase().includes(searchLower) ||
      client.emailId.toLowerCase().includes(searchLower) ||
      client.phoneNumber.toString().includes(searchLower)
    );
  });

  const canOpen = canCreateOrEditResource || canDeleteResource;

  const columns: Column<CaseClient>[] = [
    {
      key: "name",
      header: "Client Name",
      render: (c) => (
        <div className="case-row-title">
          <b>{c.fullName}</b>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (c) => c.emailId },
    { key: "phone", header: "Phone", render: (c) => String(c.phoneNumber) },
    { key: "remarks", header: "Remarks", render: (c) => c.remarks || "-" },
  ];

  return (
    <div>
      <div className="toolbar">
        {canCreateOrEditResource && (
          <Button variant="primary" icon={UserPlus} onClick={onOpenAddClientModal}>
            Add Client
          </Button>
        )}
        <div className="search">
          <Search aria-hidden />
          <Input
            type="text"
            value={clientSearchQuery}
            onChange={(e) => onSetClientSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
          />
        </div>
        <div className="selectbox">
          <Select aria-label="Sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default sort</option>
            <option value="name:asc">Name A→Z</option>
            <option value="name:desc">Name Z→A</option>
          </Select>
        </div>
      </div>

      {loadingClients ? (
        <LoadingState message="Loading clients…" />
      ) : clients.length > 0 ? (
        filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found matching your search"
            description="Try adjusting your search criteria."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredClients}
            getRowKey={(c) => String(c.id)}
            onRowClick={canOpen ? (c) => onClientRowClick(c) : undefined}
          />
        )
      ) : (
        <EmptyState
          icon={Users}
          title="No clients assigned to this case"
          description={
            canCreateOrEditResource
              ? "Add the first client for this case."
              : "No clients have been assigned to this case."
          }
          action={
            canCreateOrEditResource ? (
              <Button variant="primary" icon={UserPlus} onClick={onOpenAddClientModal}>
                Add Client
              </Button>
            ) : undefined
          }
        />
      )}

      <AddClientModal
        open={addClientModalOpen}
        onClose={onCloseAddClientModal}
        onSuccess={async () => {
          await onRefreshClients();
          onCloseAddClientModal();
        }}
        organizationId={organizationId}
        siteId={siteId}
        caseId={caseId}
      />

      {clientToEdit ? (
        <EditClientModal
          open={editClientModalOpen}
          onClose={onCloseEditClientModal}
          onSuccess={async () => {
            await onRefreshClients();
            onCloseEditClientModal();
          }}
          organizationId={organizationId}
          siteId={siteId}
          caseId={caseId}
          clientData={clientToEdit}
          canDelete={canDeleteResource}
          onDeleteSuccess={async () => {
            await onRefreshClients();
            onCloseEditClientModal();
          }}
        />
      ) : null}
    </div>
  );
};

// Container component
export const ClientsTab: React.FC<ClientsTabContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource = true,
  canDeleteResource = true,
}) => {
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<CaseClient | null>(null);

  const { params, state, setPage, setSort, clearSort } = useListQuery({
    defaultSort: { sortBy: "name", sortDirection: "asc" },
    sortableFields: ["name"],
    filterKeys: [],
  });
  const clientsHook = useCaseClients(organizationId, siteId, caseId, params);
  const meta = clientsHook.clientsMeta;

  const handleOpenAddClientModal = () => setAddClientModalOpen(true);
  const handleCloseAddClientModal = () => setAddClientModalOpen(false);
  const handleOpenEditClientModal = (client: CaseClient) => {
    setClientToEdit(client);
    setEditClientModalOpen(true);
  };
  const handleCloseEditClientModal = () => {
    setEditClientModalOpen(false);
    setClientToEdit(null);
  };
  const handleClientRowClick = (client: CaseClient) => {
    if (!canCreateOrEditResource && !canDeleteResource) return;
    handleOpenEditClientModal(client);
  };

  const sortValue = state.sortBy ? `${state.sortBy}:${state.sortDirection ?? "asc"}` : "";
  const handleSortChange = (val: string) => {
    if (!val) {
      clearSort();
      return;
    }
    const [field, dir] = val.split(":");
    setSort(field, dir as "asc" | "desc");
  };

  return (
    <>
      <ClientsTabPresentation
        clients={clientsHook.clients}
        loadingClients={clientsHook.loadingClients}
        clientSearchQuery={clientsHook.clientSearchQuery}
        addClientModalOpen={addClientModalOpen}
        editClientModalOpen={editClientModalOpen}
        clientToEdit={clientToEdit}
        sortValue={sortValue}
        onSortChange={handleSortChange}
        onSetClientSearchQuery={clientsHook.setClientSearchQuery}
        onClientRowClick={handleClientRowClick}
        onOpenAddClientModal={handleOpenAddClientModal}
        onCloseAddClientModal={handleCloseAddClientModal}
        onCloseEditClientModal={handleCloseEditClientModal}
        onRefreshClients={clientsHook.refetchClients}
        organizationId={organizationId}
        siteId={siteId}
        caseId={caseId}
        canCreateOrEditResource={canCreateOrEditResource}
        canDeleteResource={canDeleteResource}
      />
      {meta && meta.totalCount > 0 && (
        <div className="tbl-foot" style={{ marginTop: 14 }}>
          <span className="cnt">
            {meta.totalCount} client{meta.totalCount === 1 ? "" : "s"}
          </span>
          <Pagination
            page={state.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            disabled={clientsHook.loadingClients}
          />
        </div>
      )}
    </>
  );
};
