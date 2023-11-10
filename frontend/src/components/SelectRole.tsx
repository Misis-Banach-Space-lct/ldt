import {useEffect, useState} from 'react';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

interface RoleSelectProps {
    updateRole: (newRole: "admin" | "viewer") => void;
}

export default function RoleSelect({ updateRole } : RoleSelectProps) {
    const theme = useTheme();
    const [roleName, setRoleName] = useState<string>('');

    const handleChange = (event: SelectChangeEvent<string>) => {
        setRoleName(event.target.value);
    };

    useEffect(() => {
        if(roleName === 'Администратор') updateRole('admin');
        if(roleName === 'Пользователь') updateRole('viewer');
        console.log(roleName)
    }, [roleName]);

    return (
        <FormControl sx={{ width: '252px', mt: 3, backgroundColor: '#DFDFED' }}>
            <Select
                displayEmpty
                value={roleName}
                color='secondary'
                onChange={handleChange}
                input={<OutlinedInput />}
                sx={{ height: '44px' }}
                renderValue={(selected) => {
                    if (selected.length === 0) {
                        return 'Администратор';
                    }
                    return selected;
                }}
                MenuProps={MenuProps}
                inputProps={{ 'aria-label': 'Without label' }}
            >
                <MenuItem disabled value="">
                    Выберите роль
                </MenuItem>
                <MenuItem
                    value="Администратор"
                    style={{ fontWeight: roleName === "Администратор" ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular }}
                >
                    Администратор
                </MenuItem>
                <MenuItem
                    value="Пользователь"
                    style={{ fontWeight: roleName === "Пользователь" ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular }}
                >
                    Пользователь
                </MenuItem>
            </Select>
        </FormControl>
    );
}
