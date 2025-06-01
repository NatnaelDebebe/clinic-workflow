
'use client';

import type { ChangeEvent } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm, type SubmitHandler, Controller, useWatch } from "react-hook-form"; // Added useWatch
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, UserPlus, Edit3, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/lib/data/users'; 
import { userRoles, getManagedUsers, saveManagedUsers } from '@/lib/data/users'; 
import { useToast } from "@/hooks/use-toast";


const UserSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().email("Invalid email address").min(1, "Username/Email is required"),
  role: z.enum(userRoles, { errorMap: () => ({ message: "Role is required" }) }),
  specialization: z.string().optional(),
  password: z.string().optional(), 
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'doctor' && (!data.specialization || data.specialization.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Specialization is required for doctors.",
      path: ["specialization"],
    });
  }
}).refine(data => {
  if (!data.id || data.password) { // New user OR existing user changing password
    return !!data.password && data.password.length >= 6;
  }
  return true; 
}, {
  message: "Password must be at least 6 characters",
  path: ["password"],
})
.refine(data => {
  if (data.password) { // If password is being set/changed
    return data.password === data.confirmPassword;
  }
  return true; 
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type UserFormData = z.infer<typeof UserSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, control, formState: { errors }, watch } = useForm<UserFormData>({ // Added watch
    resolver: zodResolver(UserSchema),
    defaultValues: {
        fullName: '',
        username: '',
        role: undefined,
        specialization: '',
        password: '',
        confirmPassword: ''
    }
  });

  const watchedRole = watch("role"); // Watch the role field

  useEffect(() => {
    setUsers(getManagedUsers());
  }, []);

  useEffect(() => {
    if (editingUser) {
      setValue("id", editingUser.id);
      setValue("fullName", editingUser.fullName);
      setValue("username", editingUser.username);
      setValue("role", editingUser.role);
      setValue("specialization", editingUser.specialization || '');
      setValue("password", ""); 
      setValue("confirmPassword", "");
    } else {
      reset({ id: undefined, fullName: '', username: '', role: undefined, specialization: '', password: '', confirmPassword: '' });
    }
  }, [editingUser, setValue, reset]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm) || user.username.toLowerCase().includes(searchTerm);
      const matchesTab = activeTab === 'all' || user.role === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [users, searchTerm, activeTab]);

  const openCreateForm = () => {
    setEditingUser(null);
    reset({ id: undefined, fullName: '', username: '', role: undefined, specialization: '', password: '', confirmPassword: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

 const onSubmit: SubmitHandler<UserFormData> = (data) => {
    let updatedUsers;
    const userDataToSave: Partial<User> = {
      fullName: data.fullName,
      username: data.username,
      role: data.role,
      status: editingUser ? editingUser.status : 'Active', // Preserve status on edit, default to Active for new
    };

    if (data.role === 'doctor') {
      userDataToSave.specialization = data.specialization;
    } else {
      userDataToSave.specialization = undefined; // Clear specialization if not a doctor
    }

    if (data.password) {
      userDataToSave.password = data.password;
    }

    if (editingUser) {
      updatedUsers = users.map(u => 
        u.id === editingUser.id ? { ...u, ...userDataToSave, password: data.password || u.password } : u
      );
      toast({ title: "User Updated", description: `${data.fullName} has been updated.` });
    } else {
      if (!data.password) { 
        toast({ variant: "destructive", title: "Error", description: "Password is required for new users." });
        return;
      }
      const newUser: User = {
        ...userDataToSave,
        id: (Math.random() + 1).toString(36).substring(7), 
        status: 'Active', 
        password: data.password, // Already checked it exists
      } as User; // Cast to User as all required fields are now present
      updatedUsers = [...users, newUser];
      toast({ title: "User Created", description: `${newUser.fullName} has been added.` });
    }
    setUsers(updatedUsers);
    saveManagedUsers(updatedUsers);
    setIsFormOpen(false);
    reset({ id: undefined, fullName: '', username: '', role: undefined, specialization: '', password: '', confirmPassword: '' });
  };


  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      const updatedUsers = users.filter(u => u.id !== userToDelete.id);
      setUsers(updatedUsers);
      saveManagedUsers(updatedUsers);
      toast({ title: "User Deleted", description: `${userToDelete.fullName} has been deleted.` });
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'doctor': return 'default';
      case 'lab_tech': return 'secondary';
      case 'receptionist': return 'outline';
      case 'patient': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleBadgeClassName = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-700';
      case 'doctor': return 'bg-blue-500/20 text-blue-700';
      case 'lab_tech': return 'bg-yellow-500/20 text-yellow-700';
      case 'receptionist': return 'bg-purple-500/20 text-purple-700';
      case 'patient': return 'bg-green-500/20 text-green-700';
      default: return '';
    }
  };


  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">User Management</h1>
        <Button onClick={openCreateForm} variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole | 'all')} className="mb-6">
        <TabsList className="border-b border-border px-0 bg-transparent w-full justify-start rounded-none">
          {(['all', ...userRoles.filter(r => r !== 'patient')] as const).map(role => ( // Exclude 'patient' from tabs if not needed
            <TabsTrigger
              key={role}
              value={role}
              className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em] capitalize"
            >
              {role === 'all' ? 'All Staff' : role.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or username..."
              className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
           <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground font-medium">Full Name</TableHead>
                  <TableHead className="text-foreground font-medium">Username/Email</TableHead>
                  <TableHead className="text-foreground font-medium">Role</TableHead>
                  <TableHead className="text-foreground font-medium">Specialization</TableHead>
                  <TableHead className="text-foreground font-medium">Status</TableHead>
                  <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.filter(u => u.role !== 'patient').map((user) => ( // Exclude patients from this table view
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className={cn(getRoleBadgeClassName(user.role), 'capitalize')}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.role === 'doctor' ? user.specialization : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(user)} className="mr-2">
                        <Edit3 className="h-5 w-5 text-muted-foreground hover:text-accent" />
                        <span className="sr-only">Edit User</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)}>
                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                         <span className="sr-only">Delete User</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.filter(u => u.role !== 'patient').length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No staff users found for this filter.
                </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
          setEditingUser(null); 
          reset({ id: undefined, fullName: '', username: '', role: undefined, specialization: '', password: '', confirmPassword: '' }); 
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right text-muted-foreground">
                Full Name
              </Label>
              <Input id="fullName" {...register("fullName")} className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground" />
            </div>
            {errors.fullName && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.fullName.message}</p>}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right text-muted-foreground">
                Email
              </Label>
              <Input id="username" {...register("username")} className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground" />
            </div>
            {errors.username && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.username.message}</p>}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right text-muted-foreground">
                Password
              </Label>
              <Input id="password" type="password" {...register("password")} className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground" placeholder={editingUser ? "Leave blank to keep current" : ""}/>
            </div>
            {errors.password && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.password.message}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPassword" className="text-right text-muted-foreground">
                Confirm Password
              </Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground" />
            </div>
            {errors.confirmPassword && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.confirmPassword.message}</p>}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right text-muted-foreground">
                Role
              </Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                    <SelectTrigger id="role" className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {userRoles.filter(r => r !== 'patient').map(role => ( // Exclude 'patient' from selectable roles
                        <SelectItem key={role} value={role} className="capitalize hover:bg-accent focus:bg-accent">
                          {role.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {errors.role && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.role.message}</p>}

            {watchedRole === 'doctor' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialization" className="text-right text-muted-foreground">
                    Specialization
                  </Label>
                  <Input id="specialization" {...register("specialization")} className="col-span-3 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                </div>
                {errors.specialization && <p className="col-start-2 col-span-3 text-sm text-destructive text-left -mt-2 mb-2">{errors.specialization.message}</p>}
              </>
            )}
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingUser ? 'Save Changes' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-headline">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the user <span className="font-medium text-foreground">{userToDelete?.fullName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} asChild><Button variant="destructive">Delete</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

