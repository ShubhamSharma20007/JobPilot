import { instance } from "../utils/instance";

class AuthService {
    async verifyToken(credential: string) {
        const response = await instance.post("/auth/google/verify", { token: credential });
        return response.data;
    }
}

export const authService = new AuthService();


