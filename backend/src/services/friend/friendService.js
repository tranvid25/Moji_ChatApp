import FriendRequest from "../../models/FriendRequest.js";
import Friend from "../../models/Friend.js";
import User from "../../models/User.js";

export const sendFriendRequestService = async (from, to, messages) => {
  //Không gửi cho chính mình
  if (from.toString() === to.toString()) {
    throw new Error("SELF_REQUEST");
  }
  const userExists = await User.exists({ _id: to });
  if (!userExists) {
    throw new Error("USER_NOT_FOUND");
  }
  //chuẩn hóa tránh duplicate request
  let userA = from.toString();
  let userB = to.toString();
  if (userA > userB) {
    [userA, userB] = [userB, userA];
  }
  const [alreadyFriends, existingRequest] = await Promise.all([
    Friend.findOne({ userA, userB }),
    FriendRequest.findOne({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    }),
  ]);
  if (alreadyFriends) {
    throw new Error("ALREADY_FRIENDS");
  }
  if (existingRequest) {
    throw new Error("REQUEST_ALREADY_EXISTS");
  }
  const request = await FriendRequest.create({ from, to, messages });
  return request;
};
export const acceptFriendRequestService = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);
  //Tìm request
  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }
  //Check có quyền chỉ người nhận mới có quyền accept
  if (request.to.toString() !== userId.toString()) {
    throw new Error("UNAUTHORIZED_ACCESS");
  }
  //Check request đã được accept chưa
  const existingFriend = await Friend.findOne({
    $or: [
      { userA: request.from, userB: request.to },
      { userA: request.to, userB: request.from },
    ],
  });
  if (existingFriend) {
    throw new Error("REQUEST_ALREADY_ACCEPTED");
  }
  await Friend.create({ userA: request.from, userB: request.to });
  await FriendRequest.findByIdAndDelete(requestId);
  const fromUser = await User.findById(request.from)
    .select("_id displayName avatarUrl")
    .lean();
  return fromUser;
};
export const declineFriendRequestService = async (userId, requestId) => {
  const request = await FriendRequest.findById(requestId);
  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }
  if (request.to.toString() !== userId.toString()) {
    throw new Error("UNAUTHORIZED_ACCESS");
  }
  await FriendRequest.findByIdAndDelete(requestId);
  return {
    message: "Yêu cầu kết bạn đã được từ chối thành công",
  };
};
export const getAllFriendsService = async (userId) => {
  const friendships = await Friend.find({
    $or: [{ userA: userId }, { userB: userId }],
  })
    .populate("userA", "_id displayName avatarUrl")
    .populate("userB", "_id displayName avatarUrl")
    .lean();
  if (!friendships || friendships.length === 0) {
    throw new Error("NO_FRIENDS");
  }
  const friends = friendships.map((f) =>
    f.userA._id.toString() === userId.toString() ? f.userB : f.userA,
  );
  return friends;
};
