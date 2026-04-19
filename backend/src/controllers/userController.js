export const authMe=async(req,res)=>{
    try {
        const user=req.user;
        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng",error);
        return res.status(error.status || 500).json({
            message: error.message || "Lỗi server",
        });
    }
}