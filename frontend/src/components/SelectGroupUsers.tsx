import { useEffect, useState } from 'react';
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


interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface GroupSelectProps {
    updateGroupId: (newGroupId: number) => void;
    fetchedGroups: allGroups[];
}

export default function SingleSelectPlaceholder({ updateGroupId, fetchedGroups }: GroupSelectProps) {
    const theme = useTheme();
    const [groupName, setGroupName] = useState<string>('');
    const [groupId, setGroupId] = useState<number>();

    const handleChange = (event: SelectChangeEvent<string>) => {
        setGroupName(event.target.value);
        const group = fetchedGroups?.find(group => group.title === event.target.value);
        if (group) {
            setGroupId(group.id);
        }
    };

    useEffect(() => {
        if(groupId) updateGroupId(groupId);
    }, [groupId]);

    return (
        <FormControl sx={{ width: '252px', mt: 3, backgroundColor: '#DFDFED' }}>
            <Select
                displayEmpty
                value={groupName}
                color='secondary'
                onChange={handleChange}
                input={<OutlinedInput />}
                sx={{ height: '44px' }}
                renderValue={(selected) => {
                    if (selected.length === 0) {
                        return 'Выберите группу';
                    }
                    return selected;
                }}
                MenuProps={MenuProps}
                inputProps={{ 'aria-label': 'Without label' }}
            >
                <MenuItem disabled value="">
                    Выберите группу
                </MenuItem>
                {fetchedGroups?.map((group) => (
                    <MenuItem
                        key={group.id}
                        value={group.title}
                        style={{ fontWeight: groupName === group.title ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular }}
                    >
                        {group.title}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
