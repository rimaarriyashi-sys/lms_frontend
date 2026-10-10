"use client";

import { useState } from "react";
import LoginModal, { type LoginRole } from "@/components/LoginModal";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Majors from "@/components/landing/Majors";
import About from "@/components/landing/About";
import Faq from "@/components/landing/Faq";
import Roles from "@/components/landing/Roles";
import StatsBand from "@/components/landing/StatsBand";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [initialRole, setInitialRole] = useState<LoginRole | undefined>();

  function openLogin(role?: LoginRole) {
    setInitialRole(role);
    setIsLoginOpen(true);
  }

  return (
    <>
      <Header onOpenLogin={() => openLogin()} />
      <main>
        <Hero onOpenLogin={() => openLogin()} />
        <StatsBand />
        <Features />
        <Majors />
        <Roles onOpenLogin={openLogin} />
        <About />
        <Faq />
      </main>
      <Footer onOpenLogin={() => openLogin()} />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        initialRole={initialRole}
      />
    </>
  );
}