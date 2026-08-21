// Flag to control AdSense rendering (false by default until account approval)
export const ADSENSE_ENABLED = false;

interface AdSenseUnitProps {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
  label?: string;
  className?: string;
  responsive?: boolean;
}

/**
 * AdSenseUnit Component
 * In pre-approval state, it returns null to prevent displaying unsightly placeholder boxes or dummy ads.
 * Once approved, setting ADSENSE_ENABLED = true will render compliant <ins className="adsbygoogle" /> units.
 */
export function AdSenseUnit({
  slot = "1234567890",
  format = "auto",
  className = "",
  responsive = true,
}: AdSenseUnitProps) {
  if (!ADSENSE_ENABLED) {
    return null;
  }

  return (
    <div
      className={`my-6 mx-auto w-full overflow-hidden text-center ${className}`}
      aria-label="광고 영역"
    >
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9552509372228899"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

