export const authStore = {
  getToken: () => (typeof window === "undefined" ? "" : localStorage.getItem("skillsync_token") || ""),
  setSession: (token: string, user: unknown) => {
    localStorage.setItem("skillsync_token", token);
    localStorage.setItem("skillsync_user", JSON.stringify(user));
  },
  getUser: <T>() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("skillsync_user");
    return raw ? (JSON.parse(raw) as T) : null;
  },
  logout: () => {
    localStorage.removeItem("skillsync_token");
    localStorage.removeItem("skillsync_user");
  },
};
