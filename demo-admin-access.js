// Временный скрипт для быстрого тестирования админ панели
// Выполнить в консоли браузера для обхода аутентификации

console.log('🚀 Демо доступ к админ панели CryptoFlow');

// Создать mock админ пользователя в localStorage
const mockAdminUser = {
  id: 'demo-admin-123',
  email: 'admin@cryptoflow.test', 
  firstName: 'Demo',
  lastName: 'Administrator',
  role: 'admin',
  isActive: true,
  profileImageUrl: null
};

// Сохранить в localStorage
localStorage.setItem('auth_token', 'demo-admin-token-123');
localStorage.setItem('user_data', JSON.stringify(mockAdminUser));

console.log('✅ Mock админ сессия создана!');
console.log('📧 Email: admin@cryptoflow.test');
console.log('👤 Role: admin');
console.log('');
console.log('🌐 Теперь можете переходить по ссылкам:');
console.log('📊 Dashboard: /admin');
console.log('👥 Users: /admin/users');
console.log('📱 Telegram: /admin/telegram');
console.log('💼 Wallets: /admin/wallets');
console.log('🪙 Currencies: /admin/currencies');
console.log('🔄 Exchange Methods: /admin/exchange-methods');
console.log('📜 Logs: /admin/logs');
console.log('⚙️ Settings: /admin/settings');
console.log('');
console.log('⚠️  Примечание: это демо режим, некоторые функции могут не работать полностью');