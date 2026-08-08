export type Student = {
  registrationId: string;
  teamName: string;
  studentName: string;
  rollNumber: string;
  email: string;
  present: boolean;
  attendanceTime: string | null;
};

export type Team = {
  name: string;
  members: Student[];
  presentCount: number;
};

export type AttendanceFilter = "all" | "present" | "absent";