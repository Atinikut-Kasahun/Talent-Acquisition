
export type EmployeeStatus = "Active" | "Onboarding" | "Offboarded";

export interface Employee {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  appliedFor: string;
  department: string;
  location: string;
  experience: string;
  status: EmployeeStatus;
  hiredOn: string;
  appliedOn: string;
  email: string;
  phone: string;
}

export const DEPARTMENTS = ["Design", "Management", "Marketing", "Engineering"];
export const LOCATIONS = ["Remote", "On-site", "Hybrid"];

export const STATUS_ORDER: EmployeeStatus[] = ["Active", "Onboarding", "Offboarded"];

export const STATUS_CONFIG: Record<
  EmployeeStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  Active: {
    label: "Active",
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  Onboarding: {
    label: "Onboarding",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Offboarded: {
    label: "Offboarded",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Abraham Dawit",
      role: "Web Designer",
    },
    appliedFor: "Senior Web Designer",
    department: "Design",
    location: "Hybrid",
    experience: "3 Years",
    status: "Active",
    hiredOn: "12 Jan, 2023",
    appliedOn: "05 Jan, 2023",
    email: "abraham.dawit@drogagroup.com",
    phone: "+251 91 234 5671",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Dagim Girma",
      role: "Project Manager",
    },
    appliedFor: "Lead Project Manager",
    department: "Management",
    location: "On-site",
    experience: "5 Years",
    status: "Onboarding",
    hiredOn: "N/A",
    appliedOn: "15 Feb, 2023",
    email: "dagim.girma@drogagroup.com",
    phone: "+251 91 234 5672",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Bereket Mena",
      role: "Content Writing",
    },
    appliedFor: "Content Writer",
    department: "Marketing",
    location: "Remote",
    experience: "2 Years",
    status: "Active",
    hiredOn: "01 Mar, 2023",
    appliedOn: "20 Feb, 2023",
    email: "bereket.mena@drogagroup.com",
    phone: "+251 91 234 5673",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Melkamu",
      role: "Digital Marketer",
    },
    appliedFor: "Marketing Lead",
    department: "Marketing",
    location: "On-site",
    experience: "4 Years",
    status: "Offboarded",
    hiredOn: "N/A",
    appliedOn: "10 Mar, 2023",
    email: "abram.melkamu@drogagroup.com",
    phone: "+251 91 234 5674",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Mehiret Tsegaye",
      role: "Front-end Developer",
    },
    appliedFor: "React Developer",
    department: "Engineering",
    location: "Remote",
    experience: "1 Year",
    status: "Active",
    hiredOn: "15 Apr, 2023",
    appliedOn: "01 Apr, 2023",
    email: "mehiret.tsegaye@drogagroup.com",
    phone: "+251 91 234 5675",
  },
];
