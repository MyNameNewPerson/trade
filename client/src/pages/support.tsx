import { useTranslation } from "react-i18next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  Shield, 
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Phone
} from "lucide-react";

export default function Support() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('support.faq.time.question'),
      answer: t('support.faq.time.answer'),
      category: 'timing'
    },
    {
      question: t('support.faq.fees.question'), 
      answer: t('support.faq.fees.answer'),
      category: 'fees'
    },
    {
      question: t('support.faq.limits.question'),
      answer: t('support.faq.limits.answer'),
      category: 'limits'
    },
    {
      question: t('support.faq.support.question'),
      answer: t('support.faq.support.answer'),
      category: 'support'
    }
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t('support.contact.telegram.title'),
      description: t('support.contact.telegram.desc'),
      action: t('support.contact.telegram.action'),
      available: true,
      link: 'https://t.me/cryptoflow_support'
    },
    {
      icon: Mail,
      title: t('support.contact.email.title'), 
      description: t('support.contact.email.desc'),
      action: 'support@cryptoflow.exchange',
      available: true,
      link: 'mailto:support@cryptoflow.exchange'
    },
    {
      icon: MessageCircle,
      title: t('support.contact.chat.title'),
      description: t('support.contact.chat.desc'),
      action: t('support.contact.chat.action'),
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('support.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Status Banner */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {t('support.status.online')}
                  </h3>
                  <p className="text-green-600 dark:text-green-300">
                    {t('support.status.response')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <Clock className="w-4 h-4 mr-1" />
                24/7
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">{t('support.contactTitle')}</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {contactMethods.map((method, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <p className="text-muted-foreground text-sm">{method.description}</p>
                    {method.link ? (
                      <Button asChild className="w-full">
                        <a href={method.link} target="_blank" rel="noopener noreferrer">
                          {method.action}
                        </a>
                      </Button>
                    ) : (
                      <Button className="w-full">{method.action}</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t('support.form.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('support.form.name')}</label>
                    <Input placeholder={t('support.form.namePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('support.form.email')}</label>
                    <Input type="email" placeholder={t('support.form.emailPlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('support.form.subject')}</label>
                  <Input placeholder={t('support.form.subjectPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('support.form.message')}</label>
                  <Textarea 
                    placeholder={t('support.form.messagePlaceholder')} 
                    rows={5}
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  {t('support.form.send')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Sidebar */}
          <div>
            <h2 className="text-2xl font-bold mb-6">{t('support.faqTitle')}</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Notice */}
            <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      {t('support.security.title')}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      {t('support.security.desc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}