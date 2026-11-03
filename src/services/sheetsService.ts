import { Employee } from '../types/org';

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowCount: number;
}

export async function createOrgChartSpreadsheet(
  title: string,
  employees: Employee[],
  accessToken: string
): Promise<SheetExportResult> {
  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Sơ Đồ Tổ Chức & Nhân Sự - ${new Date().toLocaleDateString('vi-VN')}`,
      },
      sheets: [
        {
          properties: {
            title: 'Danh Sách Nhân Sự',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Không thể tạo Google Sheet mới');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetTitle = sheetData.sheets?.[0]?.properties?.title || 'Danh Sách Nhân Sự';

  // 2. Prepare Header and Data rows
  const headers = [
    'Name',
    'Full_Name',
    'Team',
    'Part',
    'z',
    'Position title',
    'Employment Type',
    'Hazardous Positon',
    'Photo_URL',
    'Manager_ID',
    'Is_Leader',
    'Email',
    'Phone',
  ];

  const rows = employees.map((emp) => [
    emp.id,
    emp.fullName || `Nhân viên #${emp.id}`,
    emp.team,
    emp.part,
    emp.level,
    emp.positionTitle,
    emp.employmentType,
    emp.hazardousPosition,
    emp.photoUrl,
    emp.managerId,
    emp.isLeader ? 'TRUE' : 'FALSE',
    emp.email || '',
    emp.phone || '',
  ]);

  const allValues = [headers, ...rows];

  // 3. Write data into the sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      sheetTitle
    )}'!A1:M${allValues.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Không thể ghi dữ liệu vào Google Sheet');
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    rowCount: employees.length,
  };
}

export async function importEmployeesFromSpreadsheet(
  spreadsheetIdOrUrl: string,
  accessToken: string
): Promise<{ employees: Employee[]; sheetTitle: string }> {
  // Extract spreadsheet ID from potential full URL or raw ID
  let spreadsheetId = spreadsheetIdOrUrl.trim();
  const urlMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    spreadsheetId = urlMatch[1];
  }

  // 1. Fetch metadata to get actual first sheet name (adhering to best practices)
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Không thể tìm thấy Google Sheet hoặc chưa cấp quyền');
  }

  const metaData = await metaRes.json();
  const firstSheet = metaData.sheets?.[0];
  const sheetTitle = firstSheet?.properties?.title || 'Sheet1';

  // 2. Fetch all values
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      sheetTitle
    )}'!A1:Z1000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Không thể đọc nội dung Google Sheet');
  }

  const valuesData = await valuesRes.json();
  const rawRows: string[][] = valuesData.values || [];

  if (rawRows.length < 2) {
    throw new Error('Google Sheet không có dữ liệu nhân sự (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu)');
  }

  const headers = rawRows[0].map((h) => h?.toString().trim().toLowerCase());
  const findCol = (keys: string[]) =>
    headers.findIndex((h) => keys.some((k) => h === k || h.includes(k)));

  const idCol = findCol(['name', 'id', 'mã']);
  const fullNameCol = findCol(['full_name', 'full name', 'họ và tên', 'tên']);
  const teamCol = findCol(['team', 'phòng ban', 'department', 'khối']);
  const partCol = findCol(['part', 'bộ phận', 'tổ', 'nhóm']);
  const levelCol = findCol(['z', 'level', 'cấp bậc', 'role']);
  const positionCol = findCol(['position title', 'position', 'chức danh', 'chức vụ']);
  const empTypeCol = findCol(['employment type', 'employment', 'loại hình']);
  const hazardCol = findCol(['hazardous positon', 'hazardous position', 'khu vực', 'nơi làm việc']);
  const photoCol = findCol(['photo_url', 'photo', 'avatar', 'ảnh']);
  const managerCol = findCol(['manager_id', 'manager', 'người quản lý', 'quản lý']);
  const leaderCol = findCol(['is_leader', 'leader', 'lãnh đạo']);
  const emailCol = findCol(['email', 'thư điện tử']);
  const phoneCol = findCol(['phone', 'số điện thoại', 'sđt']);

  const parsedEmployees: Employee[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0 || !row[idCol >= 0 ? idCol : 0]) continue;

    const id = (idCol >= 0 ? row[idCol] : `${r}`)?.trim();
    const positionTitle = (positionCol >= 0 ? row[positionCol] : 'Staff')?.trim() || 'Staff';
    const level = (levelCol >= 0 ? row[levelCol] : 'Staff')?.trim() || 'Staff';
    const isLeaderStr = (leaderCol >= 0 ? row[leaderCol] : '')?.trim().toUpperCase();
    const isLeader =
      isLeaderStr === 'TRUE' ||
      isLeaderStr === '1' ||
      level.toLowerCase().includes('leader') ||
      level.toLowerCase().includes('director');

    let managerId = (managerCol >= 0 ? row[managerCol] : '')?.trim();
    if (id !== '190' && !managerId) {
      if (id === '189') managerId = '190';
      else if (id === '188') managerId = '189';
    }

    parsedEmployees.push({
      id,
      fullName:
        (fullNameCol >= 0 ? row[fullNameCol] : '')?.trim() ||
        `Nhân sự #${id}`,
      team: (teamCol >= 0 ? row[teamCol] : '')?.trim() || 'Unassigned',
      part: (partCol >= 0 ? row[partCol] : '')?.trim() || '',
      level,
      positionTitle,
      employmentType: (empTypeCol >= 0 ? row[empTypeCol] : 'Local')?.trim() || 'Local',
      hazardousPosition: (hazardCol >= 0 ? row[hazardCol] : 'Office')?.trim() || 'Office',
      photoUrl:
        (photoCol >= 0 ? row[photoCol] : '')?.trim() ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      managerId,
      isLeader,
      email: (emailCol >= 0 ? row[emailCol] : `emp${id}@enterprise.com`)?.trim(),
      phone: (phoneCol >= 0 ? row[phoneCol] : '')?.trim(),
    });
  }

  return {
    employees: parsedEmployees,
    sheetTitle,
  };
}
