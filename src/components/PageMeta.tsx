import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown> | null;
}

export function PageMeta({ title, description, jsonLd }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    const existingScript = document.getElementById('apnarole-dynamic-jsonld');
    if (existingScript) {
      existingScript.remove();
    }
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'apnarole-dynamic-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      const s = document.getElementById('apnarole-dynamic-jsonld');
      if (s) s.remove();
    };
  }, [title, description, jsonLd]);

  return null;
}
