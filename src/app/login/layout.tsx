import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Sistema EEG",
    description: "Faça login no Sistema EEG",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
