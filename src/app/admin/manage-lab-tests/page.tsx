
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Edit3, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { getManagedLabTests, saveManagedLabTests, generateLabTestId, type AdminLabTest } from '@/lib/data/labTests';
import type { UserRole } from '@/lib/data/users';
import { useRouter } from 'next/navigation';

const LabTestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Test name is required"),
  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Price must be a positive number")
  ),
});

type LabTestFormData = z.infer<typeof LabTestSchema>;

export default function ManageLabTestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole } | null>(null);
  // This state will primarily be for displaying and initiating edits/deletes.
  // The actual save operations will re-fetch from localStorage.
  const [displayedLabTests, setDisplayedLabTests] = useState<AdminLabTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AdminLabTest | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<AdminLabTest | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LabTestFormData>({
    resolver: zodResolver(LabTestSchema),
  });

  // Function to refresh the displayed lab tests
  const refreshDisplayedLabTests = () => {
    setDisplayedLabTests(getManagedLabTests());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData);
          if (userData.role !== 'admin') {
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
            router.push('/admin');
          } else {
            refreshDisplayedLabTests(); // Initial load for display
          }
        } catch (e) { console.error("Error parsing current user", e); router.push('/'); }
      } else {
        router.push('/');
      }
    }
  }, [router, toast]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredLabTests = useMemo(() => {
    return displayedLabTests.filter(test =>
      test.name.toLowerCase().includes(searchTerm)
    );
  }, [displayedLabTests, searchTerm]);

  const openCreateForm = () => {
    setEditingTest(null);
    reset({ name: '', price: 0 });
    setIsFormOpen(true);
  };

  const openEditForm = (test: AdminLabTest) => {
    setEditingTest(test);
    setValue("id", test.id);
    setValue("name", test.name);
    setValue("price", test.price);
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<LabTestFormData> = (data) => {
    const currentPersistedTests = getManagedLabTests(); // Read fresh from localStorage
    let updatedTests;

    if (editingTest) {
      updatedTests = currentPersistedTests.map(t => 
        t.id === editingTest.id ? { ...editingTest, name: data.name, price: data.price } : t
      );
      toast({ title: "Lab Test Updated", description: `${data.name} has been updated.` });
    } else {
      const newTestId = generateLabTestId(data.name);
      if (currentPersistedTests.some(t => t.id === newTestId)) {
        toast({ variant: "destructive", title: "Error", description: "A test with a similar name already exists (ID conflict)." });
        return;
      }
      const newTest: AdminLabTest = { 
        id: newTestId,
        name: data.name, 
        price: data.price 
      };
      updatedTests = [...currentPersistedTests, newTest];
      toast({ title: "Lab Test Added", description: `${newTest.name} has been added.` });
    }
    
    saveManagedLabTests(updatedTests); // Save to localStorage (this will dispatch the event)
    refreshDisplayedLabTests(); // Update the local React state for immediate UI feedback
    setIsFormOpen(false);
  };

  const openDeleteDialog = (test: AdminLabTest) => {
    setTestToDelete(test);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      const currentPersistedTests = getManagedLabTests(); // Read fresh from localStorage
      const updatedTests = currentPersistedTests.filter(t => t.id !== testToDelete.id);
      
      saveManagedLabTests(updatedTests); // Save to localStorage (this will dispatch the event)
      refreshDisplayedLabTests(); // Update the local React state for immediate UI feedback
      toast({ title: "Lab Test Deleted", description: `${testToDelete.name} has been deleted.` });
    }
    setIsDeleteDialogOpen(false);
    setTestToDelete(null);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Manage Lab Tests</h1>
        <Button onClick={openCreateForm} variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Lab Test
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search lab tests by name..."
            className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-medium">Test Name</TableHead>
              <TableHead className="text-foreground font-medium">Price</TableHead>
              <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLabTests.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-medium text-foreground">{test.name}</TableCell>
                <TableCell className="text-muted-foreground">${test.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditForm(test)} className="mr-2">
                    <Edit3 className="h-5 w-5 text-muted-foreground hover:text-accent" />
                    <span className="sr-only">Edit Test</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(test)}>
                    <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                    <span className="sr-only">Delete Test</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredLabTests.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No lab tests found.
          </div>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
          reset();
          setEditingTest(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">{editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-muted-foreground">Test Name</Label>
              <Input id="name" {...register("name")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="price" className="text-muted-foreground">Price</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{editingTest ? 'Save Changes' : 'Add Test'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-headline">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the lab test: <span className="font-medium text-foreground">{testToDelete?.name}</span>.
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

    