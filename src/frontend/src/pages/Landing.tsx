import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { hyperspeedPresets } from "../lib/hyperspeedPresets";
import Hyperspeed from "../components/ui/Hyperspeed";
import BlurText from "../components/ui/BlurText";

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="relative min-h-screen">
      {/* Hyperspeed Background */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed effectOptions={hyperspeedPresets.one} />
      </div>

      {/* Foreground Content */}
  <div className="relative z-10">

        {/* Hero Section */}
  <section className="relative py-20 sm:py-32 min-h-[70vh]">
          <div className="mx-auto px-4 relative z-10">
            <div className="text-center text-white space-y-6 animate-fade-in">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight space-y-2 text-center">
                <BlurText text="Spark Your" delay={120} animateBy="words" direction="top" className="justify-center" />
                <BlurText text="Creative ideas" delay={260} animateBy="words" direction="top" className="justify-center" />
              </div>
              <div className="mt-4">
                <BlurText
                  text="Join the community of innovators. Collect, vote, and showcase college fest ideas that inspire and transform."
                  delay={80}
                  animateBy="words"
                  direction="top"
                  className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <Link to="/ideas">
                <Button size="lg" className="bg-pink-500 hover:bg-pink-500/70  text-primary text-lg px-8 py-3">
                  Explore Ideas
                </Button>
                </Link>
                <Link to="/submit">
                  <Button  size="lg" className="border-white hover:bg-purple-700/70 text-white bg-purple-700 hover:text-primary text-lg px-8 py-3">
                    Submit Your Idea
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        {/* <footer className="bg-muted/30 backdrop-blur-sm py-12">
          <div className="container mx-auto px-4 text-center text-white">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/logo.png" alt="Gamesta" className="h-8 w-8 object-contain rounded" />
              <span className="text-xl font-bold">Gamesta</span>
            </div>
            <p className="text-muted-foreground">
              Empowering creativity and innovation in college communities.
            </p>
          </div>
        </footer> */}
      </div>
    </div>
  );
}
