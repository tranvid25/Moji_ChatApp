import { Button } from "../ui/button";
import { useAuthStore } from "@/stores/useAuthStores";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin", { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="completeGhost">
      <LogOut className="text-destructive" /> Đăng Xuất
    </Button>
  );
};

export default Logout;
