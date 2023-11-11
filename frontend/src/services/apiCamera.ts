import axios from "axios";
import storage from "../utils/storage";
import { BASE_URL } from '../config';

interface CreateCameraData {
    groupId: number;
    url: string;
    uuid: string;
}

interface updateStreamGroupdata {
    action: string;
    cameraUuid: string;
    groupId: number;
}

const ApiCamera = {

    async getCameraData(streamId: string) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/cameras/${streamId}`, config);
    },
    async getCameraMlFrames(streamId: string) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/cameras/${streamId}/frames`, config);
    },
    async createCamera(data: CreateCameraData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }    
        return await axios.post(`${BASE_URL}/api/v1/cameras`, data, config);
    },
    async updateCameraGroup(data: updateStreamGroupdata) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }

        return await axios.post(`${BASE_URL}/api/v1/cameras/updateGroup`, data,config);
    },
    async deleteCamera(streamId: string) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.delete(`${BASE_URL}/api/v1/cameras/${streamId}`, config);
    },
};
export default ApiCamera;