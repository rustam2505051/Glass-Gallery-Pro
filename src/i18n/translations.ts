// RestArtuz Multi-language Translations
import { Language } from '../types';

type TranslationKey = 
  // Navigation
  | 'home' | 'categories' | 'favorites' | 'profile' | 'search'
  // Common
  | 'welcome' | 'loading' | 'error' | 'retry' | 'cancel' | 'save' | 'delete' | 'edit'
  | 'back' | 'next' | 'done' | 'share' | 'contact' | 'call' | 'viewAll'
  // Product
  | 'products' | 'productCode' | 'description' | 'specifications' | 'material' 
  | 'size' | 'thickness' | 'colors' | 'price' | 'inStock' | 'outOfStock'
  | 'relatedProducts' | 'newArrivals' | 'popular' | 'recentlyViewed'
  // Actions
  | 'addToFavorites' | 'removeFromFavorites' | 'shareProduct' | 'requestPrice'
  | 'requestCallback' | 'downloadPDF' | 'viewQR'
  // Search
  | 'searchProducts' | 'searchResults' | 'noResults' | 'tryDifferentKeywords'
  // Settings
  | 'settings' | 'language' | 'aboutUs' | 'contactUs' | 'termsAndConditions'
  // Company
  | 'companyName' | 'phoneNumber' | 'whatsapp' | 'telegram' | 'email' | 'address';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  uz: {
    // Navigation
    home: 'Bosh sahifa',
    categories: 'Kategoriyalar',
    favorites: 'Sevimlilar',
    profile: 'Profil',
    search: 'Qidiruv',
    
    // Common
    welcome: 'Xush kelibsiz',
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    retry: 'Qayta urinish',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    delete: "O'chirish",
    edit: 'Tahrirlash',
    back: 'Orqaga',
    next: 'Keyingi',
    done: 'Tayyor',
    share: 'Ulashish',
    contact: 'Aloqa',
    call: "Qo'ng'iroq qilish",
    viewAll: 'Barchasini ko\'rish',
    
    // Product
    products: 'Mahsulotlar',
    productCode: 'Mahsulot kodi',
    description: 'Tavsif',
    specifications: 'Xususiyatlari',
    material: 'Material',
    size: "O'lchami",
    thickness: 'Qalinligi',
    colors: 'Ranglar',
    price: 'Narxi',
    inStock: 'Mavjud',
    outOfStock: 'Mavjud emas',
    relatedProducts: "O'xshash mahsulotlar",
    newArrivals: 'Yangi mahsulotlar',
    popular: 'Mashhur',
    recentlyViewed: "Yaqinda ko'rilgan",
    
    // Actions
    addToFavorites: 'Sevimliga qo\'shish',
    removeFromFavorites: 'Sevimlidan o\'chirish',
    shareProduct: 'Mahsulotni ulashish',
    requestPrice: 'Narxni so\'rash',
    requestCallback: 'Qayta qo\'ng\'iroqni so\'rash',
    downloadPDF: 'PDF yuklab olish',
    viewQR: 'QR kodni ko\'rish',
    
    // Search
    searchProducts: 'Mahsulotlarni qidirish',
    searchResults: 'Qidiruv natijalari',
    noResults: 'Natija topilmadi',
    tryDifferentKeywords: 'Boshqa kalit so\'zlarni sinab ko\'ring',
    
    // Settings
    settings: 'Sozlamalar',
    language: 'Til',
    aboutUs: 'Biz haqimizda',
    contactUs: 'Biz bilan bog\'lanish',
    termsAndConditions: 'Foydalanish shartlari',
    
    // Company
    companyName: 'Kompaniya nomi',
    phoneNumber: 'Telefon raqami',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    address: 'Manzil',
  },
  
  ru: {
    // Navigation
    home: 'Главная',
    categories: 'Категории',
    favorites: 'Избранное',
    profile: 'Профиль',
    search: 'Поиск',
    
    // Common
    welcome: 'Добро пожаловать',
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    retry: 'Повторить',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',
    next: 'Далее',
    done: 'Готово',
    share: 'Поделиться',
    contact: 'Контакты',
    call: 'Позвонить',
    viewAll: 'Посмотреть все',
    
    // Product
    products: 'Товары',
    productCode: 'Код товара',
    description: 'Описание',
    specifications: 'Характеристики',
    material: 'Материал',
    size: 'Размер',
    thickness: 'Толщина',
    colors: 'Цвета',
    price: 'Цена',
    inStock: 'В наличии',
    outOfStock: 'Нет в наличии',
    relatedProducts: 'Похожие товары',
    newArrivals: 'Новинки',
    popular: 'Популярные',
    recentlyViewed: 'Недавно просмотренные',
    
    // Actions
    addToFavorites: 'Добавить в избранное',
    removeFromFavorites: 'Удалить из избранного',
    shareProduct: 'Поделиться товаром',
    requestPrice: 'Запросить цену',
    requestCallback: 'Заказать звонок',
    downloadPDF: 'Скачать PDF',
    viewQR: 'Показать QR код',
    
    // Search
    searchProducts: 'Поиск товаров',
    searchResults: 'Результаты поиска',
    noResults: 'Ничего не найдено',
    tryDifferentKeywords: 'Попробуйте другие ключевые слова',
    
    // Settings
    settings: 'Настройки',
    language: 'Язык',
    aboutUs: 'О нас',
    contactUs: 'Свяжитесь с нами',
    termsAndConditions: 'Условия использования',
    
    // Company
    companyName: 'Название компании',
    phoneNumber: 'Номер телефона',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    address: 'Адрес',
  },
  
  en: {
    // Navigation
    home: 'Home',
    categories: 'Categories',
    favorites: 'Favorites',
    profile: 'Profile',
    search: 'Search',
    
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    share: 'Share',
    contact: 'Contact',
    call: 'Call',
    viewAll: 'View All',
    
    // Product
    products: 'Products',
    productCode: 'Product Code',
    description: 'Description',
    specifications: 'Specifications',
    material: 'Material',
    size: 'Size',
    thickness: 'Thickness',
    colors: 'Colors',
    price: 'Price',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    relatedProducts: 'Related Products',
    newArrivals: 'New Arrivals',
    popular: 'Popular',
    recentlyViewed: 'Recently Viewed',
    
    // Actions
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    shareProduct: 'Share Product',
    requestPrice: 'Request Price',
    requestCallback: 'Request Callback',
    downloadPDF: 'Download PDF',
    viewQR: 'View QR Code',
    
    // Search
    searchProducts: 'Search Products',
    searchResults: 'Search Results',
    noResults: 'No Results Found',
    tryDifferentKeywords: 'Try different keywords',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    termsAndConditions: 'Terms and Conditions',
    
    // Company
    companyName: 'Company Name',
    phoneNumber: 'Phone Number',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    address: 'Address',
  },
};
