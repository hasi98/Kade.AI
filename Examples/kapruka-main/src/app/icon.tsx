import { ImageResponse } from "next/og";
import { KAPU_COLORS } from "@/lib/kapu-brand";
import { TreeMark } from "@/components/shared/KapuAvatar";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${KAPU_COLORS.gradientStart}, ${KAPU_COLORS.gradientEnd})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: KAPU_COLORS.mark,
      }}
    >
      <TreeMark size={25} />
    </div>,
    { width: 32, height: 32 },
  );
}
