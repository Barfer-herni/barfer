import { Sidebar } from '@/components/sidebar';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Balancer from 'react-wrap-balancer';
import { format } from 'date-fns';

type LegalPageProperties = {
  readonly params: Promise<{
    slug: string;
    locale: string;
  }>;
};

const DummyBody = () => (
  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
    <p className="text-gray-500">Contenido legal - Pendiente de implementación</p>
  </div>
);

const DummyTableOfContents = () => (
  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
    <p className="text-gray-500">Tabla de contenidos - Pendiente de implementación</p>
  </div>
);

const LegalPage = async ({ params }: LegalPageProperties) => {
  const { slug } = await params;

  // Datos dummy para demostración
  const dummyPage = {
    _title: "Página Legal",
    description: "Contenido legal pendiente de implementación",
    readingTime: "5",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
  };

  return (
    <div className="container py-16">
      <Link
        className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
        href="/legal"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Legal
      </Link>
      <div className="mt-16 flex flex-col items-start gap-8 sm:flex-row">
        <div className="sm:flex-1">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="scroll-m-20 font-extrabold text-4xl tracking-tight lg:text-5xl">
              <Balancer>{dummyPage._title}</Balancer>
            </h1>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              <Balancer>{dummyPage.description}</Balancer>
            </p>
            <div className="mx-auto max-w-prose">
              <DummyBody />
            </div>
          </div>
        </div>
        <div className="sticky top-24 hidden shrink-0 md:block">
          <Sidebar
            toc={<DummyTableOfContents />}
            readingTime={`${dummyPage.readingTime} min read`}
            date={new Date(dummyPage.date)}
          />
        </div>
      </div>
    </div>
  );
};

export const generateMetadata = async ({
  params,
}: LegalPageProperties): Promise<Metadata> => {
  const { slug } = await params;
  return createMetadata({
    title: "Página Legal",
    description: "Contenido legal pendiente de implementación"
  });
};

export default LegalPage;
