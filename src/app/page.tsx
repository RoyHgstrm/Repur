'use client';

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowRight, CheckCircle2, Cpu, Recycle, ShieldCheck, ShoppingCart, Wrench } from "lucide-react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/react";
import { motion } from "framer-motion";

// Define a type for the listing, including the seller relationship
type ListingWithSeller = RouterOutputs['listings']['getActiveCompanyListings'][number];

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

// Component for individual feature cards
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    variants={itemVariants} 
    className="relative bg-surface-2/50 backdrop-blur-sm border border-primary/10 p-6 rounded-lg text-center transform transition-all duration-300 group overflow-hidden hover:border-primary/30">
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
        <div className="inline-block bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 p-3 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl-fluid font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
  </motion.div>
);

// Component for displaying a single PC listing
const ProductCard = ({ listing }: { listing: ListingWithSeller }) => (
  <motion.div variants={itemVariants} className="h-full">
    <Link href={`/osta/${listing.id}`} className="block h-full">
      <Card className="bg-surface-2/50 backdrop-blur-sm border border-[var(--color-primary)]/10 h-full flex flex-col group overflow-hidden transform transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:scale-105 hover:bg-surface-2/80">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white group-hover:text-[var(--color-primary)] transition-colors truncate">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
          <div className="space-y-2 text-sm text-gray-300 mb-4">
            <p className="flex items-center"><Cpu className="w-4 h-4 mr-2 text-[var(--color-primary)]" /> {listing.cpu}</p>
            <p><strong className="font-semibold">Näytönohjain:</strong> {listing.gpu}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl-fluid font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">{parseFloat(listing.basePrice)}€</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

export default function HomePage() {
  const { data: listings, isLoading } = api.listings.getActiveCompanyListings.useQuery({ limit: 4 });

  return (
    <div className="bg-[var(--color-surface-1)] text-[var(--color-neutral)]">
      {/* Hero Section */}
      <motion.section 
        className="relative text-center py-section overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[var(--color-surface-1)]"></div>
            <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] sm:h-[48rem] sm:w-[48rem] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-secondary)]/5 to-transparent rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="container mx-auto px-container relative">
          <motion.h1 
            className="text-4xl-fluid font-extrabold tracking-tighter text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]">Suorituskykyä</span>, Joka Kestää.
          </motion.h1>
          <motion.p 
            className="mt-6 max-w-2xl mx-auto text-lg-fluid text-gray-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Hanki laadukas, kunnostettu pelitietokone tai myy omasi meille – luotettavasti, helposti ja ympäristöä säästäen.
          </motion.p>
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:from-[var(--color-primary)]/90 hover:to-[var(--color-secondary)]/90 text-white font-bold text-lg px-8 py-6 transition-transform duration-300 hover:scale-105 shadow-lg shadow-[var(--color-primary)]/20">
              <Link href="/osta">Osta Kone <ShoppingCart className="ml-2 w-5 h-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-transform duration-300 hover:scale-105">
              <Link href="/myy">Myy Koneesi <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products Section */}
      <section className="py-section relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-inverse to-[var(--color-primary)]/5"></div>
        <div className="container mx-auto px-container relative">
          <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl-fluid font-bold text-center text-white mb-4">Suosituimmat Koneet</h2>
            <p className="text-center text-gray-300 max-w-xl mx-auto mb-12">Nämä huolella tarkistetut ja kunnostetut tehopakkaukset odottavat uutta kotia.</p>
          </motion.div>
          {isLoading ? (
            <div className="text-center text-gray-400">Ladataan tuotteita...</div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {listings?.map((listing: ListingWithSeller) => <ProductCard key={listing.id} listing={listing} />)}
            </motion.div>
          )}
          <div className="text-center mt-12">
            <Button asChild variant="ghost" className="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 text-lg-fluid">
              <Link href="/osta">Selaa kaikkia tuotteita <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Repur.fi Section */}
      <section className="py-section bg-gradient-to-b from-[var(--color-primary)]/5 to-surface-inverse">
        <div className="container mx-auto px-container">
          <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl-fluid font-bold text-center text-white mb-4">Miksi Valita Repur.fi?</h2>
            <p className="text-center text-gray-300 max-w-2xl mx-auto mb-12">Emme myy vain tietokoneita. Myymme luottamusta, kestävyyttä ja huippuluokan pelikokemuksia.</p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <FeatureCard icon={<ShieldCheck className="w-8 h-8 text-[var(--color-primary)]" />} title="12kk Takuu" description="Jokainen kone on testattu ja sisältää kattavan takuun mielenrauhasi turvaksi." />
            <FeatureCard icon={<Recycle className="w-8 h-8 text-[var(--color-primary)]" />} title="Kestävä Valinta" description="Vähennä elektroniikkajätettä ja tue kiertotaloutta valitsemalla kunnostettu." />
            <FeatureCard icon={<Wrench className="w-8 h-8 text-[var(--color-primary)]" />} title="Asiantuntijoiden Kunnostama" description="Tiimimme varmistaa, että jokainen komponentti toimii moitteettomasti." />
          </motion.div>
        </div>
      </section>

      {/* How to Sell Section */}
      <section className="py-section relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] bg-gradient-to-br from-[var(--color-accent)]/10 via-[var(--color-secondary)]/5 to-transparent rounded-full blur-3xl opacity-60"></div>
        <div className="container mx-auto px-container relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ x: -50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8 }}>
              <h2 className="text-3xl-fluid font-bold text-white mb-4">Onko sinulla ylimääräinen pelikone?</h2>
              <p className="text-gray-200 text-lg-fluid mb-6">Anna sille uusi tarkoitus. Prosessimme on suunniteltu helpoksi ja läpinäkyväksi. Saat reilun hinnan nopeasti ja vaivattomasti.</p>
              <ul className="space-y-4 mb-8 text-gray-200">
                <li className="flex items-center"><CheckCircle2 className="w-6 h-6 text-[var(--color-success)] mr-3" /><span>Saat välittömän hinta-arvion verkossa.</span></li>
                <li className="flex items-center"><CheckCircle2 className="w-6 h-6 text-[var(--color-success)] mr-3" /><span>Maksuton ja vakuutettu toimitus meille.</span></li>
                <li className="flex items-center"><CheckCircle2 className="w-6 h-6 text-[var(--color-success)] mr-3" /><span>Nopea maksu tarkistuksen jälkeen.</span></li>
              </ul>
              <Button asChild size="lg" className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] hover:from-[var(--color-accent)]/90 hover:to-[var(--color-secondary)]/90 text-white font-bold text-lg px-8 py-6 transition-transform duration-300 hover:scale-105 shadow-lg shadow-[var(--color-accent)]/20">
                <Link href="/myy">Aloita Myynti</Link>
              </Button>
            </motion.div>
            <motion.div 
              className="hidden lg:block"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }} 
              transition={{ duration: 0.8 }}
            >
                <div className="bg-surface-2/50 backdrop-blur-sm rounded-lg p-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300 border-l-4 border-[var(--color-accent)] shadow-2xl shadow-[var(--color-accent)]/10">
                    <p className="text-2xl-fluid font-bold text-white">“Sain vanhasta koneestani paremman hinnan kuin odotin, ja koko prosessi oli uskomattoman sujuva. Suosittelen!”</p>
                    <p className="mt-4 text-right text-gray-300">- Tyytyväinen asiakas</p>
                </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}