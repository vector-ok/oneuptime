import axios from 'axios';
import config from './config';

const _this = {
    getHeaders: () => {
        return {
            'Access-Control-Allow-Origin': '*',
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
            containerScannerName: config.containerScannerName,
            containerScannerKey: config.containerScannerKey,
            clusterKey: config.clusterKey,
            containerScannerVersion: config.containerScannerVersion,
        };
    },
    postApi: (url: string, data: $TSFixMe) => {
        const headers = _this.getHeaders();

        return new Promise((resolve, reject) => {
            axios({
                method: 'POST',
                url: `${config.serverUrl}/${url}`,
                headers,
                data,
            })
                .then(response => {
                    resolve(response.data);
                })
                .then(error => {
                    if (error && error.response && error.response.data)
                        error = error.response.data;
                    if (error && error.data) {
                        error = error.data;
                    }
                    reject(error);
                });
        });
    },

    getApi: (url: string) => {
        const headers = _this.getHeaders();
        return new Promise((resolve, reject) => {
            axios({
                method: 'GET',
                url: `${config.serverUrl}/${url}`,
                headers,
            })
                .then(response => {
                    resolve(response.data);
                })
                .then(error => {
                    if (error && error.response && error.response.data)
                        error = error.response.data;
                    if (error && error.data) {
                        error = error.data;
                    }
                    reject(error);
                });
        });
    },

    putApi: (url: string, data: $TSFixMe) => {
        const headers = _this.getHeaders();
        return new Promise((resolve, reject) => {
            axios({
                method: 'PUT',
                url: `${config.serverUrl}/${url}`,
                headers,
                data,
            })
                .then(response => {
                    resolve(response.data);
                })
                .then(error => {
                    if (error && error.response && error.response.data)
                        error = error.response.data;
                    if (error && error.data) {
                        error = error.data;
                    }
                    reject(error);
                });
        });
    },

    deleteApi: (url: string, data: $TSFixMe) => {
        const headers = _this.getHeaders();
        return new Promise((resolve, reject) => {
            axios({
                method: 'DELETE',
                url: `${config.serverUrl}/${url}`,
                headers,
                data,
            })
                .then(response => {
                    resolve(response.data);
                })
                .then(error => {
                    if (error && error.response && error.response.data)
                        error = error.response.data;
                    if (error && error.data) {
                        error = error.data;
                    }
                    reject(error);
                });
        });
    },
};

export default _this;
