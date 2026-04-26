import { Bell, Shield, ShieldBan } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStores";
import type { BlockCandidate } from "@/types/user";

const PrivacySettings = () => {
  const { user } = useAuthStore();
  const {
    changePassword,
    updateNotifications,
    getBlockCandidates,
    blockUser,
    unblockUser,
    getBlockedUsers,
    reportUser,
  } = useUserStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [friendRequestNoti, setFriendRequestNoti] = useState(
    user?.preferences?.notifications?.friendRequest ?? true,
  );
  const [directNoti, setDirectNoti] = useState(
    user?.preferences?.notifications?.directMessage ?? true,
  );
  const [groupNoti, setGroupNoti] = useState(
    user?.preferences?.notifications?.groupMessage ?? true,
  );

  const [blockCandidates, setBlockCandidates] = useState<BlockCandidate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockCandidate[]>([]);
  const [selectedBlockUserId, setSelectedBlockUserId] = useState("");

  const [selectedReportUserId, setSelectedReportUserId] = useState("");
  const [reportReason, setReportReason] = useState("");

  const refreshBlockData = async () => {
    try {
      const [candidates, blocked] = await Promise.all([
        getBlockCandidates(),
        getBlockedUsers(),
      ]);
      setBlockCandidates(candidates || []);
      setBlockedUsers(blocked || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chặn", error);
    }
  };

  useEffect(() => {
    setFriendRequestNoti(user?.preferences?.notifications?.friendRequest ?? true);
    setDirectNoti(user?.preferences?.notifications?.directMessage ?? true);
    setGroupNoti(user?.preferences?.notifications?.groupMessage ?? true);
  }, [
    user?.preferences?.notifications?.friendRequest,
    user?.preferences?.notifications?.directMessage,
    user?.preferences?.notifications?.groupMessage,
  ]);

  useEffect(() => {
    refreshBlockData();
  }, []);

  const availableToBlock = useMemo(
    () => blockCandidates.filter((u) => !u.isBlocked),
    [blockCandidates],
  );

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      return;
    }
    try {
      setLoadingPassword(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Lỗi đổi mật khẩu", error);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotifications({
        friendRequest: friendRequestNoti,
        directMessage: directNoti,
        groupMessage: groupNoti,
      });
    } catch (error) {
      console.error("Lỗi lưu cài đặt thông báo", error);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedBlockUserId) return;
    try {
      await blockUser(selectedBlockUserId);
      setSelectedBlockUserId("");
      await refreshBlockData();
    } catch (error) {
      console.error("Lỗi khi chặn người dùng", error);
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    try {
      await unblockUser(blockedUserId);
      await refreshBlockData();
    } catch (error) {
      console.error("Lỗi khi bỏ chặn người dùng", error);
    }
  };

  const handleReport = async () => {
    if (!selectedReportUserId || !reportReason.trim()) {
      return;
    }
    try {
      await reportUser({
        targetUserId: selectedReportUserId,
        reason: reportReason,
      });
      setReportReason("");
      setSelectedReportUserId("");
    } catch (error) {
      console.error("Lỗi khi báo cáo người dùng", error);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Quyền riêng tư & Bảo mật
        </CardTitle>
        <CardDescription>
          Quản lý đổi mật khẩu, thông báo, chặn và báo cáo
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-7">
        <div className="space-y-3">
          <h4 className="font-medium">Đổi mật khẩu</h4>
          <Input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleChangePassword}
            disabled={loadingPassword || !currentPassword || !newPassword}
          >
            <Shield className="mr-2 h-4 w-4" />
            Đổi mật khẩu
          </Button>
        </div>

        <div className="space-y-3 border-t border-border/30 pt-5">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Cài đặt thông báo
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border/40 p-3">
              <Label htmlFor="noti-friend">Thông báo lời mời kết bạn</Label>
              <Switch
                id="noti-friend"
                checked={friendRequestNoti}
                onCheckedChange={setFriendRequestNoti}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/40 p-3">
              <Label htmlFor="noti-direct">Thông báo tin nhắn riêng</Label>
              <Switch
                id="noti-direct"
                checked={directNoti}
                onCheckedChange={setDirectNoti}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/40 p-3">
              <Label htmlFor="noti-group">Thông báo tin nhắn nhóm</Label>
              <Switch
                id="noti-group"
                checked={groupNoti}
                onCheckedChange={setGroupNoti}
              />
            </div>
          </div>
          <Button variant="outline" onClick={handleSaveNotifications}>
            Lưu cài đặt thông báo
          </Button>
        </div>

        <div className="space-y-3 border-t border-border/30 pt-5">
          <h4 className="font-medium flex items-center gap-2">
            <ShieldBan className="size-4" />
            Chặn người dùng
          </h4>

          <div className="rounded-md border border-border/40 p-3 space-y-2">
            <Label htmlFor="block-user">Chọn bạn bè để chặn</Label>
            <select
              id="block-user"
              className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
              value={selectedBlockUserId}
              onChange={(e) => setSelectedBlockUserId(e.target.value)}
            >
              <option value="">-- Chọn người dùng --</option>
              {availableToBlock.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.displayName} (@{u.username})
                </option>
              ))}
            </select>
            <Button onClick={handleBlockUser} disabled={!selectedBlockUserId}>
              Chặn
            </Button>
          </div>

          <div className="rounded-md border border-border/40 p-3 space-y-2">
            <Label>Danh sách đã chặn</Label>
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa chặn ai</p>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2"
                  >
                    <div className="text-sm">
                      {u.displayName} <span className="text-muted-foreground">@{u.username}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockUser(u._id)}
                    >
                      Bỏ chặn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-border/30 pt-5">
          <h4 className="font-medium text-destructive">Báo cáo người dùng</h4>
          <select
            className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm"
            value={selectedReportUserId}
            onChange={(e) => setSelectedReportUserId(e.target.value)}
          >
            <option value="">-- Chọn người dùng --</option>
            {blockCandidates.map((u) => (
              <option key={u._id} value={u._id}>
                {u.displayName} (@{u.username})
              </option>
            ))}
          </select>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Lý do báo cáo"
          />
          <Button
            variant="destructive"
            onClick={handleReport}
            disabled={!selectedReportUserId || !reportReason.trim()}
          >
            Gửi báo cáo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
