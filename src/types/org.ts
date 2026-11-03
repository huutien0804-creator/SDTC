export interface RawEmployeeRow {
  Name: string;
  Team: string;
  Part: string;
  z: string;
  'Position title': string;
  'Employment Type': string;
  'Hazardous Positon': string;
  Photo_URL: string;
  Manager_ID: string;
  Is_Leader: string | boolean;
}

export interface Employee {
  id: string; // From 'Name' column (e.g. "1", "190")
  fullName?: string; // Optional custom full name
  team: string; // Department / Division (e.g. "Business Support", "PU Production")
  part: string; // Section / Sub-department (e.g. "Finance & Accounting", "Maintenance")
  level: string; // From 'z' column (e.g. "Director", "Team Leader", "Part Leader", "Staff")
  positionTitle: string; // e.g. "Director", "Manager", "Specialist"
  employmentType: 'Local' | 'Expat' | 'LKS' | string;
  hazardousPosition: 'Office' | 'Production' | string;
  photoUrl: string;
  managerId: string; // References another employee's id
  isLeader: boolean;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface HierarchyNode extends Employee {
  children: HierarchyNode[];
  subordinatesCount: number; // Total descendants count
  directReportsCount: number; // Direct children count
  depth: number;
}

export type ViewMode = 'tree' | 'departments' | 'table' | 'analytics';

export interface FilterOptions {
  searchQuery: string;
  team: string;
  part: string;
  level: string;
  employmentType: string;
  hazardousPosition: string;
  isLeaderOnly: boolean;
}
