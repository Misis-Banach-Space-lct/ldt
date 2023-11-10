import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

const columns: GridColDef[] = [
  {
    field: 'firstname',
    headerName: 'Фамилия',
    flex: 1,
    renderHeader: (params) => (
      <strong style={{ fontSize: '1.2em', color: '#0B0959' }}>
        {params.colDef.headerName}
      </strong>
    ),
  },
  {
    field: 'name',
    headerName: 'Имя',
    flex: 1,
    renderCell: (params) => (
      <div style={{ textAlign: 'center' }}>
        {params.value}
      </div>
    ),
    renderHeader: (params) => (
      <strong style={{ fontSize: '1.2em', color: '#0B0959', textAlign: 'center' }}>
        {params.colDef.headerName}
      </strong>
    ),
  },
  {
    field: 'role',
    headerName: 'Роль',
    flex: 1,
    renderCell: (params) => (
      <div style={{ textAlign: 'center' }}>
        {params.value}
      </div>
    ),
    renderHeader: (params) => (
      <strong style={{ fontSize: '1.2em', color: '#0B0959', textAlign: 'center' }}>
        {params.colDef.headerName}
      </strong>
    ),
  },
  {
    field: 'email',
    headerName: 'email',
    flex: 1,
    renderCell: (params) => (
      <div style={{ textAlign: 'center' }}>
        {params.value}
      </div>
    ),
    renderHeader: (params) => (
      <strong style={{ fontSize: '1.2em', color: '#0B0959', textAlign: 'center' }}>
        {params.colDef.headerName}
      </strong>
    ),
  }
];




interface Props {
  data: string[][];
}

type YandexRequestItem = {
  firstname: string;
  name: string;
  role: string;
  email: string;
};

export default function PageTable(props: Props) {
  const { data } = props;
  const [rows, setRows] = useState<YandexRequestItem[]>([]);

  useEffect(() => {
    let newData = data.map(([firstname, name, role, email], index) => ({
      id: index,
      firstname, 
      name, 
      role, 
      email
    }));
    setRows(newData);
  }, []);


  return (
    <div style={{ height: '100%', width: '100%', maxWidth: '1200px' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        hideFooter
      />
    </div>
  );
}