// Lightweight, self-contained confetti + toast — no provider needed.
// Client-only; safe no-op on the server.

const COLORS = ["#f59e0b", "#1f8a4c", "#3b6fd4", "#ef5a23", "#8b5cf6", "#1c1917"];

export function fireConfetti(count = 44) {
  if (typeof document === "undefined") return;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDuration = 1.4 + Math.random() * 1.3 + "s";
    piece.style.animationDelay = Math.random() * 0.25 + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    wrap.appendChild(piece);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3200);
}

export function showToast(message: string, opts?: { icon?: string; amount?: string }) {
  if (typeof document === "undefined") return;
  let host = document.querySelector(".toast-wrap");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-wrap";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML =
    (opts?.icon ? `<span style="font-size:16px">${opts.icon}</span>` : "") +
    `<span>${message}</span>` +
    (opts?.amount ? `<span class="t-amt">${opts.amount}</span>` : "");
  host.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
