import Configurator from '@/components/configurator/Configurator';
import FindYourStone from '@/components/finder/FindYourStone';
import Collection from '@/components/sections/Collection';
import Constellation from '@/components/sections/Constellation';
import Craftsmanship from '@/components/sections/Craftsmanship';
import Hero from '@/components/sections/Hero';
import Heritage from '@/components/sections/Heritage';
import JournalTeaser from '@/components/sections/JournalTeaser';
import Trust from '@/components/sections/Trust';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Constellation />
      <FindYourStone />
      <Configurator />
      <Craftsmanship />
      <Heritage />
      <Collection />
      <Trust />
      <JournalTeaser />
    </>
  );
}
