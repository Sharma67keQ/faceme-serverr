import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { chatService } from "@/services/chat";
import { useAuthStore } from "@/store/auth-store";
import { logger } from "@/utils/logger";

export const RealtimeBridge = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      return;
    }

    const socket = chatService.connect(accessToken);
    if (!socket) {
      logger.error("Realtime bridge could not initialize socket");
      return;
    }

    const invalidateFeed = () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["public-profile-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["group-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["page-posts"] });
    };

    const invalidateStatus = () => {
      void queryClient.invalidateQueries({ queryKey: ["status"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    };

    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["launch-summary"] });
    };
    const invalidateMarketplace = () => {
      void queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
    };
    const invalidateWallet = () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    };

    socket.on("feed:changed", invalidateFeed);
    socket.on("status:changed", invalidateStatus);
    socket.on("notifications:changed", invalidateNotifications);
    socket.on("marketplace:changed", invalidateMarketplace);
    socket.on("wallet:changed", invalidateWallet);

    return () => {
      socket.off("feed:changed", invalidateFeed);
      socket.off("status:changed", invalidateStatus);
      socket.off("notifications:changed", invalidateNotifications);
      socket.off("marketplace:changed", invalidateMarketplace);
      socket.off("wallet:changed", invalidateWallet);
    };
  }, [accessToken, isHydrated, queryClient]);

  return null;
};
