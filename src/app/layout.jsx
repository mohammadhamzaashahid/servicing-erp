import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Saroya Chemicals",
  description: "Saroya Chemicals portal for inventory, production, sales, and accounting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}