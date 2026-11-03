/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, Employee, HierarchyNode } from './types/org';
import { INITIAL_EMPLOYEES, RAW_CSV_DATA } from './data/defaultCsv';
import { buildHierarchyTree } from './utils/orgHierarchy';
import { Header } from './components/Header';
import { OrgTreeView } from './components/OrgTreeView';
import { DepartmentView } from './components/DepartmentView';
import { TableView } from './components/TableView';
import { AnalyticsView } from './components/AnalyticsView';
import { EmployeeModal } from './components/EmployeeModal';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

const STORAGE_KEY = 'enterprise_org_chart_employees_v1';

export default function App() {
  // Load saved state or default 190 employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load cached employees', e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Current view mode
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // Selected employee for detail dossier modal & tree highlighting
  const [selectedEmployee, setSelectedEmployee] = useState<HierarchyNode | null>(null);

  // Modal open states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save to localStorage whenever employees change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      console.error('Failed to save employees', e);
    }
  }, [employees]);

  // Build the hierarchical tree
  const rootNode = useMemo(() => {
    return buildHierarchyTree(employees);
  }, [employees]);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.team) set.add(e.team);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Open employee detail dossier
  const handleSelectEmployee = (emp: HierarchyNode | null) => {
    setSelectedEmployee(emp);
    if (emp) {
      setIsEmployeeModalOpen(true);
    }
  };

  // Add employee
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  // Update employee
  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    if (selectedEmployee?.id === updated.id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  // Delete employee with confirmation dialog
  const promptDeleteEmployee = (emp: Employee) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa nhân sự khỏi sơ đồ tổ chức',
      message: `Bạn có chắc chắn muốn xóa nhân sự "${emp.fullName || emp.id}" (${emp.positionTitle} - ${emp.team}) không?\n\nHành động này sẽ cập nhật cấu trúc báo cáo của các nhân sự cấp dưới trực tiếp.`,
      isDestructive: true,
      onConfirm: () => {
        setEmployees((prev) => {
          // Reassign any direct reports of this employee to this employee's manager
          return prev
            .filter((e) => e.id !== emp.id)
            .map((e) => {
              if (e.managerId === emp.id) {
                return { ...e, managerId: emp.managerId || '190' };
              }
              return e;
            });
        });
        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee(null);
          setIsEmployeeModalOpen(false);
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Reset to initial 190 dataset with confirmation dialog
  const promptResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục dữ liệu mẫu ban đầu',
      message:
        'Hành động này sẽ đặt lại toàn bộ sơ đồ tổ chức về dữ liệu 190 nhân viên gốc từ file dữ liệu của doanh nghiệp.\n\nMọi thay đổi cục bộ chưa đồng bộ sẽ bị mất.',
      isDestructive: true,
      onConfirm: () => {
        setEmployees(INITIAL_EMPLOYEES);
        setSelectedEmployee(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Export CSV file
  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Team',
      'Part',
      'z',
      'Position title',
      'Employment Type',
      'Hazardous Positon',
      'Photo_URL',
      'Manager_ID',
      'Is_Leader',
    ];

    const rows = employees.map((e) => [
      e.id,
      `"${e.team}"`,
      `"${e.part}"`,
      `"${e.level}"`,
      `"${e.positionTitle}"`,
      `"${e.employmentType}"`,
      `"${e.hazardousPosition}"`,
      `"${e.photoUrl}"`,
      `"${e.managerId}"`,
      e.isLeader ? 'TRUE' : 'FALSE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `org_chart_employees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from Google Sheets
  const handleImportEmployees = (imported: Employee[]) => {
    if (imported && imported.length > 0) {
      setEmployees(imported);
      setSelectedEmployee(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalEmployees={employees.length}
        totalDepartments={departments.length}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenAddEmployee={() => setIsAddEmployeeModalOpen(true)}
        onResetData={promptResetData}
        onExportCsv={handleExportCsv}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'tree' && (
          <OrgTreeView
            rootNode={rootNode}
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={(emp) => {
              setSelectedEmployee(emp);
              if (emp) setIsEmployeeModalOpen(true);
            }}
            departments={departments}
          />
        )}

        {viewMode === 'departments' && (
          <div className="flex-1 overflow-y-auto">
            <DepartmentView
              employees={employees}
              onSelectEmployee={handleSelectEmployee}
            />
          </div>
        )}

        {viewMode === 'table' && (
          <div className="flex-1 overflow-y-auto">
            <TableView
              employees={employees}
              onSelectEmployee={handleSelectEmployee}
              onEditEmployee={(emp) => {
                setSelectedEmployee(emp as unknown as HierarchyNode);
                setIsEmployeeModalOpen(true);
              }}
              onDeleteEmployee={promptDeleteEmployee}
              departments={departments}
            />
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="flex-1 overflow-y-auto">
            <AnalyticsView employees={employees} />
          </div>
        )}
      </main>

      {/* Employee Dossier Modal */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          employee={selectedEmployee}
          employees={employees}
          onClose={() => setIsEmployeeModalOpen(false)}
          onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={promptDeleteEmployee}
        />
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onAddEmployee={handleAddEmployee}
        employees={employees}
        departments={departments}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        employees={employees}
        onImportEmployees={handleImportEmployees}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}
