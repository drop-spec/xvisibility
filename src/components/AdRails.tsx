'use client';

import AdCard from './AdCard';

const leftAds = [
  { icon: '🚀', name: 'Build Better', tagline: 'Ship faster with modern tools', url: 'https://example.com/build-better' },
  { icon: '📈', name: 'Scale Now', tagline: 'Grow your business exponentially', url: 'https://example.com/scale-now' },
  { isOpen: true, name: 'Open Slot' },
  { icon: '⚡', name: 'Save Time', tagline: '10x productivity boost guaranteed', url: 'https://example.com/save-time' },
  { icon: '🤖', name: 'Automate It', tagline: 'Never do manual work again', url: 'https://example.com/automate-it' },
];

const rightAds = [
  { icon: '🚢', name: 'Fast Deploy', tagline: 'Ship in minutes not hours anymore', url: 'https://example.com/fast-deploy' },
  { icon: '🧠', name: 'AI Powered', tagline: 'Smart automation for your workflow', url: 'https://example.com/ai-powered' },
  { icon: '📊', name: 'Real Analytics', tagline: 'Know your metrics and grow smart', url: 'https://example.com/real-analytics' },
  { isOpen: true, name: 'Open Slot' },
  { icon: '✅', name: 'Always On', tagline: '99.9% uptime guarantee assured', url: 'https://example.com/always-on' },
];

export default function AdRails() {
  return (
    <>
      <aside className="hidden lg:block">
        <div className="fixed bottom-4 left-4 top-24 grid w-[210px] grid-rows-5 gap-3" aria-label="Featured tools">
          {leftAds.map((ad, index) => (
            <AdCard key={`left-${index}`} {...ad} isOpen={Boolean(ad.isOpen)} url={ad.url} />
          ))}
        </div>
      </aside>

      <aside className="hidden lg:block">
        <div className="fixed bottom-4 right-4 top-24 grid w-[210px] grid-rows-5 gap-3" aria-label="Featured tools">
          {rightAds.map((ad, index) => (
            <AdCard key={`right-${index}`} {...ad} isOpen={Boolean(ad.isOpen)} url={ad.url} />
          ))}
        </div>
      </aside>
    </>
  );
}
