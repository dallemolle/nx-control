import './globals.css';

export const metadata = {
  title: 'NEXO CONTROL',
  description: 'Gestão Inteligente e Consultoria Estratégica',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className="bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
        {children}
      </body>
    </html>
  )
}