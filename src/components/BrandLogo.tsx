
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  alt?: string;
};

/** Kreatif K mark — bundled asset so deploys always bust cache */
export function BrandLogo({ className, alt = 'Kreatif' }: Props) {
  return (
    <img
      src={logo}
      alt={alt}
      className={cn('object-cover', className)}
      draggable={false}
    />
  );
}
