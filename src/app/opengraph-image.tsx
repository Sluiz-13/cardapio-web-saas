import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FCFBF8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#111827",
            color: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Seu restaurante
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#D35400", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          sob controle.
        </div>
        <div style={{ fontSize: 28, color: "#475569", marginTop: 28, maxWidth: 780 }}>
          Pedidos, mesas, caixa, estoque, fidelidade e delivery — tudo em um só lugar, sem pagar comissão por venda.
        </div>
      </div>
    ),
    { ...size }
  );
}