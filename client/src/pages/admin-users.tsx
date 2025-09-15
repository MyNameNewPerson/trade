import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Eye, 
  UserX, 
  UserCheck,
  Trash2,
  Shield,
  User,
  Calendar,
  Mail,
  Activity,
  Download
} from "lucide-react";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserDetailModal } from "@/components/user-detail-modal";
import { AddUserModal } from "@/components/add-user-modal";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  page: number;
  limit: number;
}

export function AdminUsersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // State for filters and pagination
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 25
  });

  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Modal states
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users with React Query
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.role !== 'all') params.append('role', filters.role);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include', // Use session-based auth
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return response.json();
    },
    retry: 1,
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isActive });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Status Updated",
        description: `User has been ${variables.isActive ? 'activated' : 'deactivated'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setUserToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Change user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { role });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Role Updated",
        description: `User role changed to ${variables.role}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Bulk activate users mutation
  const bulkActivateMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map(async userId => {
          const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isActive: true });
          return await response.json();
        })
      );
      return results;
    },
    onSuccess: (_, userIds) => {
      toast({
        title: "Users Activated",
        description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} activated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUsers(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate some users",
        variant: "destructive",
      });
    },
  });

  // Bulk deactivate users mutation
  const bulkDeactivateMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map(async userId => {
          const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isActive: false });
          return await response.json();
        })
      );
      return results;
    },
    onSuccess: (_, userIds) => {
      toast({
        title: "Users Deactivated",
        description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} deactivated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUsers(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate some users",
        variant: "destructive",
      });
    },
  });

  // Export users mutation
  const exportUsersMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/users/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to export users');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Users data has been exported successfully",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export users data",
        variant: "destructive",
      });
    },
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = usersData?.totalPages || 1;

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Handle individual selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Get user display name
  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.email.split('@')[0];
  };

  // Get user initials
  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const selectedCount = selectedUsers.size;

  return (
    <AdminLayout
      title="Users Management"
      currentSection="users"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Users Management' }
      ]}
    >
      <div className="space-y-6">
        {/* Header with Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage user accounts, roles and access permissions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportUsersMutation.mutate()}
              disabled={exportUsersMutation.isPending}
              data-testid="button-export-users"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportUsersMutation.isPending ? 'Exporting...' : 'Export'}
            </Button>
            
            <Button
              onClick={() => setShowAddUserModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-add-user"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.filter(u => {
                      const created = new Date(u.createdAt);
                      const thisMonth = new Date();
                      return created.getMonth() === thisMonth.getMonth() && 
                             created.getFullYear() === thisMonth.getFullYear();
                    }).length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-user-search"
                  />
                </div>

                {/* Role Filter */}
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value, page: 1 }))}
                >
                  <SelectTrigger className="w-40" data-testid="filter-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                >
                  <SelectTrigger className="w-40" data-testid="filter-user-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* Items per page */}
                <Select
                  value={filters.limit.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => bulkActivateMutation.mutate(Array.from(selectedUsers))}
                    disabled={bulkActivateMutation.isPending}
                    data-testid="button-bulk-activate"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    {bulkActivateMutation.isPending ? 'Activating...' : 'Activate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => bulkDeactivateMutation.mutate(Array.from(selectedUsers))}
                    disabled={bulkDeactivateMutation.isPending}
                    data-testid="button-bulk-deactivate"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    {bulkDeactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Users Table */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Failed to load users</div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filters.search ? 'No users match your search criteria' : 'Get started by adding your first user'}
                </p>
                {!filters.search && (
                  <Button onClick={() => setShowAddUserModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={users.length > 0 && selectedUsers.size === users.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                          aria-label={`Select ${getUserDisplayName(user)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white" data-testid={`user-name-${user.id}`}>
                              {getUserDisplayName(user)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`user-email-${user.id}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          data-testid={`user-role-${user.id}`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? 'secondary' : 'outline'}
                          className={user.isActive ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-red-600 bg-red-100 dark:bg-red-900/20'}
                          data-testid={`user-status-${user.id}`}
                        >
                          {user.isActive ? (
                            <>
                              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                              Active
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400" data-testid={`user-registration-${user.id}`}>
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-gray-400" data-testid={`user-last-login-${user.id}`}>
                          {formatDate(user.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              data-testid={`user-actions-${user.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => setUserToView(user)}
                              data-testid={`action-view-${user.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => setUserToEdit(user)}
                              data-testid={`action-edit-${user.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ 
                                userId: user.id, 
                                isActive: !user.isActive 
                              })}
                              data-testid={`action-toggle-status-${user.id}`}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => changeRoleMutation.mutate({ 
                                userId: user.id, 
                                role: user.role === 'admin' ? 'user' : 'admin'
                              })}
                              data-testid={`action-change-role-${user.id}`}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make {user.role === 'admin' ? 'User' : 'Admin'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => setUserToDelete(user)}
                              className="text-red-600 dark:text-red-400"
                              data-testid={`action-delete-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalUsers)} of {totalUsers} users
                </div>
                
                <div className="flex items-center space-x-2" data-testid="pagination-users">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === filters.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add User Modal */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />

        {/* User Detail Modal */}
        <UserDetailModal
          user={userToView}
          isOpen={!!userToView}
          onClose={() => setUserToView(null)}
          onUserUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete user "{userToDelete ? getUserDisplayName(userToDelete) : ''}"?
                This action cannot be undone and will permanently remove all user data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}