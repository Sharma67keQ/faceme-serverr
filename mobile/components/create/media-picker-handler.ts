import { mediaService } from "@/services/media";

export type CreateMediaAttachment = {
  localUri: string;
  remoteUrl: string;
  kind: "IMAGE" | "VIDEO";
};

type PickCreateMediaOptions = {
  kind: "image" | "video";
  onStart?: () => void;
  onComplete: (attachment: CreateMediaAttachment) => void;
  onError?: () => void;
  onFinally?: () => void;
};

export const pickCreateMedia = async ({
  kind,
  onStart,
  onComplete,
  onError,
  onFinally,
}: PickCreateMediaOptions) => {
  try {
    onStart?.();
    const asset = await mediaService.pickFromLibrary(kind);

    if (!asset) {
      return;
    }

    const uploaded = await mediaService.uploadAsset(asset, kind);
    onComplete({
      localUri: asset.uri,
      remoteUrl: uploaded.secureUrl,
      kind: uploaded.mediaKind === "VIDEO" ? "VIDEO" : "IMAGE",
    });
  } catch {
    onError?.();
  } finally {
    onFinally?.();
  }
};
