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
  MoreHorizontal,
  Pencil,
  Trash2,
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
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  primaryAgencyId: string | null;
  primaryAgency?: {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string | null;
    description: string;
  } | null;
  secondaryAgencies?: Array<{
    id: string;
    name: string;
    acronym: string;
    logoUrl: string | null;
  }>;
}

interface Agency {
  id: string;
  name: string;
  acronym: string;
  description: string;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
}

interface NewCategory {
  name: string;
  description: string;
  primaryAgencyId: string;
  secondaryAgencies: string[];
}

const ITEMS_PER_PAGE = 10;

const Categories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: "",
    description: "",
    primaryAgencyId: "",
    secondaryAgencies: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSecondaryAgencies, setShowSecondaryAgencies] = useState(false);
  const [showEditSecondaryAgencies, setShowEditSecondaryAgencies] = useState(false);

  const { getter, poster, patcher, deleter } = useApi();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await getter("/category");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  // Fetch agencies
  const { data: agencies = [] } = useQuery<Agency[]>({
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

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: NewCategory) => {
      const response = await poster("/category", categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setIsDialogOpen(false);
      setNewCategory({
        name: "",
        description: "",
        primaryAgencyId: "",
        secondaryAgencies: [],
      });
      setShowSecondaryAgencies(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create category");
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await deleter(`/category/${categoryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete category");
    },
  });

  // Edit category mutation
  const editCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, categoryData }: { categoryId: string; categoryData: Partial<NewCategory> }) => {
      try {
        const response = await patcher(`/category/${categoryId}`, categoryData);
        return response.data;
      } catch (error: any) {
        // console.error('Edit category error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      setIsEditDialogOpen(false);
      setCategoryToEdit(null);
    },
    onError: (error: any) => {
      // console.error('Edit category error details:', {
      //   status: error?.response?.status,
      //   data: error?.response?.data,
      //   message: error?.message
      // });
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update category";
      const errorType = error?.response?.data?.error || error?.response?.statusText || "Error";
      
      toast.error(errorMessage, {
        description: errorType,
        duration: 5000,
      });
    },
  });

  const handleAddCategory = () => {
    createCategoryMutation.mutate(newCategory);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setShowEditSecondaryAgencies((category.secondaryAgencies?.length ?? 0) > 0);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!categoryToEdit) return;
    editCategoryMutation.mutate({
      categoryId: categoryToEdit.id,
      categoryData: {
        name: categoryToEdit.name,
        description: categoryToEdit.description || "",
        primaryAgencyId: categoryToEdit.primaryAgencyId || "",
        secondaryAgencies: categoryToEdit.secondaryAgencies
          ?.map(agency => agency.id)
          .filter(id => id !== categoryToEdit.primaryAgencyId) || [],
      },
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map((category) => category.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category and assign agencies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label htmlFor="category-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  id="category-description"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <label htmlFor="category-primary-agency" className="block text-sm font-medium text-gray-700">
                  Primary Agency
                </label>
                <Select
                  value={newCategory.primaryAgencyId}
                  onValueChange={(value) =>
                    setNewCategory({ ...newCategory, primaryAgencyId: value })
                  }
                >
                  <SelectTrigger id="category-primary-agency" className="w-full">
                    <SelectValue placeholder="Select primary agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="category-secondary-agencies-toggle"
                  checked={showSecondaryAgencies}
                  onCheckedChange={setShowSecondaryAgencies}
                />
                <label htmlFor="category-secondary-agencies-toggle" className="text-sm font-medium text-gray-700">
                  Add Secondary Agencies
                </label>
              </div>
              {showSecondaryAgencies && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Secondary Agencies
                  </label>
                  {agencies
                    .filter(agency => agency.id !== newCategory.primaryAgencyId)
                    .map((agency) => (
                      <div key={agency.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`secondary-agency-${agency.id}`}
                          checked={newCategory.secondaryAgencies.includes(agency.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewCategory({
                                ...newCategory,
                                secondaryAgencies: [...newCategory.secondaryAgencies, agency.id],
                              });
                            } else {
                              setNewCategory({
                                ...newCategory,
                                secondaryAgencies: newCategory.secondaryAgencies.filter(
                                  (id) => id !== agency.id
                                ),
                              });
                            }
                          }}
                        />
                        <label htmlFor={`secondary-agency-${agency.id}`} className="text-sm">{agency.name}</label>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedCategories.length === paginatedCategories.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Primary Agency</TableHead>
              <TableHead>Secondary Agencies</TableHead>
              <TableHead>Created At</TableHead>
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
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCategory(category.id, checked as boolean)
                      }
                      aria-label={`Select ${category.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.description || "No description"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.primaryAgency ? (
                      <HoverCard>
                        <HoverCardTrigger>
                          <Badge variant="secondary" className="cursor-help">
                            {category.primaryAgency.name}
                          </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {category.primaryAgency?.logoUrl ? (
                                  <Image
                                    src={category.primaryAgency.logoUrl}
                                    alt={`${category.primaryAgency.name} logo`}
                                    className="w-full h-full object-cover"
                                    width={32}
                                    height={32}
                                  />
                                ) : (
                                  <div className="text-[10px] font-semibold text-muted-foreground">
                                    {category.primaryAgency?.acronym}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">
                                  {category.primaryAgency.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {category.primaryAgency.acronym}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {category.primaryAgency.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.secondaryAgencies?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {category.secondaryAgencies.length > 1 ? (
                          <>
                            <Badge variant="outline">
                              {category.secondaryAgencies[0].name}
                            </Badge>
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge variant="outline" className="bg-muted cursor-help">
                                  +{category.secondaryAgencies.length - 1}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Secondary Agencies</h4>
                                  <div className="space-y-2">
                                    {category.secondaryAgencies.slice(1).map((agency) => (
                                      <div key={agency.id} className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                          {agency.logoUrl ? (
                                            <Image
                                              src={agency.logoUrl}
                                              alt={`${agency.name} logo`}
                                              className="w-full h-full object-cover"
                                              width={32}
                                              height={32}
                                            />
                                          ) : (
                                            <div className="text-[10px] font-semibold text-muted-foreground">
                                              {agency.acronym}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-semibold">
                                            {agency.name}
                                          </h4>
                                          <p className="text-xs text-muted-foreground">
                                            {agency.acronym}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </>
                        ) : (
                          <Badge variant="outline">
                            {category.secondaryAgencies[0].name}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(category.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCategory(category)}
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
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredCategories.length)} of{" "}
          {filteredCategories.length} results
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete.id);
                }
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information and agency assignments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="edit-category-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="edit-category-name"
                value={categoryToEdit?.name || ""}
                onChange={(e) =>
                  setCategoryToEdit((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <label htmlFor="edit-category-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="edit-category-description"
                value={categoryToEdit?.description || ""}
                onChange={(e) =>
                  setCategoryToEdit((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <label htmlFor="edit-category-primary-agency" className="block text-sm font-medium text-gray-700">
                Primary Agency
              </label>
              <Select
                value={categoryToEdit?.primaryAgencyId || ""}
                onValueChange={(value) =>
                  setCategoryToEdit((prev) =>
                    prev ? { ...prev, primaryAgencyId: value } : null
                  )
                }
              >
                <SelectTrigger id="edit-category-primary-agency" className="w-full">
                  <SelectValue placeholder="Select primary agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-category-secondary-agencies-toggle"
                checked={showEditSecondaryAgencies}
                onCheckedChange={(checked) => {
                  setShowEditSecondaryAgencies(checked);
                  if (!checked && categoryToEdit) {
                    setCategoryToEdit({
                      ...categoryToEdit,
                      secondaryAgencies: []
                    });
                  }
                }}
              />
              <label htmlFor="edit-category-secondary-agencies-toggle" className="text-sm font-medium text-gray-700">
                Add Secondary Agencies
              </label>
            </div>
            {showEditSecondaryAgencies && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Secondary Agencies
                </label>
                {agencies
                  .filter(agency => agency.id !== categoryToEdit?.primaryAgencyId)
                  .map((agency) => (
                    <div key={agency.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-secondary-agency-${agency.id}`}
                        checked={categoryToEdit?.secondaryAgencies?.some(
                          (a) => a.id === agency.id
                        )}
                        onCheckedChange={(checked) => {
                          if (!categoryToEdit) return;
                          if (checked) {
                            setCategoryToEdit({
                              ...categoryToEdit,
                              secondaryAgencies: [
                                ...(categoryToEdit.secondaryAgencies || []),
                                agency,
                              ],
                            });
                          } else {
                            setCategoryToEdit({
                              ...categoryToEdit,
                              secondaryAgencies: (categoryToEdit.secondaryAgencies || []).filter(
                                (a) => a.id !== agency.id
                              ),
                            });
                          }
                        }}
                      />
                      <label htmlFor={`edit-secondary-agency-${agency.id}`} className="text-sm">{agency.name}</label>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editCategoryMutation.isPending}
            >
              {editCategoryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;