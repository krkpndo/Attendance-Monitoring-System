import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/lib/api-error";
import { tokenStorage } from "@/lib/token-storage";


export const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Request: attach the bearer token if we have one.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {

    const token = tokenStorage.getAccessToken();

    if(token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
});

// Response: pass success through untouched; normalize every failure to ApiError.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {

        if (axios.isAxiosError(error) && error.response) {

            const body = error.response.data as {
                message?: string;
                code?: string;
                errors?: { field: string; message: string }[]
            };

            return Promise.reject(
                new ApiError(
                    body?.message ?? 'Request failed',
                    error.response.status,
                    body?.code,
                    body?.errors
                ),
            );
        }

        // Network error / no response (server down, CORS, timeout).
        return Promise.reject(new ApiError('Network error. Please, try again.', 0));

    }
);