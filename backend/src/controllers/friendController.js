import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import {
  acceptFriendRequestService,
  declineFriendRequestService,
  getAllFriendsService,
  sendFriendRequestService,
} from "../services/friend/friendService.js";
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    const request = await sendFriendRequestService(from, to, message);

    return res.status(200).json({
      message: "Yêu cầu kết bạn đã được gửi thành công",
      request,
    });
  } catch (error) {
    console.error(error);

    // mapping lỗi
    switch (error.message) {
      case "SELF_REQUEST":
        return res
          .status(400)
          .json({ message: "Không thể gửi cho chính mình" });

      case "USER_NOT_FOUND":
        return res.status(404).json({ message: "Người dùng không tồn tại" });

      case "ALREADY_FRIENDS":
        return res.status(400).json({ message: "Đã là bạn bè" });

      case "REQUEST_ALREADY_EXISTS":
        return res.status(400).json({ message: "Yêu cầu đã tồn tại" });

      default:
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  }
};
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const fromUser = await acceptFriendRequestService(requestId, userId);
    return res.status(200).json({
      message: "Yêu cầu kết bạn đã được chấp nhận thành công",
      newFriend: {
        _id: fromUser._id,
        displayName: fromUser?.displayName,
        avatarUrl: fromUser?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận yêu cầu kết bạn", error);
    switch (error.message) {
      case "REQUEST_NOT_FOUND":
        return res
          .status(404)
          .json({ message: "Không tìm thấy lời mời kết bạn này" });

      case "FORBIDDEN":
        return res
          .status(403)
          .json({ message: "Bạn không có quyền chấp nhận lời mời này" });

      case "ALREADY_FRIENDS":
        return res
          .status(400)
          .json({ message: "Đã là bạn bè với người dùng này rồi" });

      default:
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  }
};
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    await declineFriendRequestService(requestId, userId);
    return res.status(200).json({
      message: "Yêu cầu kết bạn đã được từ chối thành công",
    });
  } catch (error) {
    console.error("Lỗi khi từ chối yêu cầu kết bạn", error);
    switch (error.message) {
      case "REQUEST_NOT_FOUND":
        return res
          .status(404)
          .json({ message: "Không tìm thấy lời mời kết bạn này" });

      case "UNAUTHORIZED_ACCESS":
        return res
          .status(403)
          .json({ message: "Bạn không có quyền từ chối lời mời này" });

      default:
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  }
};
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const friends = await getAllFriendsService(userId);
    return res.status(200).json({
      friends,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const [sentRequestsRaw, receivedRequestsRaw] = await Promise.all([
      FriendRequest.find({ from: userId })
        .populate("to", "_id displayName avatarUrl username")
        .lean(),
      FriendRequest.find({ to: userId })
        .populate("from", "_id displayName avatarUrl username")
        .lean(),
    ]);

    const sent = sentRequestsRaw.map((request) => ({
      ...request,
      user: request.to,
    }));

    const received = receivedRequestsRaw.map((request) => ({
      ...request,
      user: request.from,
    }));

    return res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
