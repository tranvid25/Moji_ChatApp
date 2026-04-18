export const authMe=async(req,res)=>{
    try {
        const user=req.user;//lấy từ middleware;
        return res.status(200).json({
            user
        });
    } catch (error) {
        
    }
}