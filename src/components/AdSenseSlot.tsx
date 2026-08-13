import React, { useEffect } from "react";

interface AdSenseSlotProps {
  client?: string;
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
  type?: "in-article" | "banner" | "sidebar";
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  client = "ca-pub-XXXXXXXXXXXXXXXX",
  slot = "1234567890",
  format = "auto",
  responsive = true,
  type = "banner",
  label = "스폰서 광고"
}) => {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.debug("AdSense init info:", err);
    }
  }, []);

  return (
    <div
      className={`w-full my-6 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center text-center overflow-hidden transition-all ${
        type === "sidebar" ? "min-h-[250px]" : "min-h-[100px]"
      }`}
    >
      <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-[#EEF2F6]">
        <span className="text-[11px] font-bold text-[#8A87A0] tracking-wider uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8745F]" />
          {label}
        </span>
        <span className="text-[10px] text-[#A0A3BD]">Google AdSense</span>
      </div>

      <ins
        className="adsbygoogle w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />

      {/* Development/Preview Indicator */}
      <div className="py-3 px-4 rounded-lg bg-white border border-[#E2E8F0] text-[12px] text-[#64748B] w-full mt-1">
        <p className="font-semibold text-[#334155] mb-0.5">맞춤형 연관 정책·금융 배너 영역</p>
        <p className="text-[11px] text-[#94A3B8]">AdSense 계정 승인 후 실시간 문맥 타겟팅 광고가 송출되는 구역입니다.</p>
      </div>
    </div>
  );
};
