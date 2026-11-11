import { useMemo } from "react";
import qrcode from "qrcode-generator";

// Shown on display accounts so people can scan it with their phone and open the same page.
export function DisplayQr({ url }: { url: string }) {
  const svg = useMemo(() => {
    const code = qrcode(0, "M");
    code.addData(url);
    code.make();
    return code.createSvgTag({ cellSize: 6, margin: 4, scalable: true });
  }, [url]);

  return (
    <aside className="display-qr" aria-label="Scan to log in on your phone">
      <div className="display-qr-code" dangerouslySetInnerHTML={{ __html: svg }} />
    </aside>
  );
}
