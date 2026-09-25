import { LandingHero, HomeBackground } from "@/components/landing/hero";
import { Footer } from "@/components/shared/footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <HomeBackground>
        <LandingHero />
        <Footer />
      </HomeBackground>
    </main>
  );
}
