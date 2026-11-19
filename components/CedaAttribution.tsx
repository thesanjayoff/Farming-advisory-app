// Required by CEDA's API terms (https://ceda.ashoka.edu.in/api-terms-conditions/)
// whenever CEDA-sourced data is shown: a visible credit line. Keep this next
// to any price panel that may be using the CEDA fallback provider.
export function CedaAttribution() {
  return (
    <p className="text-xs text-neutral-500">
      Price data (fallback): CEDA at Ashoka University —{" "}
      <a href="https://ceda.ashoka.edu.in/" className="underline" target="_blank" rel="noreferrer">
        ceda.ashoka.edu.in
      </a>
    </p>
  );
}
