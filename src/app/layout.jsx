import "./globals.css";

export const metadata = {
  title: "LedgerVision · Mobile demo studio",
  description: "An interactive mobile finance demo with voice-to-invoice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
