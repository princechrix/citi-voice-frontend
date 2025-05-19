"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { formatDate, formatRole } from "@/lib/utils";
import Image from "next/image";

interface AgencyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Agency {
  id: string;
  name: string;
  acronym: string;
  description: string;
  isActive: boolean;
  users: AgencyUser[];
  complaints: Array<any>;
  logoUrl: string | null;
  createdAt: string;
}

interface NewAgency {
  name: string;
  acronym: string;
  description: string;
  adminName: string;
  adminEmail: string;
  createAdmin: boolean;
  logo?: File;
}

interface AgencyWithEdit extends Agency {
  logo?: File;
}

// Mock data
const mockAgencies: Agency[] = [
  {
    id: "1",
    name: "Agency 1",
    description: "Description for Agency 1",
    acronym: "A1",
    isActive: true,
    users: [],
    complaints: [],
    logoUrl: null,
    createdAt: "2024-04-01T12:00:00",
  },
  {
    id: "2",
    name: "Agency 2",
    description: "Description for Agency 2",
    acronym: "A2",
    isActive: true,
    users: [],
    complaints: [],
    logoUrl: null,
    createdAt: "2024-04-02T12:00:00",
  },
  {
    id: "3",
    name: "Agency 3",
    description: "Description for Agency 3",
    acronym: "A3",
    isActive: true,
    users: [],
    complaints: [],
    logoUrl: null,
    createdAt: "2024-04-03T12:00:00",
  },
];

const ITEMS_PER_PAGE = 10;

const Agencies = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
  const [agencyToEdit, setAgencyToEdit] = useState<AgencyWithEdit | null>(null);
  const [newAgency, setNewAgency] = useState<NewAgency>({
    name: "",
    acronym: "",
    description: "",
    adminName: "",
    adminEmail: "",
    createAdmin: false,
    logo: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "AGENCY_USER",
  });

  const { getter, poster, patcher, deleter } = useApi();
  const queryClient = useQueryClient();

  // Fetch agencies
  const { data: agencies = [], isLoading } = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: async () => {
      try {
        const response = await getter("/agency");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching agencies:", error);
        return [];
      }
    },
  });

  // Add users query
  const { data: agencyUsers = [], isLoading: isLoadingUsers } = useQuery<AgencyUser[]>({
    queryKey: ["agency-users", selectedAgency?.id],
    queryFn: async () => {
      if (!selectedAgency?.id) return [];
      try {
        const response = await getter(`/users/agency/${selectedAgency.id}`);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching agency users:", error);
        return [];
      }
    },
    enabled: !!selectedAgency?.id,
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData: Omit<NewAgency, 'adminName' | 'adminEmail' | 'createAdmin'>) => {
      let logoUrl = '';
      
      if (agencyData.logo) {
        const formData = new FormData();
        formData.append('file', agencyData.logo);
        const uploadResponse = await poster("/file/upload", formData);
        console.log(uploadResponse);
        logoUrl = uploadResponse.url;
      }

      const response = await poster("/agency", {
        ...agencyData,
        logoUrl: logoUrl,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agency created successfully");
      setIsDialogOpen(false);
      setNewAgency({
        name: "",
        acronym: "",
        description: "",
        adminName: "",
        adminEmail: "",
        createAdmin: false,
        logo: undefined,
      });
      return data;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create agency");
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async ({ agencyId, adminData }: { agencyId: string; adminData: { name: string; email: string } }) => {
      const response = await poster("/auth/register", {
        ...adminData,
        role: "AGENCY_ADMIN",
        agencyId,
        secretKey: process.env.NEXT_PUBLIC_CREATE_USER_SECRET_KEY,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Agency admin created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create agency admin");
    },
  });

  // Toggle agency status mutation
  const toggleAgencyMutation = useMutation({
    mutationFn: async ({ agencyId, isActive }: { agencyId: string; isActive: boolean }) => {
      const response = await patcher(`/agency/${agencyId}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agency status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update agency status");
    },
  });

  // Delete agency mutation
  const deleteAgencyMutation = useMutation({
    mutationFn: async (agencyId: string) => {
      const response = await deleter(`/agency/${agencyId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agency deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete agency");
    },
  });

  // Edit agency mutation
  const editAgencyMutation = useMutation({
    mutationFn: async ({ agencyId, agencyData }: { agencyId: string; agencyData: Partial<Agency> & { logo?: File } }) => {
      let logoUrl = agencyData.logoUrl;
      
      // Only upload if there's a new logo file
      if (agencyData.logo) {
        const formData = new FormData();
        formData.append('file', agencyData.logo);
        const uploadResponse = await poster("/file/upload", formData);
        logoUrl = uploadResponse.url;
      }

      // Remove the logo file from the payload as it's not needed in the API
      const { logo, ...updateData } = agencyData;

      const response = await patcher(`/agency/${agencyId}`, {
        ...updateData,
        logoUrl,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agency updated successfully");
      setIsEditDialogOpen(false);
      setAgencyToEdit(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update agency");
    },
  });

  // Add create user mutation
  const createUserMutation = useMutation({
    mutationFn: async ({ agencyId, userData }: { agencyId: string; userData: { name: string; email: string; role: string } }) => {
      const response = await poster("/auth/register", {
        ...userData,
        agencyId,
        secretKey: process.env.NEXT_PUBLIC_CREATE_USER_SECRET_KEY,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-users"] });
      toast.success("User created successfully");
      setIsCreateUserDialogOpen(false);
      setNewUser({
        name: "",
        email: "",
        role: "AGENCY_USER",
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create user");
    },
  });

  const handleAddAgency = async () => {
    try {
      const { adminName, adminEmail, createAdmin, ...agencyData } = newAgency;
      const createdAgency = await createAgencyMutation.mutateAsync(agencyData);
      
      if (createAdmin && adminName && adminEmail) {
        await createAdminMutation.mutateAsync({
          agencyId: createdAgency.id,
          adminData: {
            name: adminName,
            email: adminEmail,
          },
        });
      }
    } catch (error) {
      console.error("Error in agency creation process:", error);
    }
  };

  const handleEditAgency = (agency: Agency) => {
    setAgencyToEdit(agency);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!agencyToEdit) return;
    
    // Only include logo in the update if it's a new file
    const updateData = {
      name: agencyToEdit.name,
      description: agencyToEdit.description,
      acronym: agencyToEdit.acronym,
      logoUrl: agencyToEdit.logoUrl,
      ...(agencyToEdit.logo && { logo: agencyToEdit.logo }),
    };

    editAgencyMutation.mutate({
      agencyId: agencyToEdit.id,
      agencyData: updateData,
    });
  };

  const handleDeleteAgency = (agency: Agency) => {
    setAgencyToDelete(agency);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!agencyToDelete) return;
    deleteAgencyMutation.mutate(agencyToDelete.id);
    setIsDeleteDialogOpen(false);
    setAgencyToDelete(null);
  };

  const handleToggleAgency = (agencyId: string, currentStatus: boolean) => {
    toggleAgencyMutation.mutate({ agencyId, isActive: !currentStatus });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAgencies(agencies.map((agency) => agency.id));
    } else {
      setSelectedAgencies([]);
    }
  };

  const handleSelectAgency = (agencyId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgencies([...selectedAgencies, agencyId]);
    } else {
      setSelectedAgencies(selectedAgencies.filter((id) => id !== agencyId));
    }
  };

  const handleExport = () => {
    const filteredData = agencies
      .filter((agency) => {
        const matchesSearch =
          agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agency.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agency.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          filters.status === "ALL" ||
          (filters.status === "ACTIVE" && agency.isActive) ||
          (filters.status === "INACTIVE" && !agency.isActive);

        return matchesSearch && matchesStatus;
      })
      .map((agency) => ({
        ID: agency.id,
        Name: agency.name,
        Acronym: agency.acronym,
        Description: agency.description,
        Status: agency.isActive ? "Active" : "Inactive",
      }));

    const csvContent = [
      Object.keys(filteredData[0]).join(","),
      ...filteredData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `agencies_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filters.status === "ALL" ||
      (filters.status === "ACTIVE" && agency.isActive) ||
      (filters.status === "INACTIVE" && !agency.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAgencies = filteredAgencies.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agencies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your citivoice&apos;s agencies and their details.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Agency</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Agency</DialogTitle>
              <DialogDescription>
                Enter the details for the new agency.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {newAgency.logo ? (
                    <>
                      <Image
                        src={URL.createObjectURL(newAgency.logo)}
                        alt="Agency logo preview"
                        className="w-full h-full object-cover"
                        width={128}
                        height={128}
                      />
                      <button
                        onClick={() => setNewAgency({ ...newAgency, logo: undefined })}
                        className="absolute top-1 z-10 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload logo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewAgency({ ...newAgency, logo: file });
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended size: 256x256px
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agency Name
                </label>
                <Input
                  value={newAgency.name}
                  onChange={(e) =>
                    setNewAgency({ ...newAgency, name: e.target.value })
                  }
                  placeholder="Enter agency name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Acronym
                </label>
                <Input
                  value={newAgency.acronym}
                  onChange={(e) =>
                    setNewAgency({ ...newAgency, acronym: e.target.value })
                  }
                  placeholder="Enter agency acronym"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Input
                  value={newAgency.description}
                  onChange={(e) =>
                    setNewAgency({ ...newAgency, description: e.target.value })
                  }
                  placeholder="Enter agency description"
                />
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="create-admin"
                  checked={newAgency.createAdmin}
                  onCheckedChange={(checked) =>
                    setNewAgency({ ...newAgency, createAdmin: checked as boolean })
                  }
                />
                <label
                  htmlFor="create-admin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create Agency Admin
                </label>
              </div>
              {newAgency.createAdmin && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700">Agency Admin Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin Name
                      </label>
                      <Input
                        value={newAgency.adminName}
                        onChange={(e) =>
                          setNewAgency({ ...newAgency, adminName: e.target.value })
                        }
                        placeholder="Enter admin name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin Email
                      </label>
                      <Input
                        value={newAgency.adminEmail}
                        onChange={(e) =>
                          setNewAgency({ ...newAgency, adminEmail: e.target.value })
                        }
                        placeholder="Enter admin email"
                        type="email"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAgency}>Add Agency</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedAgencies.length === paginatedAgencies.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Acronym</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedAgencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No agencies found
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAgencies.includes(agency.id)}
                      onCheckedChange={(checked) =>
                        handleSelectAgency(agency.id, checked as boolean)
                      }
                      aria-label={`Select ${agency.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {agency.logoUrl ? (
                          <Image
                            src={agency.logoUrl}
                            alt={`${agency.name} logo`}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="text-[12px] font-semibold text-muted-foreground">
                            {agency.acronym}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-muted-foreground">{agency.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{agency.acronym}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                        setSelectedAgency(agency);
                        setIsUsersDialogOpen(true);
                      }}
                    >
                      {agency.users.length} {agency.users.length === 1 ? 'user' : 'users'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={agency.isActive}
                      onCheckedChange={() => handleToggleAgency(agency.id, agency.isActive)}
                      disabled={toggleAgencyMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAgency(agency)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAgency(agency)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredAgencies.length)} of{" "}
          {filteredAgencies.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Agency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {agencyToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteAgencyMutation.isPending}
            >
              {deleteAgencyMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
            <DialogDescription>
              Update the agency&apos;s information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {agencyToEdit?.logoUrl || agencyToEdit?.logo ? (
                  <>
                    <Image
                      src={agencyToEdit.logo ? URL.createObjectURL(agencyToEdit.logo) : agencyToEdit.logoUrl || ''}
                      alt="Agency logo preview"
                      className="w-full h-full object-cover"
                      width={128}
                      height={128}
                    />
                    <button
                      onClick={() => setAgencyToEdit(prev => prev ? {...prev, logoUrl: null, logo: undefined} : null)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Upload logo</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && agencyToEdit) {
                      setAgencyToEdit({ ...agencyToEdit, logo: file });
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended size: 256x256px
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={agencyToEdit?.name || ""}
                onChange={(e) => setAgencyToEdit(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Enter agency name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Acronym
              </label>
              <Input
                value={agencyToEdit?.acronym || ""}
                onChange={(e) => setAgencyToEdit(prev => prev ? {...prev, acronym: e.target.value} : null)}
                placeholder="Enter agency acronym"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                value={agencyToEdit?.description || ""}
                onChange={(e) => setAgencyToEdit(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="Enter agency description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={editAgencyMutation.isPending}
            >
              {editAgencyMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="!max-w-[60%] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center pt-[10px]">
              <div>
                <DialogTitle>Users in {selectedAgency?.name}</DialogTitle>
                <DialogDescription>
                  List of all users associated with this agency
                </DialogDescription>
              </div>
              <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                Add User
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {isLoadingUsers ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading users...
              </div>
            ) : agencyUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users found in this agency
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={user.isVerified ? "default" : "destructive"}
                          >
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt, false)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user for {selectedAgency?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter user email"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Agency Staff</SelectItem>
                  <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAgency) {
                  createUserMutation.mutate({
                    agencyId: selectedAgency.id,
                    userData: newUser,
                  });
                }
              }}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agencies;