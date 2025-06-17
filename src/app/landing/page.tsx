"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div style={{ maxWidth: 1200, margin: "32px auto", padding: 24 }}>
      <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 32 }}>
        <img
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=60"
          alt="MealMate Hero"
          width={1800}
          height={300}
          style={{ width: "100%", height: 300, objectFit: "cover" }}
        />
      </div>
      <h1 style={{ textAlign: "center", fontSize: 48, fontWeight: 700, marginBottom: 8 }}>MealMate</h1>
      <div style={{ textAlign: "center", fontSize: 20, color: "#666", marginBottom: 40 }}>
        Your AI-powered meal planning assistant
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto 48px auto" }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Personalized Meal Plans</div>
        <div style={{ fontSize: 17, color: "#444", marginBottom: 24 }}>
          Get custom meal plans based on your dietary preferences, fitness goals, and restrictions.
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Track Your Progress</div>
        <div style={{ fontSize: 17, color: "#444", marginBottom: 24 }}>
          Monitor your nutrition intake and stay on track with your health goals.
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Discover New Recipes</div>
        <div style={{ fontSize: 17, color: "#444", marginBottom: 40 }}>
          Explore a variety of delicious and healthy recipes tailored to your preferences.
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button
          style={{
            width: "100%",
            background: "#5396f7",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "20px 0",
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 16,
            cursor: "pointer",
          }}
          onClick={() => router.push("/sign-up")}
        >
          Create Account
        </button>
        <button
          style={{
            width: "100%",
            background: "#f7faff",
            color: "#5396f7",
            border: "1.5px solid #5396f7",
            borderRadius: 12,
            padding: "20px 0",
            fontSize: 22,
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={() => router.push("/sign-in")}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
