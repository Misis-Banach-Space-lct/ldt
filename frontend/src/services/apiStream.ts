import { STREAM_URL } from '../config'
import axios from "axios";

type Channel = {
    url: string;
    on_demand: boolean;
    debug: boolean;
};


interface CreateStreamData {
    name: string;
    channels: {
        [key: string]: Channel;
    };
}

const ApiStream = {

    async createStream(data: CreateStreamData, uuid: string) {
        return await axios.post(`${STREAM_URL}/stream/${uuid}/add`, data);
    },
    async getAllStreams() {
        return await axios.get(`${STREAM_URL}/streams`);
    },
    async getStreamInfo(stream_id: string) {
        return await axios.get(`${STREAM_URL}/stream/${stream_id}/info`);
    },
    async deleteStream(stream_id: string) {
        return await axios.get(`${STREAM_URL}/stream/${stream_id}/delete`);
    },
};
export default ApiStream;