import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Servicing ERP",
  description: "Micro ERP portal for inventory, production, sales, and accounting",
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