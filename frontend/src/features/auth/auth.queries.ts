import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./auth.context";
import type { LoginRequest, LoginResponse } from "./auth.schema";
import type { ApiError } from "@/lib/api-error";
import { login } from "./auth.api";

export function useLogin() {
    const { setSession } = useAuth();

    return useMutation<LoginResponse, ApiError, LoginRequest>({
        mutationFn: login,
        onSuccess: (data) => {
            setSession(data)
        }
    });
}