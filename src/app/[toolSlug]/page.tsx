import type { Metadata } from 'next';
import { getToolBySlug, TOOLS_CONFIG } from '@/config/tools';
import { ToolPageClient } from '@/components/tools/ToolPageClient';

export async function generateStaticParams() {
  return TOOLS_CONFIG.map((tool) => ({
    toolSlug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolSlug: string }>;
}): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    return {
      title: 'Tool Not Found - SpikeDocs',
    };
  }

  return {
    title: tool.seo.metaTitle,
    description: tool.seo.metaDescription,
    openGraph: {
      title: tool.seo.metaTitle,
      description: tool.seo.metaDescription,
      type: 'website',
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ toolSlug: string }>;
}) {
  const { toolSlug } = await params;
  return <ToolPageClient slug={toolSlug} />;
}
