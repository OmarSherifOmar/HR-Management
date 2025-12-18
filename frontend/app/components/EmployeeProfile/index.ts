/**
 * Employee Profile Components - Main Export
 * Centralized export for all employee profile related components and utilities
 */

// Components
export { default as EmployeeCard } from './EmployeeCard';
export { default as EmployeeListView } from './EmployeeListView';
export { default as EmployeeDetailView } from './EmployeeDetailView';
export { default as EmployeeStats } from './EmployeeStats';
export { default as EmployeeStatusIndicator } from './EmployeeStatusIndicator';
export { default as EmployeeDocuments } from './EmployeeDocuments';
export { default as AddEmployeeForm } from './AddEmployeeForm';
export { default as ContactInfo } from './ContactInfo';
export { default as ProfessionalInfo } from './ProfessionalInfo';

// Self-Service Components
export { default as SelfServiceContactInfo } from './SelfService/SelfServiceContactInfo';
export { default as SelfServiceProfilePicture } from './SelfService/SelfServiceProfilePicture';
export { default as SelfServiceChangeRequests } from './SelfService/SelfServiceChangeRequests';

// Manager Components
export { default as ManagerTeamView } from './Manager/ManagerTeamView';

// HR/Admin Components
export { default as HREmployeeSearch } from './HR/HREmployeeSearch';
export { default as HRChangeRequestReview } from './HR/HRChangeRequestReview';
export { default as HRRoleAssignment } from './HR/HRRoleAssignment';
export { default as HREmployeeManagement } from './HRAdmin/HREmployeeManagement';
export { default as CreateEmployeeModal } from './HRAdmin/CreateEmployeeModal';
export { default as CandidateManagement } from './HRAdmin/CandidateManagement';
