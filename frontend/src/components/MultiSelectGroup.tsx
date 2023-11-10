import {useEffect, useState} from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ApiGroup from '../services/apiGroup';

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


function getStyles(name: string, groupName: readonly string[], theme: Theme) {
    return {
        fontWeight:
            groupName.indexOf(name) === -1
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
}

interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export default function MultipleSelectPlaceholder() {
    const theme = useTheme();
    const [groupName, setgroupName] = useState<string[]>([]);
    const [fetchedGroups, setFetchedGroups] = useState<allGroups[]>();

    const handleChange = (event: SelectChangeEvent<typeof groupName>) => {
        const {
            target: { value },
        } = event;
        setgroupName(
            typeof value === 'string' ? value.split(',') : value,
        );
    };


    useEffect(() => {
        const fetchGroups = async () => {
            let result = await ApiGroup.getAllGroups({
                limit: 100,
            });
    
            setFetchedGroups(result.data);
        };
        fetchGroups();
    }, []);    



    return (
        <FormControl sx={{ width: '252px', mt: 3, backgroundColor: '#DFDFED' }}>
            <Select
                multiple
                displayEmpty
                value={groupName}
                color='secondary'
                onChange={handleChange}
                input={<OutlinedInput />}
                sx={{ height: '44px' }}
                renderValue={(selected) => {
                    if (selected.length === 0) {
                        return 'Выберете группы';
                    }
                    return selected.join(', ');
                }}
                MenuProps={MenuProps}
                inputProps={{ 'aria-label': 'Without label' }}
            >
                <MenuItem disabled value="">
                    Выберите группы
                </MenuItem>
                {fetchedGroups?.map((group) => (
                    <MenuItem
                        key={group.id}
                        value={group.title}
                        style={getStyles(group.title, groupName, theme)}
                    >
                        {group.title}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}