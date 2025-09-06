import { useTranslation } from "react-i18next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  Award,
  Lock,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('about.features.security.title'),
      description: t('about.features.security.desc'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: t('about.features.speed.title'), 
      description: t('about.features.speed.desc'),
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Globe,
      title: t('about.features.global.title'),
      description: t('about.features.global.desc'), 
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: t('about.features.support.title'),
      description: t('about.features.support.desc'),
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const stats = [
    {
      number: '100K+',
      label: t('about.stats.transactions'),
      icon: TrendingUp
    },
    {
      number: '50+',
      label: t('about.stats.currencies'),
      icon: Globe
    },
    {
      number: '24/7',
      label: t('about.stats.support'),
      icon: Clock
    },
    {
      number: '99.9%',
      label: t('about.stats.uptime'),
      icon: CheckCircle
    }
  ];

  const advantages = [
    {
      title: t('about.advantages.noRegistration.title'),
      description: t('about.advantages.noRegistration.desc')
    },
    {
      title: t('about.advantages.bestRates.title'),
      description: t('about.advantages.bestRates.desc')
    },
    {
      title: t('about.advantages.fastTransactions.title'),
      description: t('about.advantages.fastTransactions.desc')
    },
    {
      title: t('about.advantages.security.title'),
      description: t('about.advantages.security.desc')
    },
    {
      title: t('about.advantages.support.title'),
      description: t('about.advantages.support.desc')
    },
    {
      title: t('about.advantages.transparency.title'),
      description: t('about.advantages.transparency.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('about.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-none">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">{t('about.mission.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('about.mission.description')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">{t('about.featuresTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <span>{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advantages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">{t('about.advantagesTitle')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((advantage, index) => (
              <Card key={index} className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">{advantage.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {advantage.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-800 dark:text-blue-200">
                    {t('about.security.title')}
                  </h3>
                  <div className="space-y-3 text-blue-600 dark:text-blue-300">
                    <p>{t('about.security.encryption')}</p>
                    <p>{t('about.security.custody')}</p>
                    <p>{t('about.security.compliance')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      SSL/TLS
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {t('about.security.nonCustodial')}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {t('about.security.privacy')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">{t('about.contact.title')}</h2>
              <p className="mb-6 opacity-90">{t('about.contact.description')}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                  support@cryptoflow.exchange
                </Badge>
                <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                  @cryptoflow_support
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}