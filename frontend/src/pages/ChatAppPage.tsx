
import Logout from "@/components/auth/Logout";
import { useAuthStore } from "@/stores/useAuthStores";

const ChatAppPage = () => {
  const user=useAuthStore((state)=>state.user);
  return (
    <div>
      {user?.username}
      <Logout />
    </div>
  );
};

export default ChatAppPage;
