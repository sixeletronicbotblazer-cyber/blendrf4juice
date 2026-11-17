"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BlendrLanding from "@/components/blendr/landing";
import BlendrProduct from "@/components/blendr/product";

function PageSwitch() {
  const params = useSearchParams();
  const page = params.get("page");
  if (page === "product") {
    return <BlendrProduct />;
  }
  return <BlendrLanding />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <PageSwitch />
    </Suspense>
  );
}
