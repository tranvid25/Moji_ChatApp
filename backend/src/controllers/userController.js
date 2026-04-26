import User from "../models/User.js";

export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng", error);
    return res.status(error.status || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};
export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim() === "") {
      return res.status(400).json({
        message: "Cần cung cấp username trong query .",
      });
    }
    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl",
    );
    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng", error);
    return res.status(error.status || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};
export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;
    if (!file) {
      return res.status(400).json({
        message: "Không tìm thấy file ảnh",
      });
    }
    const result = await uploadImageFromBuffer(file.buffer);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      { new: true },
    ).select("avatarUrl");
    if (!updatedUser.avatarUrl) {
      return res.status(400).json({
        message: "Không thể cập nhật ảnh đại diện",
      });
    }
    return res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật ảnh đại diện", error);
    return res.status(error.status || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};
