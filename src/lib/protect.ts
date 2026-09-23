/**
 * Client-side content protection.
 * Deters casual copying: no right-click, no text/image selection or drag,
 * no devtools shortcuts, and a redirect when devtools appear to be open.
 */
export function enableProtection() {
  if (typeof window === "undefined") return () => {};
  if (import.meta.env.DEV) return () => {};

  const stop = (e: Event) => {
    e.preventDefault();
    return false;
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const blocked =
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
      (e.metaKey && e.altKey && ["i", "j", "c"].includes(k)) ||
      (e.ctrlKey && ["u", "s", "p"].includes(k)) ||
      (e.metaKey && ["u", "s", "p"].includes(k));
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return undefined;
  };

  document.addEventListener("contextmenu", stop);
  document.addEventListener("selectstart", stop);
  document.addEventListener("dragstart", stop);
  document.addEventListener("copy", stop);
  document.addEventListener("cut", stop);
  document.addEventListener("keydown", onKey, true);

  // Devtools detection (window size delta + debugger timing).
  let tripped = false;
  const panic = () => {
    if (tripped) return;
    tripped = true;
    document.documentElement.innerHTML =
      '<div style="font-family:Cairo,sans-serif;direction:rtl;display:flex;height:100vh;align-items:center;justify-content:center;background:#0b1220;color:#fff;font-size:18px">تم إيقاف الصفحة لأسباب أمنية</div>';
    window.location.replace("about:blank");
  };

  const check = () => {
    const widthGap = window.outerWidth - window.innerWidth > 180;
    const heightGap = window.outerHeight - window.innerHeight > 200;
    if (widthGap || heightGap) panic();
    const t0 = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - t0 > 120) panic();
  };

  const timer = window.setInterval(check, 1500);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("contextmenu", stop);
    document.removeEventListener("selectstart", stop);
    document.removeEventListener("dragstart", stop);
    document.removeEventListener("copy", stop);
    document.removeEventListener("cut", stop);
    document.removeEventListener("keydown", onKey, true);
  };
}
