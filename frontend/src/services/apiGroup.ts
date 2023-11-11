import axios from "axios";
import storage from "../utils/storage";
import { BASE_URL } from '../config';


interface CreateGroupData {
    title: string;
}

interface GetAllGroupsData {
    limit: number;
}

const ApiGroup = {

    async createGroup(data: CreateGroupData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios
            .post(`${BASE_URL}/api/v1/groups`, { title: data.title }, config);
    },
    async getAllGroups(data: GetAllGroupsData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/groups?offset=0&limit=${data.limit}`, config);
    },
    async deleteGroup(groupId: number) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.delete(`${BASE_URL}/api/v1/groups/${groupId}`, config);
    },
};
export default ApiGroup;