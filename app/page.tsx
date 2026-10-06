import Configurator from '@/components/configurator/Configurator';
import FindYourStone from '@/components/finder/FindYourStone';
import Constellation from '@/components/sections/Constellation';
import Hero from '@/components/sections/Hero';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Constellation />
      <FindYourStone />
      <Configurator />
    </>
  );
}
