import api from "@/lib/axios";
export const authService = {
  signUp: async (
    lastname: string,
    firstname: string,
    username: string,
    email: string,
    password: string,
  ) => {
    const res = await api.post(
      "/auth/signup",
      { lastname, firstname, username, email, password },
      { withCredentials: true },
    );
    return res.data;
  },
  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "/auth/login",
      { username, password },
      { withCredentials: true },
    );
    return res.data;
  },
  signOut: async () => {
    return await api.post("/auth/signout", {}, { withCredentials: true });
  },
  fetchMe:async ()=>{
    const res=await api.get("/user/me",{withCredentials:true});
    return res.data.user;
  },
  refresh:async () =>{
    const res=await api.post('/auth/refresh',{},{withCredentials:true});
    return res.data.accessToken;
  }
};
