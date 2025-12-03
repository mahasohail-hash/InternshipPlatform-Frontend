'use client';

import { Button } from "antd";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href: string;
  label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Button type="link" className="w-full" onClick={() => router.push(href)}>
      {label}
    </Button>
  );
};
