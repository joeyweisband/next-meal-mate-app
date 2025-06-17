import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./landing/page";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/meal-plan");
  }
  return <LandingPage />;
}
