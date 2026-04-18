import { registerUser } from "../services/auth/registerService.js";
import { loginUser } from "../services/auth/loginService.js";

export const signUp = async (req, res) => {
    try {
        const user=await registerUser(req.body);
        return res.status(201).json({
            message: "Đăng ký thành công",
            data:user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Lỗi server"
        });
    }
};
export const signIn=async(req,res)=>{
    try {
        const { accessToken, refreshToken, user } = await loginUser(req.body);

        // set cookie ở đây
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 14 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
            user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Lỗi server"
        });
    }
}
export const signOut=async(req,res)=>{
    try {
        //Lấy refreshToken từ cookie
        const token=req.cookie?.refreshToken;
        if(token){
            //xóa refresh token trong session
            await Session.deleteOne({refreshToken:token});
            //xóa cookie
            res.clearCookie("refreshToken");
        }
        return res.status(201);
    } catch (error) {
        console.error("Lỗi khi gọi signOut",error);
        return res.status(500).json({message:"Lỗi hệ thống"});
    }
}