import { AccessControlNav } from "@/components/settings/access-control-nav";

export default function AccessControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}
