"use client";

import { Button } from "~/components/ui/button";
// Removed unused Card imports to satisfy lint rules
import Image from "next/image"; // Import Image component
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Recycle,
  ShieldCheck,
  ShoppingCart,
  Wrench,
  Zap,
  Euro,
  Clock,
  Award,
  TrendingUp,
  Star,
  Users,
  Sparkles,
  Monitor
} from "lucide-react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import Link from "next/link";

type ListingWithSeller = RouterOutputs['listings']['getActiveCompanyListings'][number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const FeatureCard = ({ icon, title, description, highlight }: {
  icon: React.ReactNode,
  title: string,
  description: string,
  highlight?: boolean
}) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
    className={`relative group cursor-pointer ${highlight ? 'md:scale-105' : ''}`}
    whileHover={{ scale: highlight ? 1.08 : 1.05 }}
  >
    <div className={cn(
      "relative backdrop-blur-xl border p-8 rounded-2xl text-center overflow-hidden",
      highlight
        ? "bg-gradient-to-br from-[var(--color-surface-2)]/30 to-[var(--color-surface-3)]/30 border-[var(--color-primary)]/50 shadow-2xl shadow-[var(--color-primary)]/20"
        : "bg-[var(--color-surface-2)]/50 border-[var(--color-border)]/50"
    )}>
      {/* Animated background */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-tertiary)]/5 to-transparent opacity-0 transition-all duration-500",
        "group-hover:opacity-100"
      )}></div>

      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-500",
        highlight ? "bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-tertiary)]/10" : "bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10",
        "group-hover:opacity-100"
      )}></div>

      <div className="relative z-10">
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all duration-300",
          highlight
            ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-tertiary)] shadow-lg shadow-[var(--color-primary)]/25"
            : "bg-[var(--color-surface-3)]/50 group-hover:from-[var(--color-primary)] group-hover:to-[var(--color-secondary)]"
        )}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-accent-light)] transition-colors">
          {title}
        </h3>
        <p className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

const ProductCard = ({ listing }: { listing: ListingWithSeller }) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
    className="h-full">
    <Link href={`/osta/${listing.id}`} className="block h-full group">
      <div className={cn(
        "relative backdrop-blur-xl border rounded-2xl p-6 h-full flex flex-col overflow-hidden transition-all duration-300",
        "bg-[var(--color-surface-2)]/60 border-[var(--color-border)]/50",
        "hover:border-[var(--color-primary)]/50 hover:shadow-2xl hover:shadow-[var(--color-primary)]/10 hover:-translate-y-1"
      )}>
        {/* Glow effect on hover */}
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-tertiary)]/5 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100"
        )}></div>

        {/* Image Display or Placeholder */}
        <div className="relative w-full aspect-video rounded-t-xl overflow-hidden mb-4 border-b border-[var(--color-border)]">
          {listing.images && listing.images.length > 0 ? (
            <Image
              src={listing.images[0]}
              alt={listing.title || "Product image"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-surface-3)] flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-[var(--color-neutral)]/50">
                <span className="text-5xl font-extrabold italic bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">R</span>
                <span className="text-sm mt-1">Ei kuvaa</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-grow">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-light)] transition-colors line-clamp-2">
              {listing.title}
            </h3>
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[var(--color-success)]/50 text-[var(--color-success-light)] rounded-full">
                <Sparkles className="w-3 h-3 mr-1" />
                Refurb
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-[var(--color-text-secondary)]">
              <Cpu className="w-4 h-4 mr-2 text-[var(--color-primary)]" />
              <span className="truncate">{listing.cpu}</span>
            </div>
            <div className="flex items-center text-sm text-[var(--color-text-secondary)]">
              <Monitor className="w-4 h-4 mr-2 text-[var(--color-tertiary)]" />
              <span className="truncate">{listing.gpu}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="text-right flex-grow">
            <p className="text-3xl font-bold text-gradient-primary">
              {parseFloat(listing.basePrice)}€
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">12kk takuu</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors ml-3" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const StatCard = ({ value, label, icon }: { value: string, label: string, icon: React.ReactNode }) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
    className="text-center p-6 rounded-xl bg-[var(--color-surface-2)]/30 backdrop-blur-sm border border-[var(--color-border)]/30"
  >
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 mb-3">
      {icon}
    </div>
    <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{value}</div>
    <div className="text-[var(--color-text-secondary)] text-sm">{label}</div>
  </motion.div>
);

export default function HomePage() {
  const { data: listings, isLoading } = api.listings.getActiveCompanyListings.useQuery({ limit: 6 });

  return (
    <div className="bg-[var(--color-surface-1)] text-[var(--color-text-primary)] min-h-screen">
      {/* Hero Section - Enhanced */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-surface-1)]"></div>

          {/* Animated gradient orbs */}
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-tertiary)]/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[var(--color-tertiary)]/20 to-[var(--color-accent)]/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-[var(--color-quaternary)]/20 to-[var(--color-primary)]/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary-dark)]/50 to-[var(--color-tertiary)]/50 border border-[var(--color-primary)]/30 mb-8">
              <Sparkles className="w-4 h-4 text-[var(--color-primary-light)] mr-2" />
              <span className="text-sm text-[var(--color-primary-light)] font-medium">Suomen luotetuin refurb-toimija</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-text-secondary)] to-[var(--color-text-primary)]">
                Pelikoneet
              </span>
              <span className="block text-gradient-primary">
                Uudella Tasolla
              </span>
            </h1>

            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed">
              Hanki premium-tason gaming-PC puoleen hintaan tai myy omasi
              <span className="text-gradient-primary font-semibold"> hetkessä</span> –
              12 kuukauden takuulla ja ympäristöä säästäen.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              asChild
              size="lg"
              className="group relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-tertiary)]/90 text-white font-bold text-lg px-10 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-primary)]/25 border-0"
            >
              <Link href="/osta">
                <span className="relative z-10 flex items-center">
                  Selaa Koneita
                  <ShoppingCart className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-primary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-primary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Link href="/myy">
                <span className="flex items-center">
                  Myy Heti - Saa Tarjous
                  <Euro className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                </span>
              </Link>
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StatCard value="500+" label="Tyytyväistä asiakasta" icon={<Users className="w-6 h-6 text-[var(--color-primary-light)]" />} />
            <StatCard value="12kk" label="Takuu kaikille" icon={<ShieldCheck className="w-6 h-6 text-[var(--color-success)]" />} />
            <StatCard value="24h" label="Nopea käsittely" icon={<Clock className="w-6 h-6 text-[var(--color-tertiary)]" />} />
            <StatCard value="4.9/5" label="Asiakastyytyväisyys" icon={<Star className="w-6 h-6 text-[var(--color-warning)]" />} />
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products Section - Enhanced */}
      <section className="py-section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-1)] to-[var(--color-surface-2)]"></div>
        <div className="container mx-auto px-container relative">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-2xl pb-10"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-secondary-dark)]/50 to-[var(--color-primary-dark)]/50 border border-[var(--color-secondary)]/30 mb-6">
              <TrendingUp className="w-4 h-4 text-[var(--color-secondary-light)] mr-2" />
              <span className="text-sm text-[var(--color-secondary-light)] font-medium">Kuumimmat tarjoukset</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-center">
              <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
                Peli-Koneet
              </span>
              <span className="block sm:inline text-gradient-primary sm:pl-2">
                Valmiina Toimintaan
              </span>
            </h2>

            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Jokainen kone on ammattilaistemme tarkistama, testattu ja optimoitu.
              Pelaaminen voi alkaa heti laatikon avaamisesta.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[var(--color-surface-2)]/50 rounded-2xl p-6 h-64 animate-pulse">
                  <div className="h-4 bg-[var(--color-surface-3)] rounded mb-4"></div>
                  <div className="h-3 bg-[var(--color-surface-3)] rounded mb-2"></div>
                  <div className="h-3 bg-[var(--color-surface-3)] rounded mb-6"></div>
                  <div className="h-8 bg-[var(--color-surface-3)] rounded w-24 ml-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-2xl"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {listings?.map((listing: ListingWithSeller) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </motion.div>
          )}

          <div className="text-center pt-10">
            <Button
              asChild
              size="lg"
              className="group bg-gradient-to-r from-[var(--color-surface-3)] to-[var(--color-surface-4)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/osta">
                Näytä Kaikki Koneet
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Enhanced */}
      <section className="py-section relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)]/20 via-[var(--color-surface-1)] to-[var(--color-tertiary)]/20"></div>
        <div className="container mx-auto px-container relative">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
                Miksi
              </span>
              <span className="text-gradient-primary pl-2 md:pl-3">
                Repur.fi?
              </span>
            </h2>

            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Emme ole vain refurb-myyjä. Olemme gaming-yhteisön kumppani,
              joka tarjoaa luotettavuutta, laatua ja ympäristövastuuta.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4 sm:gap-5 md:gap-6 pt-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="12kk Takuu & Tuki"
              description="Jokainen kone sisältää kattavan takuun ja nopean asiakastuen. Mielenrauhaasi ei myydä erikseen."
              highlight={true}
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="Testattua Tehoa"
              description="Suorituskyky on varmistettu raskailla pelimitouksilla. Saat juuri sen suorituskyvyn, mitä lupaamme."
            />
            <FeatureCard
              icon={<Recycle className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="Kestävä Valinta"
              description="Vähennä elektroniikkajätettä jopa 80%. Pelaaminen ei ole koskaan ollut näin ympäristöystävällistä."
            />
            <FeatureCard
              icon={<Euro className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="Reilut Hinnat"
              description="Maksat vain suorituskyvystä, ei brändistä. Säästä jopa 50% uuden hinnasta menettämättä laatua."
            />
            <FeatureCard
              icon={<Wrench className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="Pro-Kunnostus"
              description="15 vuoden kokemus komponenteista. Jokainen osa tarkistettu, päivitetty ja optimoitu täydellisyyttä varten."
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-[var(--color-surface-inverse)]" />}
              title="Nopea Toimitus"
              description="Tilaa tänään, pelaa huomenna. Nopea ja turvallinen toimitus koko Suomeen."
            />
          </motion.div>
        </div>
      </section>

      {/* Sell Your PC Section - Enhanced CTA */}
      <section className="py-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-secondary-dark)]/30 via-[var(--color-surface-1)] to-[var(--color-primary-dark)]/30"></div>

        {/* Animated background elements */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[var(--color-secondary)]/20 to-[var(--color-primary)]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-container relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-secondary-dark)]/50 to-[var(--color-primary-dark)]/50 border border-[var(--color-secondary)]/30 mb-8">
                <Euro className="w-4 h-4 text-[var(--color-secondary-light)] mr-2" />
                <span className="text-sm text-[var(--color-secondary-light)] font-medium">Käteistä hetkessä</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
                  Muuta Vanha Koneesi
                </span>
                <span className="text-gradient-secondary pl-2 md:pl-3">
                  Käteiseksi
                </span>
              </h2>

              <p className="text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                Miksi antaa vanhan gaming-rigin kerätä pölyä? Saat meiltä reilun hinnan
                nopeasti ja vaivattomasti. Prosessi on suunniteltu sinua varten.
              </p>

              <div className="space-y-4 mb-2xl pb-10">
                {[
                  "Välitön hinta-arvio verkossa - ei odottelua",
                  "Maksuton nouto tai toimitus meille - sinulle ei kulu senttiäkään",
                  "Tarkistus ja lopullinen tarjous 24h sisällä",
                  "Raha tilillä hyväksynnän jälkeen - nopeasti ja turvallisesti"
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start space-x-3"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--color-text-secondary)]">{item}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="group relative bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] hover:from-[var(--color-secondary-dark)] hover:to-[var(--color-primary-dark)] text-white font-bold text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-secondary)]/25"
                >
                  <Link href="/myy">
                    <span className="flex items-center">
                      Aloita Myynti Nyt
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-secondary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-secondary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <Link href="/osta">
                    Katso Esimerkkihintoja
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Enhanced testimonial card */}
            <motion.div
              className="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-2 sm:px-4 lg:px-0"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-secondary)]/20 to-[var(--color-primary)]/20 rounded-3xl blur-2xl pointer-events-none"></div>

                <div className="relative bg-[var(--color-surface-2)]/80 backdrop-blur-xl border border-[var(--color-border)]/50 rounded-2xl sm:rounded-3xl p-3 xs:p-4 sm:p-6 md:p-8 lg:p-xl transform hover:rotate-1 transition-transform duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-4 md:mb-md gap-2 sm:gap-3">
                    <div className="flex space-x-1 justify-center sm:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 xs:w-6 xs:h-6 text-[var(--color-warning)] fill-current" />
                      ))}
                    </div>
                    <span className="sm:ml-2 text-[var(--color-text-secondary)] text-xs xs:text-sm sm:text-base text-center sm:text-left">5/5</span>
                  </div>

                  <blockquote className="text-sm xs:text-base sm:text-lg md:text-xl-fluid font-medium text-[var(--color-text-primary)] mb-4 md:mb-6 lg:mb-lg leading-relaxed pt-4 sm:pt-6 md:pt-10 text-center md:text-left">
                    &quot;Sain 4 vuotta vanhasta RTX 3080 -koneestani 850€. Prosessi oli
                    uskomattoman helppoa ja raha tuli tilille seuraavana päivänä.
                    Suosittelen lämpimästi!&quot;
                  </blockquote>

                  <footer className="flex flex-col sm:flex-row items-center pt-4 sm:pt-6 md:pt-10 gap-2 sm:gap-4">
                    <div className="w-9 h-9 xs:w-10 xs:h-10 md:w-12 md:h-12 bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] rounded-full flex items-center justify-center text-[var(--color-surface-inverse)] font-bold mr-0 sm:mr-4 mb-2 sm:mb-0 text-base xs:text-lg md:text-xl">
                      MJ
                    </div>
                    <div className="text-center sm:text-left">
                      <cite className="text-[var(--color-text-primary)] font-medium not-italic text-sm xs:text-base">Mikko J.</cite>
                      <p className="text-[var(--color-text-secondary)] text-xs xs:text-sm sm:text-base">Helsinki • Myi RTX 3080 PC:n</p>
                    </div>
                  </footer>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Uusi CTA Section - Mission & Quality Focus */}
      <section className="py-section relative bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
        <div className="container mx-auto px-container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 border border-[var(--color-primary)]/30 mb-8">
              <Award className="w-4 h-4 text-[var(--color-primary)] mr-2" />
              <span className="text-sm text-[var(--color-primary)] font-medium">Sitoutuminen Laatuun</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gradient-primary mb-6 leading-tight">
              Yli 500 Tyytyväistä Asiakasta –
              <br />
              Liity Joukkoon!
            </h2>
            <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] mb-10 max-w-3xl mx-auto leading-relaxed">
              Jokainen myymämme tietokone edustaa sitoutumistamme
              laatuun, luotettavuuteen ja kestävään kehitykseen.
              Me emme myy vain tietokoneita – me myymme mielenrauhaa.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="group relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-tertiary)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-tertiary)]/90 text-white font-bold text-lg px-10 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[var(--color-primary)]/25 border-0"
              >
                <Link href="/osta">
                  <span className="relative z-10 flex items-center">
                    Selaa Koneita
                    <ShoppingCart className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="group text-lg px-10 py-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-secondary)] bg-[var(--color-surface-2)]/50 backdrop-blur-sm hover:bg-[var(--color-secondary)]/30 text-[var(--color-text-primary)] hover:text-[var(--color-secondary-light)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Link href="/meista">
                  Lue Meistä Lisää
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}