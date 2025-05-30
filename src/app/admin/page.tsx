
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Sample data for upcoming appointments
const upcomingAppointments = [
  { id: '1', patientName: 'Ethan Carter', date: '2024-07-20', time: '10:00 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '2', patientName: 'Olivia Bennett', date: '2024-07-20', time: '11:30 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '3', patientName: 'Noah Thompson', date: '2024-07-20', time: '02:00 PM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '4', patientName: 'Sophia Evans', date: '2024-07-21', time: '09:00 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '5', patientName: 'Liam Foster', date: '2024-07-21', time: '10:30 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, Dr. Amelia Harper</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">250</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">15</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenue This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$12,500</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-foreground text-xl md:text-2xl font-bold font-headline mb-4">Upcoming Appointments</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-medium">Patient Name</TableHead>
              <TableHead className="text-foreground font-medium">Date</TableHead>
              <TableHead className="text-foreground font-medium">Time</TableHead>
              <TableHead className="text-foreground font-medium">Doctor</TableHead>
              <TableHead className="text-foreground font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium text-foreground">{appointment.patientName}</TableCell>
                <TableCell className="text-muted-foreground">{appointment.date}</TableCell>
                <TableCell className="text-muted-foreground">{appointment.time}</TableCell>
                <TableCell className="text-muted-foreground">{appointment.doctor}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{appointment.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
