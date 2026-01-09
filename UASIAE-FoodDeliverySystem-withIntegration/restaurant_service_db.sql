-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 22 Des 2025 pada 19.59
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant_service_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `category` varchar(50) DEFAULT 'Makanan',
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `menu_items`
--

INSERT INTO `menu_items` (`id`, `restaurant_id`, `name`, `description`, `price`, `stock`, `is_available`, `category`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sate Padang (Daging)', 'Sate daging sapi dengan kuah kuning kental khas Padang.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(2, 1, 'Sate Padang (Lidah)', 'Sate lidah sapi dengan kuah kuning kental yang gurih.', 27000.00, 30, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(3, 1, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya dan empuk.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(4, 1, 'Gulai Ikan', 'Gulai ikan dengan kuah kuning yang segar dan pedas.', 28000.00, 35, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(5, 1, 'Es Teh Manis', 'Es teh manis segar khas Padang.', 5000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(6, 1, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(7, 2, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda yang lengkap.', 20000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(8, 2, 'Ayam Goreng', 'Ayam goreng krispi dengan sambal terasi yang pedas.', 22000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(9, 2, 'Pepes Ikan', 'Pepes ikan mas dengan bumbu kemangi yang harum.', 25000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(10, 2, 'Tumis Kangkung', 'Tumis kangkung dengan terasi yang gurih.', 12000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(11, 2, 'Kerupuk', 'Kerupuk renyah sebagai pelengkap.', 3000.00, 200, 1, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(12, 2, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(13, 3, 'Bakso Malang', 'Bakso urat dengan mie dan siomay yang lengkap.', 18000.00, 70, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(14, 3, 'Bakso Bakar', 'Bakso bakar dengan bumbu kecap manis yang nikmat.', 20000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(15, 3, 'Bakso Urat', 'Bakso urat dengan kuah kaldu yang gurih.', 22000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(16, 3, 'Mie Ayam', 'Mie ayam dengan topping lengkap dan kuah kaldu.', 15000.00, 80, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(17, 3, 'Kerupuk Bakso', 'Kerupuk untuk bakso.', 2000.00, 150, 1, 'Add On', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(18, 3, 'Es Campur', 'Es campur dengan berbagai topping yang segar.', 8000.00, 80, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(19, 4, 'Nasi Goreng Kambing', 'Nasi goreng kambing dengan bumbu rempah yang khas.', 30000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(20, 4, 'Nasi Goreng Seafood', 'Nasi goreng dengan seafood yang lengkap.', 28000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(21, 4, 'Nasi Goreng Spesial', 'Nasi goreng spesial dengan telur dan ayam.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(22, 4, 'Kerupuk Udang', 'Kerupuk udang renyah.', 5000.00, 100, 1, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(23, 4, 'Es Teh Tawar', 'Es teh tawar segar.', 4000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(24, 5, 'Gudeg Komplit', 'Gudeg dengan nasi, ayam, telur, dan sambal krecek.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(25, 5, 'Gudeg Kering', 'Gudeg kering dengan bumbu yang meresap.', 20000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(26, 5, 'Sambal Krecek', 'Sambal krecek pedas khas Jogja.', 8000.00, 80, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(27, 5, 'Es Jeruk Nipis', 'Es jeruk nipis segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(28, 6, 'Rawon Setan', 'Rawon daging sapi dengan kuah hitam khas Surabaya.', 28000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(29, 6, 'Rawon Komplit', 'Rawon dengan telur asin dan kerupuk udang.', 32000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(30, 6, 'Kerupuk Udang', 'Kerupuk udang renyah.', 5000.00, 100, 1, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(31, 6, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(32, 7, 'Pempek Kapal Selam', 'Pempek dengan telur di dalamnya.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(33, 7, 'Pempek Lenjer', 'Pempek lenjer dengan kuah cuko yang asam manis.', 20000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(34, 7, 'Pempek Adaan', 'Pempek adaan bulat dengan kuah cuko.', 18000.00, 70, 1, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(35, 7, 'Tekwan', 'Tekwan dengan kuah kaldu udang yang gurih.', 22000.00, 55, 1, 'Makanan', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(36, 7, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(37, 8, 'Soto Betawi', 'Soto Betawi dengan daging sapi dan kuah santan yang gurih.', 30000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(38, 8, 'Soto Betawi Komplit', 'Soto Betawi dengan jeroan dan daging sapi.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(39, 8, 'Kerupuk', 'Kerupuk renyah.', 3000.00, 100, 1, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(40, 8, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(41, 9, 'Gado-Gado', 'Gado-gado dengan bumbu kacang yang khas.', 20000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(42, 9, 'Ketoprak', 'Ketoprak dengan tahu, lontong, dan bumbu kacang.', 18000.00, 70, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(43, 9, 'Lontong Sayur', 'Lontong sayur dengan kuah santan yang gurih.', 15000.00, 80, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(44, 9, 'Kerupuk', 'Kerupuk renyah.', 3000.00, 100, 1, 'Jajanan', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(45, 9, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(46, 10, 'Ayam Betutu', 'Ayam betutu dengan bumbu rempah khas Bali yang kaya.', 40000.00, 35, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(47, 10, 'Bebek Betutu', 'Bebek betutu dengan bumbu rempah yang meresap.', 45000.00, 30, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(48, 10, 'Lawar', 'Lawar khas Bali dengan bumbu yang segar.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(49, 10, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(50, 11, 'Coto Makassar', 'Coto Makassar dengan daging sapi dan jeroan.', 30000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(51, 11, 'Coto Komplit', 'Coto Makassar komplit dengan semua isian.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(52, 11, 'Burasa', 'Burasa khas Makassar sebagai pelengkap.', 8000.00, 80, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(53, 11, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(54, 12, 'Sop Konro', 'Sop konro dengan iga sapi yang empuk.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(55, 12, 'Sop Konro Komplit', 'Sop konro komplit dengan semua isian.', 40000.00, 35, 1, 'Makanan', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(56, 12, 'Burasa', 'Burasa khas Makassar.', 8000.00, 80, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(57, 12, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(58, 13, 'Pepes Ikan Mas', 'Pepes ikan mas dengan bumbu kemangi yang harum.', 28000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(59, 13, 'Pepes Ayam', 'Pepes ayam dengan bumbu rempah yang khas.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(60, 13, 'Nasi Liwet', 'Nasi liwet dengan lauk pauk khas Sunda.', 20000.00, 60, 1, 'Makanan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(61, 13, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(62, 14, 'Sate Kambing', 'Sate kambing dengan bumbu kacang yang khas.', 30000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(63, 14, 'Sate Kambing Muda', 'Sate kambing muda yang empuk dan gurih.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(64, 14, 'Gule Kambing', 'Gule kambing dengan kuah santan yang gurih.', 32000.00, 42, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(65, 14, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(66, 15, 'Rendang', 'Rendang daging sapi dengan bumbu rempah yang kaya.', 35000.00, 40, 1, 'Makanan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(67, 15, 'Gulai Ayam', 'Gulai ayam dengan kuah kuning yang gurih.', 25000.00, 50, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(68, 15, 'Ayam Pop', 'Ayam pop dengan sambal hijau yang pedas.', 22000.00, 55, 1, 'Makanan', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(69, 15, 'Gulai Ikan', 'Gulai ikan dengan kuah kuning yang segar.', 28000.00, 45, 1, 'Makanan', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(70, 15, 'Es Teh Manis', 'Es teh manis segar.', 5000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(71, 15, 'Es Jeruk', 'Es jeruk peras segar.', 6000.00, 100, 1, 'Minuman', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20');

-- --------------------------------------------------------

--
-- Struktur dari tabel `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cuisine_type` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `is_open` tinyint(1) DEFAULT 1,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `restaurants`
--

INSERT INTO `restaurants` (`id`, `name`, `cuisine_type`, `address`, `is_open`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 'Sate Padang Asli', 'Padang', 'Jl. Cihampelas No. 20, Bandung', 1, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(2, 'Warung Nasi Sunda', 'Sunda', 'Jl. Setiabudi No. 50, Bandung', 1, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(3, 'Bakso Malang Cak Kar', 'Jawa', 'Jl. Dago No. 100, Bandung', 1, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(4, 'Nasi Goreng Kambing Kebon Sirih', 'Jawa', 'Jl. Kebon Sirih No. 15, Jakarta', 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(5, 'Gudeg Jogja Bu Tjitro', 'Jawa', 'Jl. Malioboro No. 25, Yogyakarta', 1, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(6, 'Rawon Setan Surabaya', 'Jawa', 'Jl. Embong Malang No. 30, Surabaya', 1, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(7, 'Pempek Palembang Asli', 'Sumatera', 'Jl. Sudirman No. 45, Palembang', 1, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(8, 'Soto Betawi Haji Husein', 'Betawi', 'Jl. Fatmawati No. 60, Jakarta', 1, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(9, 'Gado-Gado Boplo', 'Betawi', 'Jl. Thamrin No. 70, Jakarta', 1, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(10, 'Ayam Betutu Khas Bali', 'Bali', 'Jl. Raya Ubud No. 80, Bali', 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(11, 'Coto Makassar Daeng Tata', 'Sulawesi', 'Jl. Ahmad Yani No. 90, Makassar', 1, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(12, 'Sop Konro Karebosi', 'Sulawesi', 'Jl. Karebosi No. 100, Makassar', 1, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(13, 'Pepes Ikan Mas Sunda', 'Sunda', 'Jl. Padjadjaran No. 110, Bandung', 1, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(14, 'Sate Kambing Madura', 'Madura', 'Jl. Diponegoro No. 120, Surabaya', 1, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20'),
(15, 'Nasi Padang Sederhana', 'Padang', 'Jl. Gatot Subroto No. 130, Jakarta', 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop', '2025-12-20 21:28:20', '2025-12-20 21:28:20');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_restaurant_menu` (`restaurant_id`,`name`),
  ADD KEY `idx_restaurant_id` (`restaurant_id`),
  ADD KEY `idx_is_available` (`is_available`),
  ADD KEY `idx_category` (`category`);

--
-- Indeks untuk tabel `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_name_address` (`name`,`address`(100)),
  ADD KEY `idx_cuisine_type` (`cuisine_type`),
  ADD KEY `idx_is_open` (`is_open`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT untuk tabel `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
