
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getManagedPatients, saveManagedPatients, type Patient, type MedicalHistoryEntry, type Prescription, type PatientLabRequest } from '@/lib/data/patients';
import type { UserRole } from '@/lib/data/users';
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Edit, PlusCircle, Trash2 } from 'lucide-react';
import type { AdminLabTest } from '@/lib/data/labTests'; // Import AdminLabTest

const MedicalHistorySchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().min(1, "Notes are required"),
});
type MedicalHistoryFormData = z.infer<typeof MedicalHistorySchema>;

const PrescriptionSchema = z.object({
  id: z.string().optional(),
  medicationName: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
});
type PrescriptionFormData = z.infer<typeof PrescriptionSchema>;

const LabRequestSchema = z.object({
  testId: z.string().min(1, "Please select a lab test"), 
});
type LabRequestFormData = z.infer<typeof LabRequestSchema>;


export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole } | null>(null);
  
  const [isHistoryFormOpen, setIsHistoryFormOpen] = useState(false);
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<MedicalHistoryEntry | null>(null);

  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  const [isLabRequestFormOpen, setIsLabRequestFormOpen] = useState(false);
  const [availableTests, setAvailableTests] = useState<AdminLabTest[]>([]);


  const { register: registerHistory, handleSubmit: handleSubmitHistory, reset: resetHistory, setValue: setValueHistory, formState: { errors: errorsHistory } } = useForm<MedicalHistoryFormData>({
    resolver: zodResolver(MedicalHistorySchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], notes: '' },
  });

  const { register: registerPrescription, handleSubmit: handleSubmitPrescription, reset: resetPrescription, setValue: setValuePrescription, formState: { errors: errorsPrescription } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(PrescriptionSchema),
  });
  
  const { control: controlLab, handleSubmit: handleSubmitLab, reset: resetLab, formState: { errors: errorsLab } } = useForm<LabRequestFormData>({
    resolver: zodResolver(LabRequestSchema),
  });


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) { console.error("Error parsing current user", e); router.push('/admin/patients'); }
      } else {
        router.push('/'); 
      }
    }

    if (patientId) {
      const patients = getManagedPatients();
      const foundPatient = patients.find(p => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Patient not found." });
        router.push('/admin/patients');
      }
    }
  }, [patientId, router, toast]);

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const response = await fetch('/api/lab-tests');
        if (!response.ok) {
          throw new Error('Failed to fetch lab tests');
        }
        const testsFromApi: AdminLabTest[] = await response.json();
        setAvailableTests(testsFromApi);
      } catch (error) {
        console.error("Error fetching lab tests:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load available lab tests." });
      }
    };
    fetchLabTests();
  }, [toast]);


  const updatePatientData = (updatedPatient: Patient) => {
    const allPatients = getManagedPatients();
    const patientIndex = allPatients.findIndex(p => p.id === updatedPatient.id);
    if (patientIndex !== -1) {
      allPatients[patientIndex] = updatedPatient;
      saveManagedPatients(allPatients);
      setPatient(updatedPatient); 
    }
  };

  const openHistoryForm = (entry?: MedicalHistoryEntry) => {
    if (entry) {
      setEditingHistoryEntry(entry);
      setValueHistory("date", entry.date);
      setValueHistory("notes", entry.notes);
    } else {
      setEditingHistoryEntry(null);
      resetHistory({ date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setIsHistoryFormOpen(true);
  };

  const onHistorySubmit: SubmitHandler<MedicalHistoryFormData> = (data) => {
    if (!patient || !currentUser) return;
    let updatedHistory: MedicalHistoryEntry[];
    if (editingHistoryEntry) {
      updatedHistory = patient.medicalHistory.map(h => 
        h.id === editingHistoryEntry.id ? { ...h, ...data, enteredBy: currentUser.fullName } : h
      );
    } else {
      const newEntry: MedicalHistoryEntry = { 
        id: (Math.random() + 1).toString(36).substring(2), 
        ...data,
        enteredBy: currentUser.fullName,
      };
      updatedHistory = [...patient.medicalHistory, newEntry];
    }
    updatePatientData({ ...patient, medicalHistory: updatedHistory });
    toast({ title: editingHistoryEntry ? "History Updated" : "History Added" });
    setIsHistoryFormOpen(false);
  };

  const deleteHistoryEntry = (entryId: string) => {
    if (!patient) return;
    const updatedHistory = patient.medicalHistory.filter(h => h.id !== entryId);
    updatePatientData({ ...patient, medicalHistory: updatedHistory });
    toast({ title: "History Entry Deleted" });
  };

  const openPrescriptionForm = (prescription?: Prescription) => {
    if (prescription) {
      setEditingPrescription(prescription);
      setValuePrescription("medicationName", prescription.medicationName);
      setValuePrescription("dosage", prescription.dosage);
      setValuePrescription("frequency", prescription.frequency);
      setValuePrescription("duration", prescription.duration);
    } else {
      setEditingPrescription(null);
      resetPrescription({ medicationName: '', dosage: '', frequency: '', duration: '' });
    }
    setIsPrescriptionFormOpen(true);
  };

  const onPrescriptionSubmit: SubmitHandler<PrescriptionFormData> = (data) => {
    if (!patient || !currentUser) return;
    let updatedPrescriptions: Prescription[];
    const currentDate = new Date().toISOString().split('T')[0];
    if (editingPrescription) {
      updatedPrescriptions = patient.prescriptions.map(p =>
        p.id === editingPrescription.id ? { ...p, ...data, prescribedBy: currentUser.fullName } : p
      );
    } else {
      const newPrescription: Prescription = {
        id: (Math.random() + 1).toString(36).substring(2),
        datePrescribed: currentDate,
        ...data,
        prescribedBy: currentUser.fullName,
      };
      updatedPrescriptions = [...patient.prescriptions, newPrescription];
    }
    updatePatientData({ ...patient, prescriptions: updatedPrescriptions });
    toast({ title: editingPrescription ? "Prescription Updated" : "Prescription Added" });
    setIsPrescriptionFormOpen(false);
  };

  const deletePrescription = (prescriptionId: string) => {
    if (!patient) return;
    const updatedPrescriptions = patient.prescriptions.filter(p => p.id !== prescriptionId);
    updatePatientData({ ...patient, prescriptions: updatedPrescriptions });
    toast({ title: "Prescription Deleted" });
  };

  const openLabRequestForm = () => {
    resetLab({ testId: '' });
    setIsLabRequestFormOpen(true);
  };

  const onLabRequestSubmit: SubmitHandler<LabRequestFormData> = (data) => {
    if (!patient || !currentUser) return;
    const selectedApiTest = availableTests.find(test => test.id === data.testId);
    if (!selectedApiTest) {
      toast({ variant: "destructive", title: "Error", description: "Selected test not found." });
      return;
    }
    const newLabRequest: PatientLabRequest = {
      id: (Math.random() + 1).toString(36).substring(2), // Unique ID for this request instance
      testId: selectedApiTest.id, // ID from AdminLabTest
      testName: selectedApiTest.name, // Name from AdminLabTest
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending Payment', 
      requestedBy: currentUser.fullName,
      priceAtTimeOfRequest: selectedApiTest.price,
      patientName: patient.name, 
    };
    const updatedLabRequests = [...patient.labRequests, newLabRequest];
    updatePatientData({ ...patient, labRequests: updatedLabRequests });
    toast({ title: "Lab Test Requested", description: `${selectedApiTest.name} has been requested.` });
    setIsLabRequestFormOpen(false);
  };
  
  const cancelLabRequest = (requestId: string) => {
    if (!patient) return;
    const updatedLabRequests = patient.labRequests.map(req => 
      req.id === requestId ? { ...req, status: 'Cancelled' as 'Cancelled' } : req
    );
    updatePatientData({ ...patient, labRequests: updatedLabRequests });
    toast({ title: "Lab Request Cancelled" });
  };


  if (!patient || !currentUser) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading patient data...</div>;
  }

  const isDoctor = currentUser.role === 'doctor';

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => router.push('/admin/patients')} className="self-start">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Patients
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">{patient.name}</CardTitle>
          <CardDescription>Patient ID: {patient.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><span className="font-medium text-muted-foreground">Date of Birth:</span> {patient.dob}</div>
          <div><span className="font-medium text-muted-foreground">Gender:</span> {patient.gender}</div>
          <div><span className="font-medium text-muted-foreground">Phone:</span> {patient.phoneNumber}</div>
          {patient.email && <div><span className="font-medium text-muted-foreground">Email:</span> {patient.email}</div>}
          <div><span className="font-medium text-muted-foreground">Address:</span> {patient.address}</div>
          <div><span className="font-medium text-muted-foreground">Status:</span> <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'} className={patient.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>{patient.status}</Badge></div>
          {patient.emergencyContactName && <div><span className="font-medium text-muted-foreground">Emergency Contact:</span> {patient.emergencyContactName} ({patient.emergencyContactPhone})</div>}
          <div><span className="font-medium text-muted-foreground">Registered:</span> {patient.registrationDate}</div>
          {patient.lastVisit && <div><span className="font-medium text-muted-foreground">Last Visit:</span> {patient.lastVisit}</div>}
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="border-b border-border px-0 bg-transparent w-full justify-start rounded-none mb-4">
          <TabsTrigger value="history" className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]">Medical History</TabsTrigger>
          <TabsTrigger value="prescriptions" className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]">Prescriptions</TabsTrigger>
          <TabsTrigger value="lab_requests" className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]">Lab Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical History</CardTitle>
              {isDoctor && (
                <Button onClick={() => openHistoryForm()} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {patient.medicalHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Entered By</TableHead>
                      {isDoctor && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.medicalHistory.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell className="whitespace-pre-wrap">{entry.notes}</TableCell>
                        <TableCell>{entry.enteredBy || 'N/A'}</TableCell>
                        {isDoctor && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openHistoryForm(entry)} className="mr-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteHistoryEntry(entry.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No medical history entries found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prescriptions</CardTitle>
              {isDoctor && (
                <Button onClick={() => openPrescriptionForm()} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Prescription
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {patient.prescriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Prescribed By</TableHead>
                      {isDoctor && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.prescriptions.slice().sort((a,b) => new Date(b.datePrescribed).getTime() - new Date(a.datePrescribed).getTime()).map(rx => (
                      <TableRow key={rx.id}>
                        <TableCell>{rx.datePrescribed}</TableCell>
                        <TableCell>{rx.medicationName}</TableCell>
                        <TableCell>{rx.dosage}</TableCell>
                        <TableCell>{rx.frequency}</TableCell>
                        <TableCell>{rx.duration}</TableCell>
                        <TableCell>{rx.prescribedBy || 'N/A'}</TableCell>
                        {isDoctor && (
                           <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openPrescriptionForm(rx)} className="mr-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deletePrescription(rx.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No prescriptions found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab_requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lab Test Requests</CardTitle>
              {isDoctor && (
                <Button onClick={openLabRequestForm} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Test
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {patient.labRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested By</TableHead>
                      {isDoctor && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.labRequests.slice().sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()).map(req => (
                      <TableRow key={req.id}>
                        <TableCell>{req.requestedDate}</TableCell>
                        <TableCell>{req.testName}</TableCell>
                        <TableCell>${req.priceAtTimeOfRequest?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              req.status === 'Pending Payment' ? 'secondary' :
                              req.status === 'Pending' ? 'default' : 
                              req.status === 'Completed' ? 'outline' : 'destructive'
                            }
                            className={
                              req.status === 'Pending Payment' ? 'bg-yellow-500/20 text-yellow-700' :
                              req.status === 'Pending' ? 'bg-blue-500/20 text-blue-700' : 
                              req.status === 'Completed' ? 'bg-green-500/20 text-green-700' :
                              req.status === 'Cancelled' ? 'bg-red-500/20 text-red-700' : ''
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{req.requestedBy || 'N/A'}</TableCell>
                        {isDoctor && (req.status === 'Pending' || req.status === 'Pending Payment') && (
                           <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => cancelLabRequest(req.id)} className="text-destructive hover:text-destructive">
                              Cancel
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No lab test requests found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isHistoryFormOpen} onOpenChange={setIsHistoryFormOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">{editingHistoryEntry ? 'Edit' : 'Add'} Medical History Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitHistory(onHistorySubmit)} className="space-y-4">
            <div>
              <Label htmlFor="historyDate" className="text-muted-foreground">Date</Label>
              <Input id="historyDate" type="date" {...registerHistory("date")} className="mt-1 bg-background border-input text-foreground" />
              {errorsHistory.date && <p className="text-sm text-destructive mt-1">{errorsHistory.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="historyNotes" className="text-muted-foreground">Notes</Label>
              <Textarea id="historyNotes" {...registerHistory("notes")} rows={5} className="mt-1 bg-background border-input text-foreground" />
              {errorsHistory.notes && <p className="text-sm text-destructive mt-1">{errorsHistory.notes.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{editingHistoryEntry ? 'Save Changes' : 'Add Entry'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrescriptionFormOpen} onOpenChange={setIsPrescriptionFormOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">{editingPrescription ? 'Edit' : 'Add'} Prescription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPrescription(onPrescriptionSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="medicationName" className="text-muted-foreground">Medication Name</Label>
              <Input id="medicationName" {...registerPrescription("medicationName")} className="mt-1 bg-background border-input text-foreground" />
              {errorsPrescription.medicationName && <p className="text-sm text-destructive mt-1">{errorsPrescription.medicationName.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dosage" className="text-muted-foreground">Dosage</Label>
                <Input id="dosage" {...registerPrescription("dosage")} className="mt-1 bg-background border-input text-foreground" />
                {errorsPrescription.dosage && <p className="text-sm text-destructive mt-1">{errorsPrescription.dosage.message}</p>}
              </div>
              <div>
                <Label htmlFor="frequency" className="text-muted-foreground">Frequency</Label>
                <Input id="frequency" {...registerPrescription("frequency")} className="mt-1 bg-background border-input text-foreground" />
                {errorsPrescription.frequency && <p className="text-sm text-destructive mt-1">{errorsPrescription.frequency.message}</p>}
              </div>
              <div>
                <Label htmlFor="duration" className="text-muted-foreground">Duration</Label>
                <Input id="duration" {...registerPrescription("duration")} className="mt-1 bg-background border-input text-foreground" />
                {errorsPrescription.duration && <p className="text-sm text-destructive mt-1">{errorsPrescription.duration.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{editingPrescription ? 'Save Changes' : 'Add Prescription'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLabRequestFormOpen} onOpenChange={setIsLabRequestFormOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">Request Lab Test</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLab(onLabRequestSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="labTest" className="text-muted-foreground">Select Test</Label>
              <Controller
                name="testId"
                control={controlLab}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} >
                    <SelectTrigger id="labTest" className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select a lab test" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {availableTests.map(test => (
                        <SelectItem key={test.id} value={test.id} className="hover:bg-accent focus:bg-accent">
                          {test.name} {/* Show only test name to doctor */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errorsLab.testId && <p className="text-sm text-destructive mt-1">{errorsLab.testId.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Request Test</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
