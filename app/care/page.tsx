import type { Metadata } from 'next';
import InfoPage from '@/components/ui/InfoPage';
import { RING_SIZES } from '@/lib/data/options';
import { innerRadiusForSize } from '@/lib/3d/geometry/jewellery';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Care and Sizing', description: 'How to care for gemstone jewellery, and how to find your ring size.', path: '/care' });

export default function CarePage() {
  return (
    <InfoPage
      title={['Care and sizing.']}
      sections={[
        {
          id: 'soft-stones',
          heading: 'Soft stones',
          body: (
            <>
              <p>Coral, pearl, lapis and moonstone are soft or porous. Put them on after perfume and cosmetics, wipe them with a soft dry cloth after wearing, and keep them away from acids and household cleaners.</p>
              <p>Never clean them in an ultrasonic or steam cleaner.</p>
            </>
          ),
        },
        {
          id: 'hard-stones',
          heading: 'Hard stones',
          body: <p>Ruby, sapphire, chrysoberyl and diamond are hard and durable, but can chip with a sharp knock. Clean them in lukewarm water with a little mild soap and a soft brush. Oiled emeralds should not be soaked.</p>,
        },
        { id: 'storage', heading: 'Storage', body: <p>Store each piece separately in its pouch so harder stones cannot scratch softer ones, or the gold.</p> },
        {
          id: 'sizing',
          heading: 'Ring sizing',
          body: (
            <>
              <p>Measure the inside diameter of a ring that fits the intended finger, or visit us for a sizing. Fingers are slightly larger in the evening and in warm weather.</p>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>US</th>
                      <th>India</th>
                      <th>Inner diameter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RING_SIZES.map((r) => (
                      <tr key={r.us}>
                        <td>{r.us}</td>
                        <td>{r.india}</td>
                        <td>{(innerRadiusForSize(r.us) * 20).toFixed(1)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        { id: 'service', heading: 'Annual check', body: <p>Bring or send your piece once a year. We check the setting, clean it appropriately for its stone and re-polish the gold, without charge.</p> },
      ]}
    />
  );
}
