import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X,
  Edit,
  Mail,
  Calendar,
  Shield,
  User,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

interface UserStats {
  totalOrders: number;
  totalVolume: string;
  lastLoginAt: string | null;
  accountValue: string;
}

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

interface EditFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export function UserDetailModal({ user, isOpen, onClose, onUserUpdated }: UserDetailModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isActive: true,
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  // Fetch detailed user stats (with fallback mock data)
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'user-stats', user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!user) throw new Error('No user');
      
      // Mock user stats for now since the API endpoint doesn't exist yet
      // TODO: Replace with real API call when /api/admin/users/:id/stats is implemented
      return {
        totalOrders: Math.floor(Math.random() * 50),
        totalVolume: (Math.random() * 10000).toFixed(2),
        lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        accountValue: (Math.random() * 5000).toFixed(2),
      };
    },
    enabled: !!user && isOpen,
    retry: 1,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<EditFormData>) => {
      if (!user) throw new Error('No user');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-stats', user?.id] });
      setIsEditing(false);
      if (onUserUpdated) onUserUpdated();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.email.split('@')[0];
  };

  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(value) || 0);
  };

  const handleSave = () => {
    const changes: Partial<EditFormData> = {};
    
    if (editForm.email !== user.email) changes.email = editForm.email;
    if (editForm.firstName !== (user.firstName || '')) changes.firstName = editForm.firstName;
    if (editForm.lastName !== (user.lastName || '')) changes.lastName = editForm.lastName;
    if (editForm.role !== user.role) changes.role = editForm.role;
    if (editForm.isActive !== user.isActive) changes.isActive = editForm.isActive;

    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }

    updateUserMutation.mutate(changes);
  };

  const handleCancel = () => {
    setEditForm({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-user-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl" data-testid="modal-user-name">
                  {getUserDisplayName(user)}
                </DialogTitle>
                <DialogDescription className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span data-testid="modal-user-email">{user.email}</span>
                </DialogDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    data-testid="modal-user-role"
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
                  <Badge 
                    variant={user.isActive ? 'secondary' : 'outline'}
                    className={user.isActive ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-red-600 bg-red-100 dark:bg-red-900/20'}
                    data-testid="modal-user-status"
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-user"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? <Skeleton className="h-6 w-8" /> : userStats?.totalOrders || 0}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(userStats?.totalVolume || '0')}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Value</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(userStats?.accountValue || '0')}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {statsLoading ? <Skeleton className="h-4 w-20" /> : 
                          userStats?.lastLoginAt ? formatDate(userStats.lastLoginAt).split(',')[0] : 'Never'
                        }
                      </p>
                    </div>
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Personal and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email">Email Address</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="input-edit-email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        data-testid="input-edit-firstName"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        data-testid="input-edit-lastName"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-active"
                        checked={editForm.isActive}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-edit-active"
                      />
                      <Label htmlFor="edit-active">Account Active</Label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Email</Label>
                      <p className="text-sm font-medium" data-testid="display-email">{user.email}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Role</Label>
                      <p className="text-sm font-medium" data-testid="display-role">{user.role}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">First Name</Label>
                      <p className="text-sm font-medium" data-testid="display-firstName">
                        {user.firstName || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Last Name</Label>
                      <p className="text-sm font-medium" data-testid="display-lastName">
                        {user.lastName || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Registration Date</Label>
                      <p className="text-sm font-medium flex items-center space-x-1" data-testid="display-registration">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(user.createdAt)}</span>
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Last Updated</Label>
                      <p className="text-sm font-medium flex items-center space-x-1" data-testid="display-updated">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(user.updatedAt)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>User activity and order history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Activity History</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Activity tracking will be implemented in future updates
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage user account preferences and security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.isActive ? 'Account is active' : 'Account is deactivated'}
                      </p>
                    </div>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(checked) => {
                        updateUserMutation.mutate({ isActive: checked });
                      }}
                      disabled={updateUserMutation.isPending}
                      data-testid="switch-account-status"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Admin Privileges</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Grant or revoke administrative access
                      </p>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(value) => {
                        updateUserMutation.mutate({ role: value });
                      }}
                    >
                      <SelectTrigger className="w-32" data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="border-t pt-6">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <p className="font-medium text-red-900 dark:text-red-100 mb-2">Danger Zone</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Permanently delete this user account. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        data-testid="button-delete-user-account"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}