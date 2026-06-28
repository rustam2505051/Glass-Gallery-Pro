// Admin Panel Translations
// Supports Uzbek, Russian, English

export type AdminLanguage = 'uz' | 'ru' | 'en';

export const adminTranslations = {
  // Navigation & Headers
  dashboard: { uz: 'Boshqaruv paneli', ru: 'Панель управления', en: 'Dashboard' },
  products: { uz: 'Mahsulotlar', ru: 'Товары', en: 'Products' },
  categories: { uz: 'Kategoriyalar', ru: 'Категории', en: 'Categories' },
  banners: { uz: 'Bannerlar', ru: 'Баннеры', en: 'Banners' },
  orders: { uz: 'Buyurtmalar', ru: 'Заказы', en: 'Orders' },
  users: { uz: 'Foydalanuvchilar', ru: 'Пользователи', en: 'Users' },
  settings: { uz: 'Sozlamalar', ru: 'Настройки', en: 'Settings' },
  overview: { uz: "Umumiy ko'rinish", ru: 'Обзор', en: 'Overview' },
  management: { uz: 'Boshqarish', ru: 'Управление', en: 'Management' },

  // Common Actions
  add: { uz: "Qo'shish", ru: 'Добавить', en: 'Add' },
  edit: { uz: 'Tahrirlash', ru: 'Редактировать', en: 'Edit' },
  delete: { uz: "O'chirish", ru: 'Удалить', en: 'Delete' },
  save: { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  saving: { uz: 'Saqlanmoqda...', ru: 'Сохранение...', en: 'Saving...' },
  cancel: { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
  close: { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
  search: { uz: 'Qidirish', ru: 'Поиск', en: 'Search' },
  filter: { uz: 'Filtr', ru: 'Фильтр', en: 'Filter' },
  refresh: { uz: 'Yangilash', ru: 'Обновить', en: 'Refresh' },
  upload: { uz: 'Yuklash', ru: 'Загрузить', en: 'Upload' },
  download: { uz: 'Yuklab olish', ru: 'Скачать', en: 'Download' },
  view: { uz: "Ko'rish", ru: 'Просмотр', en: 'View' },
  seeAll: { uz: 'Hammasini korish', ru: 'Смотреть все', en: 'See All' },
  
  // Status
  active: { uz: 'Faol', ru: 'Активный', en: 'Active' },
  inactive: { uz: 'Nofaol', ru: 'Неактивный', en: 'Inactive' },
  enabled: { uz: 'Yoqilgan', ru: 'Включено', en: 'Enabled' },
  disabled: { uz: "O'chirilgan", ru: 'Отключено', en: 'Disabled' },
  yes: { uz: 'Ha', ru: 'Да', en: 'Yes' },
  no: { uz: "Yo'q", ru: 'Нет', en: 'No' },
  
  // Form Labels
  name: { uz: 'Nomi', ru: 'Название', en: 'Name' },
  nameUz: { uz: 'Nomi (UZ)', ru: 'Название (UZ)', en: 'Name (UZ)' },
  nameRu: { uz: 'Nomi (RU)', ru: 'Название (RU)', en: 'Name (RU)' },
  nameEn: { uz: 'Nomi (EN)', ru: 'Название (EN)', en: 'Name (EN)' },
  title: { uz: 'Sarlavha', ru: 'Заголовок', en: 'Title' },
  titleUz: { uz: 'Sarlavha (UZ)', ru: 'Заголовок (UZ)', en: 'Title (UZ)' },
  titleRu: { uz: 'Sarlavha (RU)', ru: 'Заголовок (RU)', en: 'Title (RU)' },
  titleEn: { uz: 'Sarlavha (EN)', ru: 'Заголовок (EN)', en: 'Title (EN)' },
  description: { uz: 'Tavsif', ru: 'Описание', en: 'Description' },
  descriptionUz: { uz: 'Tavsif (UZ)', ru: 'Описание (UZ)', en: 'Description (UZ)' },
  descriptionRu: { uz: 'Tavsif (RU)', ru: 'Описание (RU)', en: 'Description (RU)' },
  descriptionEn: { uz: 'Tavsif (EN)', ru: 'Описание (EN)', en: 'Description (EN)' },
  subtitle: { uz: 'Qoshimcha sarlavha', ru: 'Подзаголовок', en: 'Subtitle' },
  image: { uz: 'Rasm', ru: 'Изображение', en: 'Image' },
  images: { uz: 'Rasmlar', ru: 'Изображения', en: 'Images' },
  price: { uz: 'Narx', ru: 'Цена', en: 'Price' },
  order: { uz: 'Tartib', ru: 'Порядок', en: 'Order' },
  displayOrder: { uz: "Ko'rsatish tartibi", ru: 'Порядок отображения', en: 'Display Order' },
  status: { uz: 'Holat', ru: 'Статус', en: 'Status' },
  link: { uz: 'Havola', ru: 'Ссылка', en: 'Link' },
  email: { uz: 'Email', ru: 'Email', en: 'Email' },
  password: { uz: 'Parol', ru: 'Пароль', en: 'Password' },
  role: { uz: 'Rol', ru: 'Роль', en: 'Role' },
  
  // Product specific
  productCode: { uz: 'Mahsulot kodi', ru: 'Код товара', en: 'Product Code' },
  productName: { uz: 'Mahsulot nomi', ru: 'Название товара', en: 'Product Name' },
  productImages: { uz: 'Mahsulot rasmlari', ru: 'Фото товара', en: 'Product Images' },
  category: { uz: 'Kategoriya', ru: 'Категория', en: 'Category' },
  selectCategory: { uz: 'Kategoriyani tanlang', ru: 'Выберите категорию', en: 'Select Category' },
  material: { uz: 'Material', ru: 'Материал', en: 'Material' },
  size: { uz: "O'lcham", ru: 'Размер', en: 'Size' },
  thickness: { uz: "Yo'g'onlik", ru: 'Толщина', en: 'Thickness' },
  colors: { uz: 'Ranglar', ru: 'Цвета', en: 'Colors' },
  tags: { uz: 'Teglar', ru: 'Теги', en: 'Tags' },
  inStock: { uz: 'Mavjud', ru: 'В наличии', en: 'In Stock' },
  outOfStock: { uz: 'Mavjud emas', ru: 'Нет в наличии', en: 'Out of Stock' },
  featured: { uz: 'Tanlangan', ru: 'Рекомендуемый', en: 'Featured' },
  newProduct: { uz: 'Yangi', ru: 'Новинка', en: 'New' },
  
  // Category specific
  categoryName: { uz: 'Kategoriya nomi', ru: 'Название категории', en: 'Category Name' },
  categoryImage: { uz: 'Kategoriya rasmi', ru: 'Изображение категории', en: 'Category Image' },
  
  // Banner specific
  bannerTitle: { uz: 'Banner sarlavhasi', ru: 'Заголовок баннера', en: 'Banner Title' },
  bannerImage: { uz: 'Banner rasmi', ru: 'Изображение баннера', en: 'Banner Image' },
  
  // AI Features
  aiGenerate: { uz: 'AI bilan yaratish', ru: 'Создать с ИИ', en: 'Generate with AI' },
  aiGenerating: { uz: 'AI yaratmoqda...', ru: 'ИИ создает...', en: 'AI Generating...' },
  aiAnalyze: { uz: 'AI tahlil qilish', ru: 'Анализ ИИ', en: 'AI Analyze' },
  aiSuggestion: { uz: 'AI taklifi', ru: 'Предложение ИИ', en: 'AI Suggestion' },
  uploadImageForAi: { uz: 'AI tavsif uchun rasm yuklang', ru: 'Загрузите фото для описания ИИ', en: 'Upload image for AI description' },
  
  // Messages
  success: { uz: 'Muvaffaqiyat', ru: 'Успешно', en: 'Success' },
  error: { uz: 'Xatolik', ru: 'Ошибка', en: 'Error' },
  warning: { uz: 'Ogohlantirish', ru: 'Предупреждение', en: 'Warning' },
  loading: { uz: 'Yuklanmoqda...', ru: 'Загрузка...', en: 'Loading...' },
  
  // Success messages
  productCreated: { uz: 'Mahsulot yaratildi', ru: 'Товар создан', en: 'Product created' },
  productUpdated: { uz: 'Mahsulot yangilandi', ru: 'Товар обновлен', en: 'Product updated' },
  productDeleted: { uz: "Mahsulot o'chirildi", ru: 'Товар удален', en: 'Product deleted' },
  categoryCreated: { uz: 'Kategoriya yaratildi', ru: 'Категория создана', en: 'Category created' },
  categoryUpdated: { uz: 'Kategoriya yangilandi', ru: 'Категория обновлена', en: 'Category updated' },
  categoryDeleted: { uz: "Kategoriya o'chirildi", ru: 'Категория удалена', en: 'Category deleted' },
  bannerCreated: { uz: 'Banner yaratildi', ru: 'Баннер создан', en: 'Banner created' },
  bannerUpdated: { uz: 'Banner yangilandi', ru: 'Баннер обновлен', en: 'Banner updated' },
  bannerDeleted: { uz: "Banner o'chirildi", ru: 'Баннер удален', en: 'Banner deleted' },
  changesSaved: { uz: "O'zgarishlar saqlandi", ru: 'Изменения сохранены', en: 'Changes saved' },
  
  // Error messages
  failedToLoad: { uz: 'Yuklab bo\'lmadi', ru: 'Не удалось загрузить', en: 'Failed to load' },
  failedToSave: { uz: 'Saqlab bo\'lmadi', ru: 'Не удалось сохранить', en: 'Failed to save' },
  failedToDelete: { uz: "O'chirib bo'lmadi", ru: 'Не удалось удалить', en: 'Failed to delete' },
  requiredField: { uz: 'Majburiy maydon', ru: 'Обязательное поле', en: 'Required field' },
  invalidEmail: { uz: "Noto'g'ri email", ru: 'Неверный email', en: 'Invalid email' },
  networkError: { uz: 'Tarmoq xatosi', ru: 'Ошибка сети', en: 'Network error' },
  
  // Confirmation dialogs
  confirmDelete: { uz: "O'chirishni tasdiqlaysizmi?", ru: 'Подтвердить удаление?', en: 'Confirm delete?' },
  confirmDeleteProduct: { uz: "Mahsulotni o'chirmoqchimisiz?", ru: 'Удалить товар?', en: 'Delete this product?' },
  confirmDeleteCategory: { uz: "Kategoriyani o'chirmoqchimisiz?", ru: 'Удалить категорию?', en: 'Delete this category?' },
  confirmDeleteBanner: { uz: "Bannerni o'chirmoqchimisiz?", ru: 'Удалить баннер?', en: 'Delete this banner?' },
  confirmLogout: { uz: 'Chiqishni tasdiqlaysizmi?', ru: 'Выйти из системы?', en: 'Confirm logout?' },
  
  // Empty states
  noProducts: { uz: 'Mahsulotlar topilmadi', ru: 'Товары не найдены', en: 'No products found' },
  noCategories: { uz: 'Kategoriyalar topilmadi', ru: 'Категории не найдены', en: 'No categories found' },
  noBanners: { uz: 'Bannerlar topilmadi', ru: 'Баннеры не найдены', en: 'No banners found' },
  noOrders: { uz: 'Buyurtmalar topilmadi', ru: 'Заказы не найдены', en: 'No orders found' },
  noUsers: { uz: 'Foydalanuvchilar topilmadi', ru: 'Пользователи не найдены', en: 'No users found' },
  noResults: { uz: 'Natija topilmadi', ru: 'Результаты не найдены', en: 'No results found' },
  
  // Placeholders
  enterName: { uz: 'Nomini kiriting', ru: 'Введите название', en: 'Enter name' },
  enterTitle: { uz: 'Sarlavhani kiriting', ru: 'Введите заголовок', en: 'Enter title' },
  enterDescription: { uz: 'Tavsifni kiriting', ru: 'Введите описание', en: 'Enter description' },
  enterPrice: { uz: 'Narxni kiriting', ru: 'Введите цену', en: 'Enter price' },
  enterCode: { uz: 'Kodni kiriting', ru: 'Введите код', en: 'Enter code' },
  tapToSelectImage: { uz: 'Rasmni tanlash uchun bosing', ru: 'Нажмите для выбора фото', en: 'Tap to select image' },
  
  // Buttons
  addProduct: { uz: 'Mahsulot qoshish', ru: 'Добавить товар', en: 'Add Product' },
  addCategory: { uz: 'Kategoriya qoshish', ru: 'Добавить категорию', en: 'Add Category' },
  addBanner: { uz: 'Banner qoshish', ru: 'Добавить баннер', en: 'Add Banner' },
  newProduct: { uz: 'Yangi mahsulot', ru: 'Новый товар', en: 'New Product' },
  newCategory: { uz: 'Yangi kategoriya', ru: 'Новая категория', en: 'New Category' },
  newBanner: { uz: 'Yangi banner', ru: 'Новый баннер', en: 'New Banner' },
  editProduct: { uz: 'Mahsulotni tahrirlash', ru: 'Редактировать товар', en: 'Edit Product' },
  editCategory: { uz: 'Kategoriyani tahrirlash', ru: 'Редактировать категорию', en: 'Edit Category' },
  editBanner: { uz: 'Bannerni tahrirlash', ru: 'Редактировать баннер', en: 'Edit Banner' },
  
  // Contact Settings
  phone: { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
  contacts: { uz: 'Kontaktlar', ru: 'Контакты', en: 'Contacts' },
  contactSettings: { uz: 'Kontakt sozlamalari', ru: 'Настройки контактов', en: 'Contact Settings' },
  website: { uz: 'Veb-sayt', ru: 'Веб-сайт', en: 'Website' },
  address: { uz: 'Manzil', ru: 'Адрес', en: 'Address' },
  workingHours: { uz: 'Ish vaqti', ru: 'Режим работы', en: 'Working Hours' },
  noTitle: { uz: 'Sarlavhasiz', ru: 'Без заголовка', en: 'No title' },

  // Units
  items: { uz: 'dona', ru: 'шт', en: 'items' },
  
  // Login
  signIn: { uz: 'Kirish', ru: 'Войти', en: 'Sign In' },
  signOut: { uz: 'Chiqish', ru: 'Выйти', en: 'Sign Out' },
  logout: { uz: 'Chiqish', ru: 'Выйти', en: 'Logout' },
  adminAccess: { uz: 'Admin kirish', ru: 'Вход администратора', en: 'Admin Access' },
  adminCredentials: { uz: 'Admin hisob maʼlumotlari', ru: 'Данные администратора', en: 'Admin credentials' },
  onlyAdmins: { uz: 'Faqat adminlar kirishi mumkin', ru: 'Доступ только для администраторов', en: 'Only admins can access this area' },
};

// Get translated text based on current language
export function getAdminText(key: keyof typeof adminTranslations, language: AdminLanguage = 'en'): string {
  const translation = adminTranslations[key];
  if (!translation) return key;
  return translation[language] || translation.en || key;
}

// Hook for admin translations
import { useLanguage } from '../contexts/LanguageContext';

export function useAdminTranslation() {
  const { language } = useLanguage();
  
  const t = (key: keyof typeof adminTranslations): string => {
    return getAdminText(key, language as AdminLanguage);
  };
  
  return { t, language };
}
