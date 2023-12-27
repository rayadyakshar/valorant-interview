export class AuthenticationManager {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request(url: string, options = {}): Promise<Response> {
        const defaultOptions = {
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            referrerPolicy: "no-referrer"
        };

        return fetch(this.baseUrl + url, { ...defaultOptions, ...options });
    }

    public async isLoggedIn(): Promise<boolean> {
        try {
            const token = localStorage.getItem("auth_token");
            const valid = await this.validateToken(token);
            if (!valid) {
                localStorage.removeItem("auth_token");
            }
            return valid;
        } catch (error) {
            console.error("Error validating token: ", error);
            localStorage.removeItem("auth_token");
            return false;
        }
    }

    private async validateToken(token: string): Promise<boolean> {
        const response = await this.request("/validateToken", {
            method: "POST",
            body: JSON.stringify({ token }),
        });
        return response.ok;
    }

    public async login(username: string, password: string, rememberMe: boolean): Promise<any> {
        try {
            const loginResponse = await this.request("/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            if (!loginResponse.ok) {
                throw new Error("Login failed");
            }

            if (rememberMe) {
                const token = await loginResponse.json();
                localStorage.setItem("auth_token", token);
            }

            const profileResponse = await this.request("/profile/" + username);
            const rolesResponse = await this.request("/roles/" + username);

            const profile = await profileResponse.json();
            const roles = await rolesResponse.json();

            return { profile, roles };
        } catch (error) {
            console.error("Login error: ", error);
            throw error;
        }
    }

    public async getProfileForLoggedInUser(): Promise<any> {
        try {
            const token = localStorage.getItem("auth_token");
            const userResponse = await this.request("/get?token=" + token);
            const { username } = await userResponse.json();

            const profileResponse = await this.request("/profile/" + username);
            const rolesResponse = await this.request("/roles/" + username);

            const profile = await profileResponse.json();
            const roles = await rolesResponse.json();

            return { profile, roles };
        } catch (error) {
            console.error("Error fetching profile: ", error);
            throw error;
        }
    }

    public async logout(): Promise<void> {
        try {
            const token = localStorage.getItem("auth_token");
            await this.request("/logout", {
                method: "POST",
                body: JSON.stringify({ token }),
            });
            localStorage.removeItem("auth_token");
        } catch (error) {
            console.error("Logout error: ", error);
            throw error;
        }
    }
}
