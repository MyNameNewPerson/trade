import { useTranslation } from "react-i18next";
import { Shield, Zap, UserCheck, HeadphonesIcon } from "lucide-react";

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('features.secure.title'),
      description: t('features.secure.description'),
    },
    {
      icon: Zap,
      title: t('features.fast.title'),
      description: t('features.fast.description'),
    },
    {
      icon: UserCheck,
      title: t('features.noRegistration.title'),
      description: t('features.noRegistration.description'),
    },
    {
      icon: HeadphonesIcon,
      title: t('features.support.title'),
      description: t('features.support.description'),
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('features.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center space-y-4" data-testid={`feature-${index}`}>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold" data-testid={`feature-title-${index}`}>{feature.title}</h3>
                <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
